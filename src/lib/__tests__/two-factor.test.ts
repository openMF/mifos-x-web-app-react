/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

const KEY = btoa('mifos:password')
const OTHER_KEY = btoa('someone:else')
const HEADER = 'Fineract-Platform-TFA-Token'
const DAY = 24 * 60 * 60 * 1000

/** An error the way axios raises it for a refused request. */
function refused(
  status: number,
  data: unknown,
  headers: Record<string, string> = {},
  url = '/v1/offices'
) {
  const config = {
    url,
    headers: new AxiosHeaders(headers),
  } as unknown as InternalAxiosRequestConfig
  return new AxiosError('refused', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  } as AxiosResponse)
}

/** What Spring Security answers before Fineract's own error handling. */
const bare = (status: number) => ({
  timestamp: '2026-11-27T11:54:36.623Z',
  status,
  error: status === 401 ? 'Unauthorized' : 'Forbidden',
  path: '/fineract-provider/api/v1/offices',
})

/** Fineract's answer to a wrong, used or expired one-time code. */
const otpInvalid = {
  httpStatusCode: '403',
  userMessageGlobalisationCode: 'validation.msg.domain.rule.violation',
  errors: [
    {
      userMessageGlobalisationCode: 'error.msg.twofactor.otp.token.invalid',
      defaultUserMessage: 'The provided one time token is invalid',
    },
  ],
}

/** Fineract's sign-in answer for a user who has to enter a code. */
const signInAnswer = {
  username: 'mifos',
  userId: 1,
  base64EncodedAuthenticationKey: KEY,
  authenticated: true,
  officeName: 'Head Office',
  roles: [{ id: 1, name: 'Super user' }],
  shouldRenewPassword: false,
  isTwoFactorAuthenticationRequired: true,
}

const dispatched: Event[] = []

