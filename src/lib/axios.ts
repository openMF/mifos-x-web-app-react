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
  getOidcApiBaseUrl,
} from '@/lib/http-client'
import { envConfig } from '@/lib/env-config'
import { isSecureUrl } from '@/lib/secure-url'

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

  // A caller-supplied Authorization header wins: the OIDC callback validates
  // a token this way before storing it, so it must not be overwritten by the
  // stored credential (which at that point is the old session, or none).
  const suppliedAuth =
    config.headers?.Authorization ?? config.headers?.authorization
  if (suppliedAuth) {
    delete authHeaders.Authorization
  }

  // Ensure tenant header is set if an Authorization header is present
  const hasAuthorizationHeader = !!(
    suppliedAuth || authHeaders['Authorization']
  )

  if (hasAuthorizationHeader) {
    const tenant = localStorage.getItem('mifosTenant') || 'default'
    authHeaders['Fineract-Platform-TenantId'] = tenant
  }

  Object.assign(config.headers, authHeaders)

  const authorization = String(
    suppliedAuth ?? authHeaders['Authorization'] ?? ''
  )
  const usingBearer = authorization.startsWith('Bearer ')
  const oidcApiBaseUrl = getOidcApiBaseUrl()

  if (usingBearer && oidcApiBaseUrl) {
    // The OIDC session may belong to a different Fineract than the password
    // flow; sending it to the default one would have it rejected.
    config.baseURL = oidcApiBaseUrl
  } else if (envConfig.apiUrl) {
    // Only override baseURL from localStorage when NOT running behind the
    // Docker/nginx reverse-proxy.  In Docker, envConfig.apiUrl is empty and
    // the axios instance was already created with a correct relative baseURL
    // (e.g. "/fineract-provider/api/") that routes through the same-origin
    // nginx proxy — overriding it with the localStorage value would break
    // that by sending the request directly to https://localhost:8443.
    config.baseURL = getBaseURL()
  }

  // The bearer token is a reusable credential, so never let it leave over
  // cleartext. This also covers the localStorage server override, which can
  // point somewhere the startup configuration check never saw.
  //
  // Axios ignores baseURL when the request url is itself absolute, so the
  // destination that actually gets contacted is the one to validate.
  const isAbsolute = (value?: string) =>
    !!value && /^([a-z][a-z\d+\-.]*:)?\/\//i.test(value)
  const destination = isAbsolute(config.url)
    ? (config.url as string)
    : (config.baseURL ?? '')

  if (usingBearer && !isSecureUrl(destination)) {
    throw new Error(
      `Refusing to send an OIDC bearer token to a non-https Fineract URL: ${destination}`
    )
  }

  return config
})

export default fineract
