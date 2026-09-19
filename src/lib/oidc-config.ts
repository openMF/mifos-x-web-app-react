/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

import { envConfig } from '@/lib/env-config'
import { isSecureUrl } from '@/lib/secure-url'

/**
 * Scopes requested from the provider. offline_access is deliberately absent:
 * it yields a refresh token, a long-lived credential this client has no way
 * to use yet (no silent renew, no 401 renewal) and would only persist. It
 * belongs with the renewal work, not before it.
 */
const OIDC_SCOPE = 'openid profile email'

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
 * Builds the OIDC client configuration from the runtime environment.
 * Mirrors the Angular web app's getOIDCConfig().
 */
export const getOidcConfig = (): AuthProviderProps => {
  const frontendUrl = getFrontendUrl()

  return {
    authority: envConfig.oidcBaseUrl,
    client_id: envConfig.oidcClientId,
    redirect_uri: `${frontendUrl}/callback`,
    post_logout_redirect_uri: `${frontendUrl}/login`,
    response_type: 'code',
    scope: OIDC_SCOPE,
    // Silent renew is off, matching the Angular client. Note that no renewal
    // path exists yet either: once the access token expires, calls fail until
    // the user signs in again. Renewal follows in the child issues.
    automaticSilentRenew: false,
    // Persist the session across reloads, matching how the Basic-auth token
    // is stored today.
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    // Strip the authorization code from the URL once the exchange completes.
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname)
    },
  }
}