function stub(stored: Record<string, string>) {
  vi.resetModules()
  dispatched.length = 0
  vi.stubGlobal('window', {
    __env: { FINERACT_API_URL: '' },
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

const storedToken = (token: string, validTo = Date.now() + DAY) =>
  JSON.stringify({ token, validTo })

/** A client that records each call and answers with `data`. */
function recordingClient(data: unknown = {}) {
  type Recorded = {
    method: string
    url: string
    body?: unknown
    config: { headers: Record<string, string>; params?: unknown }
  }
  const calls: Recorded[] = []
  const client = {
    get: vi.fn(async (url: string, config?: unknown) => {
      calls.push({ method: 'get', url, config: config as Recorded['config'] })
      return { data }
    }),
    post: vi.fn(async (url: string, body?: unknown, config?: unknown) => {
      calls.push({
        method: 'post',
        url,
        body,
        config: config as Recorded['config'],
      })
      return { data }
    }),
    put: vi.fn(async (url: string, body?: unknown, config?: unknown) => {
      calls.push({
        method: 'put',
        url,
        body,
        config: config as Recorded['config'],
      })
      return { data }
    }),
  }
  return { client: client as unknown as AxiosInstance, calls }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('two-factor token storage', () => {
  it('sends the token with the password credential it belongs to', async () => {
    stub({ mifosToken: KEY, mifosTwoFactorToken: storedToken('abc') })
    const { getAuthHeaders } = await import('../http-client')

    expect(getAuthHeaders()).toEqual({
      'Fineract-Platform-TenantId': 'default',
      Authorization: `Basic ${KEY}`,
      [HEADER]: 'abc',
    })
  })

  it('never sends it without a password credential', async () => {
    stub({ mifosTwoFactorToken: storedToken('abc') })
    const { getAuthHeaders } = await import('../http-client')

    expect(getAuthHeaders()[HEADER]).toBeUndefined()
  })

  it('drops an expired token and then asks for a new code', async () => {
    const stored: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
      mifosTwoFactorToken: storedToken('old', Date.now() - 1000),
    }
    stub(stored)
    const { getAuthHeaders, needsTwoFactorVerification } =
      await import('../http-client')

    expect(getAuthHeaders()[HEADER]).toBeUndefined()
    expect(stored.mifosTwoFactorToken).toBeUndefined()
    expect(needsTwoFactorVerification()).toBe(true)
  })

  it('treats an unreadable stored token as expired', async () => {
    const stored: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorToken: 'not json',
    }
    stub(stored)
    const { getTwoFactorToken } = await import('../http-client')

    expect(getTwoFactorToken()).toBeNull()
    expect(stored.mifosTwoFactorToken).toBeUndefined()
  })

  it('does not ask for a code for a session that never needed one', async () => {
    stub({ mifosToken: KEY })
    const { needsTwoFactorVerification } = await import('../http-client')

    expect(needsTwoFactorVerification()).toBe(false)
  })

  it('does not ask for a code while the token is valid', async () => {
    stub({
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
      mifosTwoFactorToken: storedToken('abc'),
    })
    const { needsTwoFactorVerification } = await import('../http-client')

    expect(needsTwoFactorVerification()).toBe(false)
  })

  it('forgets everything two-factor on sign-out', async () => {
    const stored: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
      mifosTwoFactorToken: storedToken('abc'),
    }
    stub(stored)
    const { clearAuthToken } = await import('../http-client')

    clearAuthToken()

    expect(stored).toEqual({})
  })
})

describe('isTwoFactorRejection', () => {
  const basic = { Authorization: `Basic ${KEY}` }

  it('reads a bare 403 as a missing token', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    expect(isTwoFactorRejection(refused(403, bare(403), basic))).toBe(true)
  })

  it('reads a bare 401 that carried a token as a refused token', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    expect(
      isTwoFactorRejection(
        refused(401, bare(401), { ...basic, [HEADER]: 'expired' })
      )
    ).toBe(true)
  })

  it('leaves a 401 without a token to the caller: that is a wrong password', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    expect(isTwoFactorRejection(refused(401, bare(401), basic))).toBe(false)
  })

  it('ignores a permission error, which has a Fineract error code', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')
    const notAuthorized = {
      httpStatusCode: '403',
      userMessageGlobalisationCode: 'error.msg.not.authorized.to.read.office',
      errors: [{}],
    }

    expect(isTwoFactorRejection(refused(403, notAuthorized, basic))).toBe(false)
  })

  it('ignores the code requests, which answer for themselves', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    for (const url of [
      '/v1/twofactor',
      '/v1/twofactor/validate?token=X',
      'https://fineract.example.org/fineract-provider/api/v1/authentication',
    ]) {
      expect(isTwoFactorRejection(refused(403, bare(403), basic, url))).toBe(
        false
      )
    }
  })

  it('ignores OIDC sessions, whose second factor is the provider', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    expect(
      isTwoFactorRejection(
        refused(403, bare(403), { Authorization: 'Bearer eyJ' })
      )
    ).toBe(false)
  })

  it('finds the headers whatever their letter case', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')
    const error = refused(401, bare(401))
    error.config!.headers = {
      authorization: `Basic ${KEY}`,
      'fineract-platform-tfa-token': 'x',
    } as unknown as AxiosHeaders

    expect(isTwoFactorRejection(error)).toBe(true)
  })

  it('ignores errors without an answer', async () => {
    stub({})
    const { isTwoFactorRejection } = await import('../two-factor')

    expect(isTwoFactorRejection(new Error('offline'))).toBe(false)
    expect(isTwoFactorRejection(new AxiosError('Network Error'))).toBe(false)
  })
})

