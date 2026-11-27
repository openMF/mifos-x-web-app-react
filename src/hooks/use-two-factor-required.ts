/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { clearTwoFactorToken, getAuthToken } from '@/lib/http-client'
import {
  getPendingVerification,
  setPendingVerification,
  TWO_FACTOR_REQUIRED_EVENT,
  verificationFromStoredSession,
  type TwoFactorRequiredDetail,
} from '@/lib/two-factor'

/**
 * Opens the code page when Fineract refuses a request because the session's
 * two-factor token is missing, expired or ended. The password is still
 * stored, so the user only enters a new code and carries on.
 */
export const useTwoFactorRequired = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const onRequired = (event: Event) => {
      const detail = (event as CustomEvent<TwoFactorRequiredDetail>).detail
      const token = getAuthToken()
      // Sent with a credential that is no longer the stored one, such as a
      // request from before a sign-in as someone else: nothing to verify.
      if (!token || detail?.authorization !== `Basic ${token}`) return

      // Several requests usually fail at once; the first one sets this up.
      if (getPendingVerification()?.reason !== 'expired') {
        const verification = verificationFromStoredSession()
        if (!verification) return
        setPendingVerification(verification)
      }
      // Fineract no longer accepts it, so stop sending it.
      clearTwoFactorToken()

      // Already there: a later failure must not replace the page to return to.
      if (window.location.pathname === '/two-factor') return
      // Come back to the same page once the code is accepted.
      const from = window.location.pathname + window.location.search
      navigate('/two-factor', { replace: true, state: { from } })
    }

    window.addEventListener(TWO_FACTOR_REQUIRED_EVENT, onRequired)
    return () =>
      window.removeEventListener(TWO_FACTOR_REQUIRED_EVENT, onRequired)
  }, [navigate])
}
