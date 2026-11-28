/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const KEY = btoa('newuser:Temp#2026pass')

/** An error the way axios raises it for a refused request. */
function refused(
  status: number,
  data: unknown,
  authorization = '',
  tenant = 'default'
) {
  const config = {
    headers: {
      Authorization: authorization,
      'Fineract-Platform-TenantId': tenant,
    },
  } as unknown as InternalAxiosRequestConfig
  return new AxiosError('refused', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  } as AxiosResponse)
}

/** Fineract's answer to a request once the password has to change. */
const outdated = (userId = 7) => ({
  httpStatusCode: '400',
  userMessageGlobalisationCode: 'error.msg.password.outdated',
  defaultUserMessage: `The password of the user with id ${userId} has expired, please reset it`,
  errors: [
    {
      userMessageGlobalisationCode: 'error.msg.password.outdated',
      parameterName: 'userId',
      args: [{ value: userId }],
    },
  ],
})

/** Fineract's 403 sign-in answer for a user who must change their password. */
const mustRenew = {
  username: 'newuser',
  userId: 7,
  base64EncodedAuthenticationKey: KEY,
  authenticated: true,
  shouldRenewPassword: true,
}

const dispatched: Event[] = []

/** Where a sign-in went, behind the proxy (the page's own origin). */
const AT = { server: 'https://app.example.org', tenant: 'default' }

function stub(stored: Record<string, string>, apiUrl = '') {
  vi.resetModules()
  dispatched.length = 0
  vi.stubGlobal('window', {
    __env: { FINERACT_API_URL: apiUrl },
    location: { origin: 'https://app.example.org', pathname: '/home' },
    dispatchEvent: (event: Event) => {
      dispatched.push(event)
      return true
    },
  })
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored[key] ?? null,
    setItem: (key: string, value: string) => {
      stored[key] = value
    },
    removeItem: (key: string) => {
      delete stored[key]
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getSignInRenewal', () => {
  it('reads the 403 Fineract sends when the password must change', async () => {
    stub({})
    const { getSignInRenewal } = await import('../password-renewal')

    expect(
      getSignInRenewal(
        { error: refused(403, mustRenew) },
        'newuser',
        'Temp#2026pass',
        AT
      )
    ).toEqual({
      userId: 7,
      username: 'newuser',
      authKey: KEY,
      reason: 'signIn',
      tenant: 'default',
      server: 'https://app.example.org',
    })
  })

  it('reads the same flag from a 200, as older Fineract sends it', async () => {
    stub({})
    const { getSignInRenewal } = await import('../password-renewal')

    expect(
      getSignInRenewal({ data: mustRenew }, 'newuser', 'Temp#2026pass', AT)
        ?.userId
    ).toBe(7)
  })

  it('builds the key from the credentials when Fineract leaves it out', async () => {
    stub({})
    const { getSignInRenewal } = await import('../password-renewal')
    const body = { ...mustRenew, base64EncodedAuthenticationKey: undefined }

    expect(
      getSignInRenewal(
        { error: refused(403, body) },
        'newuser',
        'Temp#2026pass',
        AT
      )?.authKey
    ).toBe(KEY)
  })

  it('ignores wrong credentials and ordinary sign-ins', async () => {
    stub({})
    const { getSignInRenewal } = await import('../password-renewal')

    expect(
      getSignInRenewal({ error: refused(401, {}) }, 'mifos', 'wrong', AT)
    ).toBeNull()
    // A 403 for another reason, such as a locked account.
    expect(
      getSignInRenewal({ error: refused(403, { userId: 1 }) }, 'mifos', 'x', AT)
    ).toBeNull()
    expect(
      getSignInRenewal(
        { data: { userId: 1, authenticated: true } },
        'mifos',
        'password',
        AT
      )
    ).toBeNull()
    expect(
      getSignInRenewal({ error: new Error('offline') }, 'mifos', 'x', AT)
    ).toBeNull()
  })
})