describe('two-factor requests', () => {
  it('lists only well-formed delivery methods, with the given credential', async () => {
    stub({})
    const { fetchDeliveryMethods } = await import('../two-factor')
    const { client, calls } = recordingClient([
      { name: 'email', target: 'demomfi@mifos.org' },
      { name: 'sms' },
      null,
    ])

    expect(await fetchDeliveryMethods(client, KEY)).toEqual([
      { name: 'email', target: 'demomfi@mifos.org' },
    ])
    expect(calls[0].url).toBe('/v1/twofactor')
    expect(calls[0].config.headers.Authorization).toBe(`Basic ${KEY}`)
  })

  it('treats an unexpected method list as empty', async () => {
    stub({})
    const { fetchDeliveryMethods } = await import('../two-factor')
    const { client } = recordingClient('not a list')

    expect(await fetchDeliveryMethods(client, KEY)).toEqual([])
  })

  it('asks for the extended token when the user wants to be remembered', async () => {
    stub({})
    const { requestOtp } = await import('../two-factor')
    const { client, calls } = recordingClient({ tokenLiveTimeInSec: 300 })

    await requestOtp(client, KEY, 'email', true)

    expect(calls[0]).toMatchObject({
      method: 'post',
      url: '/v1/twofactor',
      config: { params: { deliveryMethod: 'email', extendedToken: true } },
    })
  })

  it('exchanges a code for the access token', async () => {
    stub({})
    const { validateOtp } = await import('../two-factor')
    const token = { token: 'f306c5', validFrom: 1, validTo: 2 }
    const { client, calls } = recordingClient(token)

    expect(await validateOtp(client, KEY, 'P7PF5')).toEqual(token)
    expect(calls[0]).toMatchObject({
      url: '/v1/twofactor/validate',
      config: {
        params: { token: 'P7PF5' },
        headers: { Authorization: `Basic ${KEY}` },
      },
    })
  })

  it('refuses an answer without a token', async () => {
    stub({})
    const { validateOtp } = await import('../two-factor')
    const { client } = recordingClient({})

    await expect(validateOtp(client, KEY, 'P7PF5')).rejects.toThrow()
  })

  it('ends a token at Fineract with the token it ends', async () => {
    stub({})
    const { invalidateAccessToken } = await import('../two-factor')
    const { client, calls } = recordingClient({ resourceIdentifier: 'abc' })

    expect(await invalidateAccessToken(client, KEY, 'abc')).toBe(true)
    expect(calls[0]).toMatchObject({
      url: '/v1/twofactor/invalidate',
      body: { token: 'abc' },
      config: { headers: { Authorization: `Basic ${KEY}`, [HEADER]: 'abc' } },
    })
  })

  it('never fails a sign-out when the token cannot be ended', async () => {
    stub({})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { invalidateAccessToken } = await import('../two-factor')
    const client = {
      post: vi.fn().mockRejectedValue(new Error('offline')),
    } as unknown as AxiosInstance

    expect(await invalidateAccessToken(client, KEY, 'abc')).toBe(false)
  })

  it('recognises a refused code', async () => {
    stub({})
    const { isOtpInvalidError } = await import('../two-factor')

    expect(isOtpInvalidError(refused(403, otpInvalid))).toBe(true)
    expect(isOtpInvalidError(refused(403, bare(403)))).toBe(false)
  })

  it('reads the configuration, or null when two-factor is off', async () => {
    stub({})
    const { fetchTwoFactorConfiguration } = await import('../two-factor')
    const off = {
      get: vi.fn().mockRejectedValue(refused(404, bare(404))),
    } as unknown as AxiosInstance

    expect(await fetchTwoFactorConfiguration(off)).toBeNull()
  })

  it('saves only the settings that changed', async () => {
    stub({})
    const { changedConfiguration } = await import('../two-factor')
    const current = {
      'otp-delivery-email-enable': true,
      'otp-delivery-email-subject': 'Code',
      'otp-delivery-email-body': 'Hello {{username}}',
      'otp-delivery-sms-enable': false,
      'otp-delivery-sms-provider': 1,
      'otp-delivery-sms-text': '{{token}}',
      'otp-token-length': 5,
      'otp-token-live-time': 300,
      'access-token-live-time': 86400,
      'access-token-live-time-extended': 604800,
    }

    expect(
      changedConfiguration(current, {
        ...current,
        'otp-token-length': 6,
        'otp-delivery-sms-enable': true,
      })
    ).toEqual({ 'otp-token-length': 6, 'otp-delivery-sms-enable': true })
  })
})

