/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { envConfig } from './env-config'
import { isSecureUrl } from './secure-url'

const TOKEN_KEY = 'mifosToken'
/**
 * Access token from the OIDC flow. Kept in localStorage so the session
 * survives a reload, matching how oidc-client-ts persists the User object.
 * Mutually exclusive with mifosToken: whichever sign-in ran last clears the
 * other, so the app never holds two identities at once.
 */
const OIDC_TOKEN_KEY = 'mifosOidcAccessToken'
/** Expiry of the OIDC token, epoch seconds, as reported by the provider. */
const OIDC_EXPIRES_AT_KEY = 'mifosOidcExpiresAt'

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * The stored OIDC access token, or null once it has expired.
 *
 * There is no renewal path yet, so an expired token would otherwise sit in
 * storage and keep both the route guard and the request interceptor believing
 * the session is live, turning every screen into a wall of 401s. Dropping it
 * here sends the user back to sign-in instead.
 */
export const getOidcToken = (): string | null => {
  const token = localStorage.getItem(OIDC_TOKEN_KEY)
  if (!token) return null

  const expiresAt = Number(localStorage.getItem(OIDC_EXPIRES_AT_KEY))
  if (expiresAt && expiresAt * 1000 <= Date.now()) {
    clearOidcToken()
    return null
  }

  return token
}

export const setOidcToken = (token: string, expiresAt?: number): void => {
  localStorage.setItem(OIDC_TOKEN_KEY, token)
  if (expiresAt) {
    localStorage.setItem(OIDC_EXPIRES_AT_KEY, String(expiresAt))
  } else {
    localStorage.removeItem(OIDC_EXPIRES_AT_KEY)
  }
}

export const clearOidcToken = (): void => {
  localStorage.removeItem(OIDC_TOKEN_KEY)
  localStorage.removeItem(OIDC_EXPIRES_AT_KEY)
}

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

/** True when either sign-in flow has produced a credential for Fineract. */
export const hasSession = (): boolean => {
  return !!(getOidcToken() || getAuthToken())
}

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Fineract-Platform-TenantId': envConfig.tenantId,
  }

  // The two credentials are kept mutually exclusive at sign-in, so at most
  // one is present; OIDC still wins here as a belt-and-braces guard against
  // ever authenticating as a previous user.
  const oidcToken = getOidcToken()
  if (oidcToken) {
    // Fail closed rather than put a reusable bearer credential on the wire in
    // cleartext. This lives here, not only in the Axios interceptor, because
    // the generated clients take these headers directly via getAllHeaders().
    if (!isSecureUrl(getApiBaseUrl())) {
      console.error(
        'Refusing to attach the OIDC bearer token: the Fineract API URL is not https.'
      )
      return headers
    }
    headers.Authorization = `Bearer ${oidcToken}`
    return headers
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

/**
 * Base URL for OIDC-authenticated requests, when the deployment points the
 * OIDC flow at a different Fineract than the password flow
 * (FINERACT_PLUGIN_OIDC_API_URL). Null when no distinct URL is configured.
 */
export const getOidcApiBaseUrl = (): string | null => {
  if (!envConfig.oidcEnabled || !envConfig.oidcApiUrl) return null

  const base = envConfig.oidcApiUrl.replace(/\/$/, '')
  return `${base}${envConfig.apiProvider}${envConfig.apiVersion}`
}

export const getApiBaseUrl = (): string => {
  // An active OIDC session may target a different Fineract than the password
  // flow. Resolved here so the generated clients, which build their basePath
  // from this function, follow the same routing as the Axios instance.
  const oidcBaseUrl = getOidcApiBaseUrl()
  if (oidcBaseUrl && getOidcToken()) return oidcBaseUrl

  const url = envConfig.apiUrl
  const provider = envConfig.apiProvider
  const version = envConfig.apiVersion

  // When apiUrl is empty, build a relative URL so the request goes
  // through the same origin (nginx reverse-proxy → local Fineract)
  const base = url ? url.replace(/\/$/, '') : ''
  return `${base}${provider}${version}`
}
