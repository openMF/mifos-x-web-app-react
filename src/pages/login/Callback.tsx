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

import {
  getOidcUserManager,
  isOidcUsable,
  isSilentRenewFrame,
} from '@/lib/oidc-config'
import { useAppDispatch } from '@/app/hook'
import {
  clearAuthToken,
  clearOidcToken,
  setOidcToken,
  setOidcUserDetails,
} from '@/lib/http-client'
import { markOidcSessionEstablished } from '@/lib/oidc-session'
import {
  fetchSignedInUser,
  SignInError,
  type SignInFailure,
} from '@/lib/oidc-users-api'
import { oidcSignedIn } from '@/pages/login/loginSlice'

/** Navigation state the login page reads to explain a failed SSO sign-in. */
export interface OidcCallbackState {
  oidcError: SignInFailure
}

/**
 * Waits for the provider to finish exchanging the authorization code, then
 * routes onwards. Mirrors the Angular callback component: home on success,
 * back to login with an error otherwise.
 */
const CallbackHandler = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation('auth')

  useEffect(() => {
    if (auth.isLoading) return

    const accessToken = auth.user?.access_token
    const expiresAt = auth.user?.expires_at
    const subject = auth.user?.profile.sub

    const fail = (reason: SignInFailure) => {
      clearOidcToken()
      const state: OidcCallbackState = { oidcError: reason }
      navigate('/login', { replace: true, state })
    }

    // Either the exchange failed or the route was opened without a code.
    if (!auth.isAuthenticated || !accessToken || !subject) {
      if (auth.error) {
        console.error('OIDC callback failed', auth.error)
      }
      fail('failed')
      return
    }

    let cancelled = false

    // Signing in at the provider is not the same as being accepted by
    // Mifos: the user also needs a Fineract record, with an office and roles.
    // The security plugin checks both and reports who the user is — as the
    // Angular client does — before a session is handed out, so a rejected
    // sign-in surfaces here instead of as errors on every screen of /home.
    const establishSession = async () => {
      try {
        // The token is passed to the request rather than stored first: if
        // this component unmounts mid-request, nothing has been persisted, so
        // an unaccepted token can never survive into a reload.
        const details = await fetchSignedInUser(accessToken, subject)
        if (cancelled) return
        setOidcToken(accessToken, expiresAt)
        setOidcUserDetails(details)
        // Only now may background renewals write to the token store.
        markOidcSessionEstablished()
        // The OIDC session replaces any password session, so the two
        // credentials never coexist.
        clearAuthToken()
        dispatch(oidcSignedIn(details))
        navigate('/home', { replace: true })
      } catch (error) {
        if (cancelled) return
        console.error('The OIDC sign-in was not accepted', error)
        fail(error instanceof SignInError ? error.reason : 'failed')
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
    auth.user?.profile.sub,
    dispatch,
    navigate,
  ])

  return (
    <div className="flex items-center justify-center h-screen text-zinc-500">
      {t('login.ssoCompleting')}
    </div>
  )
}

/**
 * Completes a renewal started by oidc-client-ts in a hidden iframe.
 *
 * silent_redirect_uri defaults to redirect_uri, so that iframe loads this
 * route. It has to post the result back to the parent window rather than run
 * the interactive flow, which would navigate inside the frame and leave the
 * renewal waiting until it timed out.
 */
const SilentRenewHandler = () => {
  useEffect(() => {
    const manager = getOidcUserManager()
    if (!manager) return

    manager.signinSilentCallback().catch(error => {
      console.error('OIDC silent renewal callback failed', error)
    })
  }, [])

  return null
}

const Callback = () => {
  if (!isOidcUsable()) {
    return <Navigate to="/login" replace />
  }

  if (isSilentRenewFrame()) {
    return <SilentRenewHandler />
  }

  return <CallbackHandler />
}

export default Callback