describe('the fineract client', () => {
  it('announces a missing token so the user can enter a new code', async () => {
    stub({ mifosToken: KEY })
    const { default: fineract } = await import('../axios')
    const { TWO_FACTOR_REQUIRED_EVENT } = await import('../two-factor')
    fineract.defaults.adapter = async config => {
      throw refused(403, bare(403), {
        Authorization: String(config.headers.Authorization),
      })
    }

    await expect(fineract.get('/v1/offices')).rejects.toBeInstanceOf(AxiosError)
    expect(dispatched.map(e => e.type)).toEqual([TWO_FACTOR_REQUIRED_EVENT])
    expect((dispatched[0] as CustomEvent).detail).toEqual({
      authorization: `Basic ${KEY}`,
    })
  })

  it('sends the stored token, but not with a credential given for one request', async () => {
    stub({ mifosToken: KEY, mifosTwoFactorToken: storedToken('abc') })
    const { default: fineract } = await import('../axios')
    const sent: Record<string, unknown>[] = []
    fineract.defaults.adapter = async config => {
      sent.push({ ...config.headers })
      return { data: {}, status: 200, statusText: '', headers: {}, config }
    }

    await fineract.get('/v1/offices')
    await fineract.get('/v1/twofactor', {
      headers: { Authorization: `Basic ${OTHER_KEY}` },
    })

    expect(sent[0][HEADER]).toBe('abc')
    expect(sent[1][HEADER]).toBeUndefined()
    expect(sent[1].Authorization).toBe(`Basic ${OTHER_KEY}`)
  })
})

describe('signing in', () => {
  async function load(
    stored: Record<string, string>,
    answer?: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>
  ) {
    stub(stored)
    const { default: fineract } = await import('../axios')
    if (answer) fineract.defaults.adapter = answer
    const slice = await import('@/pages/login/loginSlice')
    const twoFactor = await import('../two-factor')
    return { slice, twoFactor }
  }

  it('asks for a code and stores nothing when Fineract requires one', async () => {
    const stored: Record<string, string> = {
      mifosTwoFactorToken: storedToken('of-a-previous-user'),
    }
    const { slice, twoFactor } = await load(stored, async config => ({
      data: signInAnswer,
      status: 200,
      statusText: '',
      headers: {},
      config,
    }))

    const result = await slice.loginUser({
      username: 'mifos',
      password: 'password',
      rememberMe: true,
    })(vi.fn(), () => ({}), undefined)

    expect(result.payload).toBe(slice.TWO_FACTOR)
    expect(twoFactor.getPendingVerification()).toMatchObject({
      username: 'mifos',
      authKey: KEY,
      tenant: 'default',
      rememberMe: true,
      reason: 'signIn',
    })
    expect(stored.mifosToken).toBeUndefined()
    expect(stored.mifosUser).toBeUndefined()
  })

  it('finishes the sign-in with the access token', async () => {
    const stored: Record<string, string> = {
      mifosTwoFactorToken: storedToken('of-a-previous-user'),
    }
    const { slice, twoFactor } = await load(stored)
    const verification = {
      username: 'mifos',
      authKey: KEY,
      tenant: 'default',
      rememberMe: false,
      reason: 'signIn' as const,
      user: signInAnswer,
    }
    twoFactor.setPendingVerification(verification)

    const result = await slice.completeTwoFactor({
      verification,
      accessToken: { token: 'new', validFrom: 1, validTo: Date.now() + DAY },
    })(vi.fn(), () => ({}), undefined)

    expect(result.payload).toEqual(signInAnswer)
    expect(stored.mifosToken).toBe(KEY)
    expect(JSON.parse(stored.mifosTwoFactorToken).token).toBe('new')
    expect(stored.mifosTwoFactorRequired).toBe('true')
    expect(twoFactor.getPendingVerification()).toBeNull()
  })

  it('resumes a session whose token expired', async () => {
    const stored: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
    }
    const { slice, twoFactor } = await load(stored)
    const verification = twoFactor.verificationFromStoredSession()!

    expect(verification).toMatchObject({
      username: 'mifos',
      authKey: KEY,
      reason: 'expired',
    })

    const result = await slice.completeTwoFactor({
      verification,
      accessToken: { token: 'again', validFrom: 1, validTo: Date.now() + DAY },
    })(vi.fn(), () => ({}), undefined)

    expect(result.meta.requestStatus).toBe('fulfilled')
    expect(JSON.parse(stored.mifosTwoFactorToken).token).toBe('again')
  })

  it('does not attach a token to a credential that changed meanwhile', async () => {
    const stored: Record<string, string> = { mifosToken: OTHER_KEY }
    const { slice } = await load(stored)

    const result = await slice.completeTwoFactor({
      verification: {
        username: 'mifos',
        authKey: KEY,
        tenant: 'default',
        rememberMe: false,
        reason: 'expired',
      },
      accessToken: { token: 'x', validFrom: 1, validTo: Date.now() + DAY },
    })(vi.fn(), () => ({}), undefined)

    expect(result.payload).toBe(slice.SESSION_CHANGED)
    expect(stored.mifosTwoFactorToken).toBeUndefined()
  })

  it('clears the two-factor state of an earlier session on a plain sign-in', async () => {
    const stored: Record<string, string> = {
      mifosTwoFactorRequired: 'true',
      mifosTwoFactorToken: storedToken('of-a-previous-user'),
    }
    const { slice } = await load(stored, async config => ({
      data: { ...signInAnswer, isTwoFactorAuthenticationRequired: false },
      status: 200,
      statusText: '',
      headers: {},
      config,
    }))

    await slice.loginUser({ username: 'mifos', password: 'password' })(
      vi.fn(),
      () => ({}),
      undefined
    )

    expect(stored.mifosToken).toBe(KEY)
    expect(stored.mifosTwoFactorToken).toBeUndefined()
    expect(stored.mifosTwoFactorRequired).toBeUndefined()
  })
})

