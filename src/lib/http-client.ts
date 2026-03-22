/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { envConfig } from './env-config'

const TOKEN_KEY = 'mifosToken'

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Fineract-Platform-TenantId': envConfig.tenantId,
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Basic ${token}`
  }

  return headers
}

export const getDefaultHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export const getAllHeaders = (): Record<string, string> => {
  return {
    ...getDefaultHeaders(),
    ...getAuthHeaders(),
  }
}

export const getApiBaseUrl = (): string => {
  const url = envConfig.apiUrl
  const provider = envConfig.apiProvider
  const version = envConfig.apiVersion

  // When apiUrl is empty, build a relative URL so the request goes
  // through the same origin (nginx reverse-proxy → local Fineract)
  const base = url ? url.replace(/\/$/, '') : ''
  return `${base}${provider}${version}`
}
