/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import axios, { type InternalAxiosRequestConfig } from 'axios'

const originalAdapter = axios.defaults.adapter

afterEach(() => {
  axios.defaults.adapter = originalAdapter
  vi.unstubAllGlobals()
})

describe('getConfiguration', () => {
  // Importing the generated client (one ~5 MB module) can take several
  // seconds on a cold cache.
  it(
    'sends the credential and tenant of the current sign-in, not those at load time',
    {
      timeout: 30_000,
    },
    async () => {
      const stored: Record<string, string> = {}
      vi.resetModules()
      vi.stubGlobal('window', {
        __env: { FINERACT_PLATFORM_TENANT_IDENTIFIER: 'default' },
      })
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => stored[key] ?? null,
        setItem: () => {},
        removeItem: () => {},
      })
      const { getConfiguration } = await import('../fineract-openapi')
      const { OfficesApi } = await import('@/fineract-api')

      // The generated clients call through the global axios instance.
      const sent: InternalAxiosRequestConfig[] = []
      axios.defaults.adapter = async config => {
        sent.push(config)
        return { data: [], status: 200, statusText: 'OK', headers: {}, config }
      }

      // Built as the pages build theirs: when the module loads, before sign-in.
      const officesApi = new OfficesApi(getConfiguration())

      stored.mifosTenant = 'tenant2'
      stored.mifosToken = 'dGVuYW50MnVzZXI6c2VjcmV0'
      await officesApi.retrieveOffices()

      expect(sent[0].headers.Authorization).toBe(
        'Basic dGVuYW50MnVzZXI6c2VjcmV0'
      )
      expect(sent[0].headers['Fineract-Platform-TenantId']).toBe('tenant2')
      expect(sent[0].withCredentials).toBe(true)
    }
  )
})