describe('returnPath', () => {
  it('goes back to the page a resumed session was on', async () => {
    stub({})
    const { returnPath } = await import('../two-factor')

    expect(returnPath({ from: '/clients?status=active' })).toBe(
      '/clients?status=active'
    )
  })

  it('goes Home for anything that is not a page of this app', async () => {
    stub({})
    const { returnPath } = await import('../two-factor')

    for (const state of [
      null,
      {},
      { from: 42 },
      { from: 'https://evil.example' },
      { from: '//evil.example' },
      { from: '/two-factor' },
      { from: '/login' },
    ]) {
      expect(returnPath(state)).toBe('/home')
    }
  })
})

describe('where the token is kept', () => {
  function stubBoth(
    local: Record<string, string>,
    session: Record<string, string>
  ) {
    stub(local)
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => session[key] ?? null,
      setItem: (key: string, value: string) => {
        session[key] = value
      },
      removeItem: (key: string) => {
        delete session[key]
      },
    })
  }

  it('keeps it for this browser session only without "Remember me"', async () => {
    const local: Record<string, string> = { mifosToken: KEY }
    const session: Record<string, string> = {}
    stubBoth(local, session)
    const http = await import('../http-client')

    http.setTwoFactorToken('abc', Date.now() + DAY, false)

    expect(JSON.parse(session.mifosTwoFactorToken).token).toBe('abc')
    expect(local.mifosTwoFactorToken).toBeUndefined()
    expect(http.getAuthHeaders()[HEADER]).toBe('abc')
    expect(http.isTwoFactorRemembered()).toBe(false)
  })

  it('keeps it across browser restarts with "Remember me"', async () => {
    const local: Record<string, string> = { mifosToken: KEY }
    const session: Record<string, string> = {}
    stubBoth(local, session)
    const http = await import('../http-client')

    http.setTwoFactorToken('abc', Date.now() + DAY, true)

    expect(JSON.parse(local.mifosTwoFactorToken).token).toBe('abc')
    expect(session.mifosTwoFactorToken).toBeUndefined()
    expect(http.isTwoFactorRemembered()).toBe(true)
  })

  it('asks for a new code once the browser session that held it is gone', async () => {
    const local: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
    }
    stubBoth(local, {})
    const http = await import('../http-client')

    expect(http.needsTwoFactorVerification()).toBe(true)
  })

  it('keeps the "Remember me" choice when the user verifies again', async () => {
    stubBoth({ mifosToken: KEY, mifosTwoFactorRequired: 'remembered' }, {})
    const { verificationFromStoredSession } = await import('../two-factor')

    expect(verificationFromStoredSession()?.rememberMe).toBe(true)
  })

  it('drops both copies on sign-out', async () => {
    const local: Record<string, string> = {
      mifosToken: KEY,
      mifosTwoFactorRequired: 'true',
      mifosTwoFactorToken: storedToken('remembered'),
    }
    const session: Record<string, string> = {
      mifosTwoFactorToken: storedToken('session'),
    }
    stubBoth(local, session)
    const http = await import('../http-client')

    http.clearAuthToken()

    expect(local).toEqual({})
    expect(session).toEqual({})
  })
})