describe('password outdated errors', () => {
  it('recognises error.msg.password.outdated and the user it names', async () => {
    stub({})
    const { isPasswordOutdatedError, getOutdatedUserId } =
      await import('../password-renewal')
    const error = refused(400, outdated(12))

    expect(isPasswordOutdatedError(error)).toBe(true)
    expect(getOutdatedUserId(error)).toBe(12)
  })

  it('does not mistake other refusals for it', async () => {
    stub({})
    const { isPasswordOutdatedError } = await import('../password-renewal')

    expect(
      isPasswordOutdatedError(
        refused(400, { userMessageGlobalisationCode: 'validation.msg' })
      )
    ).toBe(false)
    expect(isPasswordOutdatedError(refused(403, outdated()))).toBe(false)
    expect(isPasswordOutdatedError(new Error('x'))).toBe(false)
  })

  it("prefers Fineract's field message when explaining a refusal", async () => {
    stub({})
    const { getFineractErrorMessage } = await import('../password-renewal')
    const error = refused(400, {
      defaultUserMessage: 'Validation errors exist.',
      errors: [
        { defaultUserMessage: 'Password must be at least 12 characters' },
      ],
    })

    expect(getFineractErrorMessage(error, 'fallback')).toBe(
      'Password must be at least 12 characters'
    )
    expect(getFineractErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})

describe('changeOwnPassword', () => {
  it('sends the given credential and keeps the tenant', async () => {
    stub({ mifosTenant: 'tenant2' })
    const { default: fineract } = await import('../axios')
    const { changeOwnPassword } = await import('../password-renewal')
    const sent: InternalAxiosRequestConfig[] = []
    fineract.defaults.adapter = async config => {
      sent.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await changeOwnPassword(fineract, 7, 'New#2026pass', 'New#2026pass', KEY)

    expect(sent[0].url).toBe('/v1/users/7/pwd')
    expect(sent[0].method).toBe('post')
    expect(JSON.parse(sent[0].data)).toEqual({
      password: 'New#2026pass',
      repeatPassword: 'New#2026pass',
    })
    expect(sent[0].headers.Authorization).toBe(`Basic ${KEY}`)
    expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant2')
  })

  it('uses the stored credential when none is given', async () => {
    stub({ mifosToken: KEY })
    const { default: fineract } = await import('../axios')
    const { changeOwnPassword } = await import('../password-renewal')
    const sent: InternalAxiosRequestConfig[] = []
    fineract.defaults.adapter = async config => {
      sent.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await changeOwnPassword(fineract, 7, 'a', 'a')

    expect(sent[0].headers.Authorization).toBe(`Basic ${KEY}`)
  })
})

describe('password expiry during a session', () => {
  const expiredEvents = () =>
    dispatched.filter(e => e.type === 'mifos:password-expired')

  it('announces it when a password session is refused', async () => {
    stub({ mifosToken: KEY })
    const { default: fineract } = await import('../axios')
    fineract.defaults.adapter = async config => {
      throw refused(400, outdated(7), String(config.headers.Authorization))
    }

    await expect(fineract.get('/v1/clients')).rejects.toBeInstanceOf(AxiosError)
    expect(expiredEvents()).toHaveLength(1)
    expect((expiredEvents()[0] as CustomEvent).detail).toEqual({
      userId: 7,
      authorization: `Basic ${KEY}`,
      tenant: 'default',
    })
  })

  it('announces it for the generated clients, which use the global axios', async () => {
    stub({ mifosToken: KEY })
    await import('../axios')
    const { default: globalAxios } = await import('axios')

    await expect(
      globalAxios.get('https://app.example.org/x', {
        adapter: async () => {
          throw refused(400, outdated(7), `Basic ${KEY}`)
        },
      })
    ).rejects.toBeInstanceOf(AxiosError)
    expect(expiredEvents().length).toBeGreaterThan(0)
  })

  it('leaves bearer sessions and other errors alone', async () => {
    stub({ mifosToken: KEY })
    const { default: fineract } = await import('../axios')

    fineract.defaults.adapter = async () => {
      throw refused(400, outdated(7), 'Bearer abc')
    }
    await expect(fineract.get('/v1/clients')).rejects.toBeDefined()

    fineract.defaults.adapter = async config => {
      throw refused(
        400,
        { userMessageGlobalisationCode: 'validation.msg' },
        String(config.headers.Authorization)
      )
    }
    await expect(fineract.get('/v1/clients')).rejects.toBeDefined()

    expect(expiredEvents()).toHaveLength(0)
  })
})

describe('isForCurrentSession', () => {
  it('only accepts reports about the current credential and tenant', async () => {
    stub({})
    const { isForCurrentSession } = await import('../password-renewal')
    const report = {
      userId: 7,
      authorization: `Basic ${KEY}`,
      tenant: 'default',
    }

    expect(isForCurrentSession(report, KEY, 'default')).toBe(true)
    // Sent before the password was changed on Profile.
    expect(
      isForCurrentSession(report, btoa('newuser:Other#2026x'), 'default')
    ).toBe(false)
    // Sent before signing in to another tenant with the same credentials.
    expect(isForCurrentSession(report, KEY, 'tenant2')).toBe(false)
    expect(isForCurrentSession(report, null, 'default')).toBe(false)
    expect(isForCurrentSession(undefined, KEY, 'default')).toBe(false)
  })
})

describe('sign-in renewal edge cases', () => {
  it('records where the sign-in went, not what is stored now', async () => {
    stub({ mifosTenant: 'tenant2' })
    const { getSignInRenewal } = await import('../password-renewal')
    const renewal = getSignInRenewal(
      { error: refused(403, mustRenew) },
      'newuser',
      'x',
      { server: 'https://a.example.org', tenant: 'tenant1' }
    )

    expect(renewal?.tenant).toBe('tenant1')
    expect(renewal?.server).toBe('https://a.example.org')
  })

  it('handles passwords outside Latin-1, as Fineract accepts them', async () => {
    stub({})
    const { getSignInRenewal } = await import('../password-renewal')
    // Fineract decodes Basic credentials as UTF-8.
    const utf8Key = Buffer.from('newuser:Пароль€₹#2026', 'utf8').toString(
      'base64'
    )

    expect(
      getSignInRenewal({ error: refused(401, {}) }, 'mifos', '密碼', AT)
    ).toBeNull()
    expect(
      getSignInRenewal(
        {
          error: refused(403, {
            ...mustRenew,
            base64EncodedAuthenticationKey: undefined,
          }),
        },
        'newuser',
        'Пароль€₹#2026',
        AT
      )?.authKey
    ).toBe(utf8Key)
  })
})

describe('Basic credential encoding', () => {
  const sample = 'renewdemo:Пароль€₹#2026密碼'

  it('encodes the UTF-8 bytes, matching what Fineract decodes', async () => {
    stub({})
    const { encodeBase64Utf8, encodeBasicCredential } =
      await import('../http-client')

    expect(encodeBase64Utf8(sample)).toBe(
      Buffer.from(sample, 'utf8').toString('base64')
    )
    expect(encodeBasicCredential('renewdemo', 'Пароль€₹#2026密碼')).toBe(
      encodeBase64Utf8(sample)
    )
  })

  it('gives the same result as btoa for plain ASCII', async () => {
    stub({})
    const { encodeBasicCredential } = await import('../http-client')

    expect(encodeBasicCredential('mifos', 'password')).toBe(
      btoa('mifos:password')
    )
  })

  it('decodes back to the same text', async () => {
    stub({})
    const { decodeBase64Utf8, encodeBase64Utf8 } =
      await import('../http-client')

    expect(decodeBase64Utf8(encodeBase64Utf8(sample))).toBe(sample)
  })

  it('stores a UTF-8 credential at sign-in', async () => {
    const stored: Record<string, string> = {}
    stub(stored)
    const { setBasicCredentials } = await import('../http-client')

    setBasicCredentials('renewdemo', 'Пароль€₹#2026')

    expect(stored.mifosToken).toBe(
      Buffer.from('renewdemo:Пароль€₹#2026', 'utf8').toString('base64')
    )
  })
})

describe('describeError', () => {
  it('keeps the credential and passwords out of what is logged', async () => {
    stub({})
    const { describeError } = await import('../password-renewal')
    const error = refused(400, outdated(7), `Basic ${KEY}`)
    error.config!.data = JSON.stringify({ password: 'New#2026Secret' })

    const logged = describeError(error)

    expect(logged).toEqual({
      status: 400,
      code: 'error.msg.password.outdated',
    })
    expect(JSON.stringify(logged)).not.toContain(KEY)
    expect(JSON.stringify(logged)).not.toContain('New#2026Secret')
    expect(describeError(new TypeError('x'))).toEqual({ code: 'TypeError' })
  })
})

describe('session snapshots', () => {
  it('notice a sign-in to another tenant or as another user', async () => {
    const stored: Record<string, string> = {
      mifosToken: KEY,
      mifosTenant: 'default',
      mifosUser: JSON.stringify({ userId: 7, username: 'newuser' }),
    }
    stub(stored)
    const { captureSession, isSameSession } =
      await import('../password-renewal')
    const before = captureSession()

    expect(before).toEqual({
      token: KEY,
      server: 'https://app.example.org',
      tenant: 'default',
      userId: 7,
      username: 'newuser',
    })
    expect(isSameSession(before, captureSession())).toBe(true)

    stored.mifosTenant = 'tenant2'
    expect(isSameSession(before, captureSession())).toBe(false)

    stored.mifosTenant = 'default'
    stored.mifosUser = JSON.stringify({ userId: 9, username: 'other' })
    expect(isSameSession(before, captureSession())).toBe(false)

    // Same id, someone else: ids repeat across tenants.
    stored.mifosUser = JSON.stringify({ userId: 7, username: 'other' })
    expect(isSameSession(before, captureSession())).toBe(false)

    stored.mifosUser = JSON.stringify({ userId: 7, username: 'newuser' })
    stored.mifosToken = btoa('newuser:Other#2026x')
    expect(isSameSession(before, captureSession())).toBe(false)
  })

  it('tell whether a session belongs to the user a page shows', async () => {
    stub({})
    const { isSessionOf } = await import('../password-renewal')
    const shown = { userId: 7, username: 'newuser' }
    const session = {
      token: KEY,
      server: AT.server,
      tenant: 'default',
      userId: 7,
      username: 'newuser',
    }

    expect(isSessionOf(session, shown, AT)).toBe(true)
    expect(isSessionOf({ ...session, username: 'other' }, shown, AT)).toBe(
      false
    )
    expect(isSessionOf({ ...session, userId: 9 }, shown, AT)).toBe(false)
    expect(isSessionOf(session, shown, { ...AT, tenant: 'tenant2' })).toBe(
      false
    )
    expect(
      isSessionOf(session, shown, { ...AT, server: 'https://b.example.org' })
    ).toBe(false)
    expect(isSessionOf({ ...session, token: null }, shown, AT)).toBe(false)
  })
})

describe('requests bound to a target', () => {
  it('go to that server and tenant even after another tab changes them', async () => {
    const stored: Record<string, string> = {
      mifosServer: 'https://a.example.org',
      mifosTenant: 'tenant1',
      mifosToken: KEY,
    }
    stub(stored, 'https://a.example.org')
    const { default: fineract } = await import('../axios')
    const { changeOwnPassword } = await import('../password-renewal')
    const { captureTarget } = await import('../http-client')
    const sent: InternalAxiosRequestConfig[] = []
    fineract.defaults.adapter = async config => {
      sent.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }
    const target = captureTarget()

    // Another tab signs in elsewhere.
    stored.mifosServer = 'https://b.example.org'
    stored.mifosTenant = 'tenant2'

    await changeOwnPassword(
      fineract,
      7,
      'New#2026pass',
      'New#2026pass',
      KEY,
      target
    )

    expect(sent[0].url).toBe(
      'https://a.example.org/fineract-provider/api/v1/users/7/pwd'
    )
    expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant1')
  })

  it('keep the shared server and tenant when none is given', async () => {
    const stored: Record<string, string> = {
      mifosServer: 'https://a.example.org',
      mifosTenant: 'tenant1',
      mifosToken: KEY,
    }
    stub(stored, 'https://a.example.org')
    const { default: fineract } = await import('../axios')
    const sent: InternalAxiosRequestConfig[] = []
    fineract.defaults.adapter = async config => {
      sent.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await fineract.get('/v1/offices')

    expect(sent[0].baseURL).toBe('https://a.example.org/fineract-provider/api/')
    expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant1')
  })
})

describe('loginUser', () => {
  async function signIn(
    stored: Record<string, string>,
    answer: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>
  ) {
    stub(stored)
    const { default: fineract } = await import('../axios')
    fineract.defaults.adapter = answer
    const { loginUser } = await import('@/pages/login/loginSlice')
    const renewal = await import('../password-renewal')
    const result = await loginUser({
      username: 'newuser',
      password: 'Temp#2026pass',
    })(vi.fn(), () => ({}), undefined)
    return { result, renewal }
  }

  it('asks for a new password and stores nothing when Fineract requires one', async () => {
    const stored: Record<string, string> = {}
    const { result, renewal } = await signIn(stored, async () => {
      throw refused(403, mustRenew)
    })

    expect(result.payload).toBe('renewPassword')
    expect(renewal.getPendingRenewal()).toEqual({
      userId: 7,
      username: 'newuser',
      authKey: KEY,
      reason: 'signIn',
      tenant: 'default',
      server: 'https://app.example.org',
    })
    expect(stored.mifosToken).toBeUndefined()
    expect(stored.mifosUser).toBeUndefined()
  })

  it('keeps the tenant the sign-in was sent to if another tab changes it', async () => {
    const stored: Record<string, string> = { mifosTenant: 'tenant1' }
    const { renewal } = await signIn(stored, async config => {
      stored.mifosTenant = 'tenant2'
      throw refused(
        403,
        mustRenew,
        '',
        String(config.headers['Fineract-Platform-TenantId'])
      )
    })

    expect(renewal.getPendingRenewal()?.tenant).toBe('tenant1')
  })

  it('stores the credential and the user on an ordinary sign-in', async () => {
    const stored: Record<string, string> = {}
    const { result, renewal } = await signIn(stored, async config => ({
      data: {
        userId: 7,
        username: 'newuser',
        officeName: 'Head Office',
        roles: [{ id: 1, name: 'Super user' }],
        authenticated: true,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))

    expect(result.type).toBe('auth/login/fulfilled')
    expect(renewal.getPendingRenewal()).toBeNull()
    expect(stored.mifosToken).toBe(KEY)
    expect(JSON.parse(stored.mifosUser)).toEqual({
      userId: 7,
      username: 'newuser',
      officeName: 'Head Office',
      roles: [{ id: 1, name: 'Super user' }],
    })
  })

  it('still reports wrong credentials as a failed sign-in', async () => {
    const { result } = await signIn({}, async () => {
      throw refused(401, {})
    })

    expect(result.payload).toBe('Login failed')
  })
})
