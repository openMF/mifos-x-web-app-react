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

const getBaseURL = () => {
  const rawServer = localStorage.getItem('mifosServer') || 'https://localhost:8443'
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
  const hasAuthorizationHeader = !!(authHeaders['Authorization'] || (authHeaders as any)['authorization'])
  
  if (hasAuthorizationHeader) {
    const tenant = localStorage.getItem('mifosTenant') || 'default'
    authHeaders['Fineract-Platform-TenantId'] = tenant
  }


  Object.assign(config.headers, authHeaders)

  // Update baseURL dynamically in case it changed
  config.baseURL = getBaseURL()

  return config
})

export default fineract