describe('sharing the token between tabs', () => {
  const channels: BroadcastChannel[] = []
  afterEach(() => {
    channels.splice(0).forEach(c => c.close())
  })

  /** Another tab of the same browser session holding `token`. */
  function otherTab(authorization: string, token: string) {
    const tab = new BroadcastChannel('mifos-two-factor')
    channels.push(tab)
    tab.onmessage = event => {
      if (
        event.data?.type === 'REQUEST_TOKEN' &&
        event.data.authorization === authorization
      ) {
        tab.postMessage({
          type: 'PROVIDE_TOKEN',
          authorization,
          token,
          validTo: Date.now() + DAY,
        })
      }
    }
  }

  function stubTab(local: Record<string, string>) {
    stub(local)
    vi.stubGlobal('window', {
      ...globalThis.window,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    })
  }

  it('takes the token of another tab signed in with the same credential', async () => {
    const local: Record<string, string> = { mifosToken: KEY }
    stubTab(local)
    otherTab(KEY, 'shared')
    const { requestSharedTwoFactorToken } = await import('../two-factor-sync')
    const { getTwoFactorToken } = await import('../http-client')

    expect(await requestSharedTwoFactorToken(1000)).toBe(true)
    expect(getTwoFactorToken()).toBe('shared')
  })

  it('never takes a token for another credential', async () => {
    const local: Record<string, string> = { mifosToken: KEY }
    stubTab(local)
    otherTab(OTHER_KEY, 'someone-elses')
    const { requestSharedTwoFactorToken } = await import('../two-factor-sync')
    const { getTwoFactorToken } = await import('../http-client')

    expect(await requestSharedTwoFactorToken(200)).toBe(false)
    expect(getTwoFactorToken()).toBeNull()
  })

  it('answers another tab only with a token of this browser session', async () => {
    const local: Record<string, string> = { mifosToken: KEY }
    const session: Record<string, string> = {
      mifosTwoFactorToken: storedToken('mine'),
    }
    stubTab(local)
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => session[key] ?? null,
      setItem: (key: string, value: string) => {
        session[key] = value
      },
      removeItem: (key: string) => {
        delete session[key]
      },
    })
    vi.stubGlobal('window', {
      ...globalThis.window,
      addEventListener: () => {},
    })
    const { startTwoFactorSync } = await import('../two-factor-sync')
    startTwoFactorSync()

    const asker = new BroadcastChannel('mifos-two-factor')
    channels.push(asker)
    const answer = new Promise(resolve => {
      asker.onmessage = event => resolve(event.data)
    })
    asker.postMessage({ type: 'REQUEST_TOKEN', authorization: KEY })

    expect(await answer).toMatchObject({
      type: 'PROVIDE_TOKEN',
      authorization: KEY,
      token: 'mine',
    })
  })
})
