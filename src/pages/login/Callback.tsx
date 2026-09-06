/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { useTranslation } from 'react-i18next'

import { isOidcUsable } from '@/lib/oidc-config'
import { clearAuthToken, clearOidcToken, setOidcToken } from '@/lib/http-client'
import fineract from '@/lib/axios'

/**
 * Waits for the provider to finish exchanging the authorization code, then
 * routes onwards. Mirrors the Angular callback component: home on success,
 * back to login with an error otherwise.
 */
const CallbackHandler = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  useEffect(() => {
    if (auth.isLoading) return

    const accessToken = auth.user?.access_token
    const expiresAt = auth.user?.expires_at

    // Either the exchange failed or the route was opened without a code.
    if (!auth.isAuthenticated || !accessToken) {
      if (auth.error) {
        console.error('OIDC callback failed', auth.error)
      }
      clearOidcToken()
      navigate('/login', { replace: true, state: { oidcError: true } })
      return
    }

    let cancelled = false

    // Signing in at the provider is not the same as being accepted by
    // Fineract: the server only honours bearer tokens when its oauth profile
    // is active. Confirm against /userdetails — as the Angular client does —
    // before handing the user a session, so a rejected token surfaces here
    // instead of as 401s on every screen of /home.
    const establishSession = async () => {
      try {
        // Validate with a request-scoped header rather than storing the token
        // first: if this component unmounts mid-request, nothing has been
        // persisted, so an unvalidated token can never survive into a reload.
        await fineract.get('v1/userdetails', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (cancelled) return
        setOidcToken(accessToken, expiresAt)
        // The OIDC session replaces any password session, so the two
        // credentials never coexist.
        clearAuthToken()
        navigate('/home', { replace: true })
      } catch (error) {
        if (cancelled) return
        console.error('Fineract rejected the OIDC access token', error)
        clearOidcToken()
        navigate('/login', { replace: true, state: { oidcError: true } })
      }
    }

    void establishSession()

    return () => {
      cancelled = true
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.error,
    auth.user?.access_token,
    auth.user?.expires_at,
    navigate,
  ])

  return (
    <div className="flex items-center justify-center h-screen text-zinc-500">
      {t('login.ssoCompleting')}
    </div>
  )
}

const Callback = () => {
  if (!isOidcUsable()) {
    return <Navigate to="/login" replace />
  }

  return <CallbackHandler />
}

export default Callback
