/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  getApiBaseUrl,
  getAuthHeaders,
  getDefaultHeaders,
  getOidcApiBaseUrl,
} from '@/lib/http-client'
import { envConfig } from '@/lib/env-config'
import { isSecureUrl } from '@/lib/secure-url'
import {
  endOidcSession,
  isOidcSessionEstablished,
  renewOidcSession,
} from '@/lib/oidc-session'

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

/**
 * Endpoints that are reachable without a credential. A 401 from one of these
 * says nothing about the session, so it must not trigger a renewal. Mirrors
 * the Angular client's TokenInterceptor.
 */
const PUBLIC_ENDPOINTS = ['/auth/test', '/health']

const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false

  // Compare the path alone, so a protected request whose query string merely
  // mentions a public endpoint (?next=/health) is not mistaken for one and
  // denied its renewal. Only the pathname is read, so the base serves just to
  // make a relative request URL parseable.
  let pathname: string
  try {
    pathname = new URL(url, window.location.origin).pathname
  } catch {
    return false
  }

  return PUBLIC_ENDPOINTS.some(endpoint => pathname.endsWith(endpoint))
}

/** Requests already retried once, so a persistent 401 cannot loop. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const redirectToLogin = (): void => {
  // Axios runs outside the router, so this is a full navigation rather than a
  // route change. Skipping the auth routes keeps a 401 raised while signing
  // in from bouncing the page.
  const path = window.location.pathname
  if (path === '/login' || path === '/callback') return

  window.location.assign('/login')
}

fineract.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !config) {
      return Promise.reject(error)
    }

    // Only an OIDC session can be renewed, and the credential the request
    // actually carried is the reliable signal for which one it was: a Basic
    // 401 means wrong password, not an expired token.
    const attempted = String(
      config.headers?.Authorization ?? config.headers?.authorization ?? ''
    )

    if (
      config._retried ||
      !attempted.startsWith('Bearer ') ||
      !isOidcSessionEstablished() ||
      isPublicEndpoint(config.url)
    ) {
      return Promise.reject(error)
    }

    // Set before awaiting, so the retry below is marked no matter how the
    // renewal resolves.
    config._retried = true

    const outcome = await renewOidcSession(attempted.slice('Bearer '.length))

    if (outcome.status === 'invalid') {
      // The credential itself is finished, so there is nothing to come back
      // to; drop the session rather than leave a dead one in storage.
      await endOidcSession()
      redirectToLogin()
      return Promise.reject(error)
    }

    if (outcome.status === 'unavailable') {
      // The provider was unreachable, not disagreeable. Fail this one request
      // and leave the session intact, so a passing outage does not sign the
      // user out of work in progress.
      return Promise.reject(error)
    }

    // The stale bearer is still on the config, and the request interceptor
    // treats a supplied Authorization header as authoritative, so the renewed
    // token has to replace it here or the retry repeats the same 401.
    config.headers.Authorization = `Bearer ${outcome.token}`

    return fineract.request(config)
  }
)

export default fineract
