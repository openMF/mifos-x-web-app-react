/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Outlet, Navigate, useLocation } from 'react-router-dom'

import { hasSession, needsTwoFactorVerification } from '@/lib/http-client'
import { useTwoFactorRequired } from '@/hooks/use-two-factor-required'

const ProtectedRoutes = () => {
  const location = useLocation()
  useTwoFactorRequired()

  // A two-factor session whose token expired while the app was closed or
  // idle: every request would be refused, so ask for a new code first.
  if (needsTwoFactorVerification()) {
    return (
      <Navigate
        to="/two-factor"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  // Either sign-in flow (Basic password login or OIDC) counts as a session.
  return hasSession() ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoutes
