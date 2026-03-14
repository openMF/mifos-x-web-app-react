/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import axios from 'axios'
import {
  getApiBaseUrl,
  getAuthHeaders,
  getDefaultHeaders,
} from '@/lib/http-client'
import { envConfig } from '@/lib/env-config'

const getBaseURL = () => {
  const rawServer =
    localStorage.getItem('mifosServer') || 'https://localhost:8443'
  const server = rawServer.trim().replace(/\/+$/, '')
  return `${server}/fineract-provider/api/`
}

const fineract = axios.create({
  baseURL: getApiBaseUrl(),
  headers: getDefaultHeaders(),
  withCredentials: true,
})

fineract.interceptors.request.use(config => {
  const authHeaders = getAuthHeaders()
  // Ensure tenant header is set if an Authorization header is present
  const hasAuthorizationHeader = !!(
    authHeaders['Authorization'] || (authHeaders as any)['authorization']
  )

  if (hasAuthorizationHeader) {
    const tenant = localStorage.getItem('mifosTenant') || 'default'
    authHeaders['Fineract-Platform-TenantId'] = tenant
  }

  Object.assign(config.headers, authHeaders)

  // Only override baseURL from localStorage when NOT running behind the
  // Docker/nginx reverse-proxy.  In Docker, envConfig.apiUrl is empty and
  // the axios instance was already created with a correct relative baseURL
  // (e.g. "/fineract-provider/api/") that routes through the same-origin
  // nginx proxy — overriding it with the localStorage value would break
  // that by sending the request directly to https://localhost:8443.
  if (envConfig.apiUrl) {
    config.baseURL = getBaseURL()
  }

  return config
})

export default fineract
