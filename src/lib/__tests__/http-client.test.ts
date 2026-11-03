/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * Stub the runtime configuration (window.__env) and what the sign-in page
 * stored (localStorage), then load the modules fresh so they read it.
 */
function stub(env: Record<string, string>, stored: Record<string, string>) {
  vi.resetModules()
  vi.stubGlobal('window', {
    __env: env,
    location: { origin: 'https://app.example.org', pathname: '/home' },
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

/** The axios client, answering every request itself and recording it. */
async function loadAxios() {
  const { default: fineract } = await import('../axios')
  const sent: InternalAxiosRequestConfig[] = []
  fineract.defaults.adapter = async config => {
    sent.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  return { fineract, sent }
}

const signedInToTenant2 = {
  mifosTenant: 'tenant2',
  mifosToken: 'bWlmb3M6cGFzc3dvcmQ=',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getTenantOptions', () => {
  it('offers the configured tenant first, then each listed one once', async () => {
    stub(
      {
        FINERACT_PLATFORM_TENANT_IDENTIFIER: 'tenant2',
        FINERACT_PLATFORM_TENANTS_IDENTIFIER: ' default, tenant2 ,,tenant3',
      },
      {}
    )
    const { getTenantOptions } = await import('../http-client')
    expect(getTenantOptions()).toEqual(['tenant2', 'default', 'tenant3'])
  })

  it('offers the default tenant when Docker left the variables empty', async () => {
    stub(
      {
        FINERACT_PLATFORM_TENANT_IDENTIFIER: '',
        FINERACT_PLATFORM_TENANTS_IDENTIFIER: '',
      },
      {}
    )
    const { getTenantOptions } = await import('../http-client')
    expect(getTenantOptions()).toEqual(['default'])
  })
})

describe('getTenantId', () => {
  it('is the tenant chosen at sign-in', async () => {
    stub({ FINERACT_PLATFORM_TENANT_IDENTIFIER: 'default' }, signedInToTenant2)
    const { getTenantId } = await import('../http-client')
    expect(getTenantId()).toBe('tenant2')
  })

  it('is the configured tenant until one is chosen', async () => {
    stub({ FINERACT_PLATFORM_TENANT_IDENTIFIER: 'tenant2' }, {})
    const { getTenantId } = await import('../http-client')
    expect(getTenantId()).toBe('tenant2')
  })
})

describe('signed in to a tenant other than the configured one', () => {
  const env = { FINERACT_PLATFORM_TENANT_IDENTIFIER: 'default' }

  it('signs in to the chosen tenant', async () => {
    stub(env, { mifosTenant: 'tenant2' })
    const { sent } = await loadAxios()
    const { loginFineract } = await import('@/pages/login/loginApi')

    await loginFineract('mifos', 'password')

    // Fineract reads the header first, so it decides the tenant.
    expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant2')
    expect(sent[0].params).toEqual({ tenantIdentifier: 'tenant2' })
  })

  it('sends that tenant from the generated clients', async () => {
    stub(env, signedInToTenant2)
    const { getAllHeaders } = await import('../http-client')
    expect(getAllHeaders()).toMatchObject({
      Authorization: 'Basic bWlmb3M6cGFzc3dvcmQ=',
      'Fineract-Platform-TenantId': 'tenant2',
    })
  })

  it('sends that tenant from the axios client', async () => {
    stub(env, signedInToTenant2)
    const { fineract, sent } = await loadAxios()

    await fineract.get('/offices')

    expect(sent[0].headers.Authorization).toBe('Basic bWlmb3M6cGFzc3dvcmQ=')
    expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant2')
  })
})
