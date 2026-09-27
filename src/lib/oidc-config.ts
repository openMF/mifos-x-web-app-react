/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import type { UserManagerSettings } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

import { envConfig } from '@/lib/env-config'
import { isSecureUrl } from '@/lib/secure-url'

/**
 * Scopes requested from the provider. offline_access yields the refresh token
 * that automaticSilentRenew and the 401 recovery path both consume; without
 * it oidc-client-ts falls back to renewing through a hidden iframe, which is
 * unreliable wherever third-party cookies are restricted.
 */
const OIDC_SCOPE = 'openid profile email offline_access'

/**
 * Base URL the provider redirects back to. Falls back to the current origin
 * when no explicit frontend URL is configured.
 */
const getFrontendUrl = (): string => {
  const configured = envConfig.oidcFrontendUrl
  if (!configured) return window.location.origin

  // OAuth requires an absolute, registered redirect_uri, so resolve a
  // path-only value (e.g. "/mifos") against the current origin rather than
  // handing oidc-client-ts something the provider would reject.
  try {
    return new URL(configured, window.location.origin).href.replace(/\/$/, '')
  } catch {
    return window.location.origin
  }
}

/**
 * Whether OIDC is enabled and configured safely enough to mount the provider.
 * Falls back to the Basic auth flow when it is not, rather than starting a
 * flow that cannot complete.
 */
export const isOidcUsable = (): boolean => {
  if (!envConfig.oidcEnabled) return false

  if (!envConfig.oidcBaseUrl || !envConfig.oidcClientId) {
    console.error(
      'OIDC is enabled but oidcBaseUrl or oidcClientId is missing; falling back to password sign-in.'
    )
    return false
  }

  const redirectUri = `${getFrontendUrl()}/callback`
  if (!isSecureUrl(envConfig.oidcBaseUrl) || !isSecureUrl(redirectUri)) {
    console.error(
      'OIDC requires https outside local development; falling back to password sign-in.'
    )
    return false
  }

  // The access token is sent to Fineract as a bearer credential, so the API
  // destination has to be as protected as the provider itself.
  const apiUrl = envConfig.oidcApiUrl || envConfig.apiUrl
  if (!isSecureUrl(apiUrl)) {
    console.error(
      'OIDC requires an https Fineract API URL outside local development; falling back to password sign-in.'
    )
    return false
  }

  return true
}

/**
 * Builds the OIDC client settings from the runtime environment.
 * Mirrors the Angular web app's getOIDCConfig().
 */
const getOidcSettings = (): UserManagerSettings => {
  const frontendUrl = getFrontendUrl()

  return {
    authority: envConfig.oidcBaseUrl,
    client_id: envConfig.oidcClientId,
    redirect_uri: `${frontendUrl}/callback`,
    post_logout_redirect_uri: `${frontendUrl}/login`,
    response_type: 'code',
    scope: OIDC_SCOPE,
    // Renew in the background shortly before expiry so a working session is
    // never interrupted. The 401 handler in lib/axios covers the cases this
    // cannot catch: a token revoked or invalidated server-side.
    automaticSilentRenew: true,
    // Persist the session across reloads, matching how the Basic-auth token
    // is stored today.
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  }
}

/**
 * The single UserManager for the application.
 *
 * Held here rather than left to AuthProvider to construct internally, because
 * renewal is driven from lib/axios — a plain module with no access to React
 * context. Both sides must operate on the same instance, or a token renewed
 * by one would be invisible to the other.
 *
 * Null whenever OIDC is unusable, so callers outside the provider tree can
 * branch on it without having to re-check the configuration themselves.
 */
let userManager: UserManager | null = null
let userManagerResolved = false

export const getOidcUserManager = (): UserManager | null => {
  if (userManagerResolved) return userManager

  userManagerResolved = true
  userManager = isOidcUsable() ? new UserManager(getOidcSettings()) : null

  return userManager
}

/**
 * True when this document is the hidden iframe oidc-client-ts opens to renew
 * a session without a refresh token. silent_redirect_uri defaults to
 * redirect_uri, so that iframe loads /callback; it must complete the silent
 * handshake rather than run the interactive callback, which would leave the
 * parent window waiting for a message that never arrives.
 */
export const isSilentRenewFrame = (): boolean => {
  try {
    return window.self !== window.top
  } catch {
    // Cross-origin framing throws on access; treat it as framed.
    return true
  }
}

/**
 * Props for react-oidc-context's AuthProvider, bound to the shared
 * UserManager above.
 */
export const getOidcProviderProps = (): AuthProviderProps => {
  return {
    userManager: getOidcUserManager() ?? undefined,
    // Inside the silent-renew iframe the code and state belong to the silent
    // handshake, which Callback completes itself; letting the provider
    // consume them first would race it for a single-use authorization code.
    skipSigninCallback: isSilentRenewFrame(),
    // Strip the authorization code from the URL once the exchange completes.
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname)
    },
  }
}
