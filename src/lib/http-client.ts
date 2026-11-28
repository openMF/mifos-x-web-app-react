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
/** Tenant chosen on the sign-in page. */
const TENANT_KEY = 'mifosTenant'
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
 * Tenants the sign-in page offers: the configured tenant first, then the
 * others listed in FINERACT_PLATFORM_TENANTS_IDENTIFIER, without blanks or
 * repeats.
 */
export const getTenantOptions = (): string[] => {
  const tenants = [envConfig.tenantId, ...envConfig.tenantIds.split(',')]
    .map(tenant => tenant.trim())
    .filter(Boolean)
  return tenants.length > 0 ? [...new Set(tenants)] : ['default']
}

/**
 * The tenant every Fineract request is made in: the one chosen at sign-in,
 * otherwise the configured one.
 *
 * Fineract checks the credential against that tenant's users, so the
 * generated clients, the axios instance and the Copilot must all send the
 * same one. A request that sent another tenant would be refused with a 401.
 */
export const getTenantId = (): string => {
  return localStorage.getItem(TENANT_KEY) || getTenantOptions()[0]
}

export const setTenantId = (tenant: string): void => {
  localStorage.setItem(TENANT_KEY, tenant)
}

/**
 * The stored OIDC access token, or null once it has expired.
 *
 * Renewal normally replaces the token before this matters. This remains the
 * backstop for when it does not — a renewal that failed, or a tab restored
 * long after the session lapsed — because an expired token left in storage
 * would keep both the route guard and the request interceptor believing the
 * session is live, turning every screen into a wall of 401s. Dropping it here
 * sends the user back to sign-in instead.
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

/** Stores an encoded Basic credential (base64 of username:password). */
export const setBasicToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

/** The username a Basic credential (base64 of username:password) is for. */
export const usernameFromBasicToken = (token: string): string | null => {
  try {
    const bytes = Uint8Array.from(atob(token), char => char.charCodeAt(0))
    const decoded = new TextDecoder().decode(bytes)
    const separator = decoded.indexOf(':')
    return separator > 0 ? decoded.slice(0, separator) : null
  } catch {
    return null
  }
}

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  clearTwoFactorState()
}

/**
 * Two-factor authentication. When Fineract runs with
 * fineract.security.2fa.enabled, a password sign-in is only half of it: every
 * request also needs the access token Fineract gives for a valid one-time
 * code, in the Fineract-Platform-TFA-Token header. The token belongs to the
 * stored Basic credential, so it is kept beside it and dropped with it.
 */
export const TWO_FACTOR_HEADER = 'Fineract-Platform-TFA-Token'
const TFA_TOKEN_KEY = 'mifosTwoFactorToken'
/**
 * Set when the stored password session went through two-factor verification.
 * It outlives the token, so once the token expires the app asks for a new
 * code instead of sending requests Fineract will refuse.
 */
const TFA_REQUIRED_KEY = 'mifosTwoFactorRequired'

export interface StoredTwoFactorToken {
  token: string
  /** Epoch milliseconds, as Fineract reports it. */
  validTo: number
}

/**
 * Where the token is kept, as in the Angular web app: with "Remember me" in
 * localStorage, so it survives closing the browser for as long as Fineract's
 * extended token lasts; otherwise in sessionStorage, so closing the browser
 * ends the verification and the next visit asks for a new code. Other tabs
 * of the same browser session get it through two-factor-sync.
 */
const tokenStores = (): Storage[] =>
  typeof sessionStorage === 'undefined'
    ? [localStorage]
    : [sessionStorage, localStorage]

const readToken = (store: Storage): StoredTwoFactorToken | null => {
  const raw = store.getItem(TFA_TOKEN_KEY)
  if (!raw) return null
  try {
    const stored = JSON.parse(raw) as StoredTwoFactorToken
    if (
      typeof stored?.token === 'string' &&
      stored.token &&
      typeof stored.validTo === 'number' &&
      stored.validTo > Date.now()
    ) {
      return { token: stored.token, validTo: stored.validTo }
    }
  } catch {
    // Unreadable: treated like an expired token.
  }
  store.removeItem(TFA_TOKEN_KEY)
  return null
}

/** The stored two-factor access token and its expiry, or null. */
export const getStoredTwoFactorToken = (): StoredTwoFactorToken | null => {
  for (const store of tokenStores()) {
    const stored = readToken(store)
    if (stored) return stored
  }
  return null
}

/** The stored two-factor access token, or null once it has expired. */
export const getTwoFactorToken = (): string | null =>
  getStoredTwoFactorToken()?.token ?? null

export const setTwoFactorToken = (
  token: string,
  validTo: number,
  remember = false
): void => {
  const stored: StoredTwoFactorToken = { token, validTo }
  clearTwoFactorToken()
  const store =
    remember || typeof sessionStorage === 'undefined'
      ? localStorage
      : sessionStorage
  store.setItem(TFA_TOKEN_KEY, JSON.stringify(stored))
  localStorage.setItem(TFA_REQUIRED_KEY, remember ? 'remembered' : 'true')
}

/** True when the session was verified with "Remember me". */
export const isTwoFactorRemembered = (): boolean =>
  localStorage.getItem(TFA_REQUIRED_KEY) === 'remembered'

/** Drops the access token but remembers that this session needs one. */
export const clearTwoFactorToken = (): void => {
  for (const store of tokenStores()) store.removeItem(TFA_TOKEN_KEY)
}

/** Drops everything two-factor: for sign-out and for a new sign-in. */
export const clearTwoFactorState = (): void => {
  clearTwoFactorToken()
  localStorage.removeItem(TFA_REQUIRED_KEY)
}

/**
 * True when the stored password session needs a new two-factor code before
 * Fineract accepts anything: it was verified once, and that token is gone.
 */
export const needsTwoFactorVerification = (): boolean =>
  !getOidcToken() &&
  !!getAuthToken() &&
  !!localStorage.getItem(TFA_REQUIRED_KEY) &&
  !getTwoFactorToken()

/** True when either sign-in flow has produced a credential for Fineract. */
export const hasSession = (): boolean => {
  return !!(getOidcToken() || getAuthToken())
}

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Fineract-Platform-TenantId': getTenantId(),
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
    // Only with the password credential it was issued for. It travels with
    // the same requests as that password, so it needs no stricter transport
    // rule than the password itself.
    const twoFactorToken = getTwoFactorToken()
    if (twoFactorToken) {
      headers[TWO_FACTOR_HEADER] = twoFactorToken
    }
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
 * Base URL of the Mifos security plugin's /authentication endpoints
 * (FINERACT_PLUGIN_OIDC_API_URL), with a trailing slash. Null when OIDC is off
 * or no plugin URL is configured.
 *
 * This is only for the plugin's user administration calls. Fineract's own REST
 * API keeps its normal base URL in OIDC mode and just carries the bearer
 * token, which is how the Angular client uses the same setting.
 */
export const getOidcPluginBaseUrl = (): string | null => {
  if (!envConfig.oidcEnabled || !envConfig.oidcApiUrl) return null

  // Resolved to an absolute URL because Axios joins any non-absolute request
  // URL onto the Fineract baseURL, even one starting with "/". A same-origin
  // value such as "/fineract-provider/" would otherwise be requested under
  // "/fineract-provider/api/".
  try {
    const resolved = new URL(envConfig.oidcApiUrl, window.location.origin).href
    return `${resolved.replace(/\/+$/, '')}/`
  } catch {
    return null
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
