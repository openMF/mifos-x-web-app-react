/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Outlet, Navigate } from 'react-router-dom'

const ProtectedRoutes = () => {
  const token = localStorage.getItem('mifosToken')
  return token ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoutes
