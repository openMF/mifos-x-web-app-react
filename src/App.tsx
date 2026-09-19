/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AuthProvider } from 'react-oidc-context'
import { store } from '@/app/store'
import { getOidcConfig, isOidcUsable } from '@/lib/oidc-config'
import AppRoutes from './router/AppRoutes'

const App = () => {
  const routes = (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )

  return (
    <Provider store={store}>
      {isOidcUsable() ? (
        <AuthProvider {...getOidcConfig()}>{routes}</AuthProvider>
      ) : (
        routes
      )}
    </Provider>
  )
}

export default App
