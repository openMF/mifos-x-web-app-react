/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const TOKEN_KEY = 'mifosToken'

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  if (!token) {
    return {}
  }

  return {
    Authorization: `Basic ${token}`,
    'Fineract-Platform-TenantId':
      import.meta.env.VITE_FINERACT_PLATFORM_TENANT_IDENTIFIER,
  }
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
  const url = import.meta.env.VITE_FINERACT_API_URL || 'https://localhost:8443';
  const provider = import.meta.env.VITE_FINERACT_API_PROVIDER || '/fineract-provider';
  const version = import.meta.env.VITE_FINERACT_API_VERSION || '/api';

  // Cleans up trailing slashes and combines them safely
  return `${url.replace(/\/$/, '')}${provider}${version}`;
}