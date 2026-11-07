/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch } from '@/app/hook'
import { getOidcUserManager } from '@/lib/oidc-config'
import { logout } from '@/pages/login/loginSlice'

/**
 * Signs the user out of both authentication flows.
 *
 * Clearing the stored token is not enough for OIDC: oidc-client-ts keeps its
 * own copy of the session, and the provider keeps a third. Leaving either
 * behind means the next sign-in silently resumes as the same user instead of
 * prompting.
 *
 * Reads the UserManager directly rather than through useAuth(), so the hook
 * is safe in components that also render with OIDC disabled, where no
 * AuthProvider is mounted.
 */
export const useLogout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return useCallback(async () => {
    const manager = getOidcUserManager()

    // The stored user, not the mirrored token, is what says a provider
    // session exists: the token is dropped as soon as it expires, and a
    // sign-out after that point still has to reach the provider.
    const oidcUser = await manager?.getUser().catch(() => null)

    dispatch(logout())

    if (manager && oidcUser) {
      try {
        // signoutRedirect() reads the stored user to set id_token_hint and
        // removes it itself, so it has to run before any cleanup of ours —
        // without that hint a provider may decline to end its session.
        // Hands the browser to the provider, which returns to
        // post_logout_redirect_uri; nothing after this runs.
        await manager.signoutRedirect()
        return
      } catch (error) {
        // A provider without an end session endpoint, or one that is
        // unreachable, must not strand the user in a signed-in-looking app.
        // The redirect failed before the library could clean up, so drop the
        // stored user here and finish the sign-out locally.
        console.error('OIDC sign-out at the provider failed', error)
        await manager.removeUser().catch(removeError => {
          console.error('Could not clear the stored OIDC user', removeError)
        })
      }
    }

    navigate('/login', { replace: true })
  }, [dispatch, navigate])
}
