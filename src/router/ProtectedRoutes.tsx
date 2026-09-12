/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Outlet, Navigate } from 'react-router-dom'

import { hasSession } from '@/lib/http-client'

const ProtectedRoutes = () => {
  // Either sign-in flow (Basic password login or OIDC) counts as a session.
  return hasSession() ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoutes
