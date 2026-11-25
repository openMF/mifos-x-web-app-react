/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch } from '@/app/hook'
import {
  captureTarget,
  decodeBase64Utf8,
  getAuthToken,
  getSignedInUser,
  getTenantId,
} from '@/lib/http-client'
import {
  getPendingRenewal,
  isForCurrentSession,
  PASSWORD_EXPIRED_EVENT,
  setPendingRenewal,
  type PasswordExpiredDetail,
} from '@/lib/password-renewal'
import { logout } from '@/pages/login/loginSlice'

/** The username a Basic credential (base64 of username:password) is for. */
const usernameFromToken = (token: string): string | null => {
  try {
    const decoded = decodeBase64Utf8(token)
    const separator = decoded.indexOf(':')
    return separator > 0 ? decoded.slice(0, separator) : null
  } catch {
    return null
  }
}

/**
 * Opens the renewal page when Fineract reports that the signed-in user's
 * password has expired. Without it every page would just fail to load.
 */
export const usePasswordExpiry = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const onExpired = (event: Event) => {
      const detail = (event as CustomEvent<PasswordExpiredDetail>).detail
      const token = getAuthToken()
      // Sent with a password that has been changed since: nothing to renew.
      if (!isForCurrentSession(detail, token, getTenantId())) return

      // Several requests usually fail at once; the first one sets this up.
      if (!getPendingRenewal()) {
        const user = getSignedInUser()
        const reportedId = detail?.userId
        const userId = user?.userId ?? reportedId
        const username =
          user?.username ?? (token ? usernameFromToken(token) : null)

        if (!token || !userId || !username) {
          // Nothing to change the password with. Signing in again gets the
          // user id and key from Fineract's sign-in answer.
          dispatch(logout())
          navigate('/login', { replace: true })
          return
        }

        setPendingRenewal({
          userId,
          username,
          authKey: token,
          reason: 'expired',
          ...captureTarget(),
        })
      }
      navigate('/renew-password', { replace: true })
    }

    window.addEventListener(PASSWORD_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(PASSWORD_EXPIRED_EVENT, onExpired)
  }, [dispatch, navigate])
}
