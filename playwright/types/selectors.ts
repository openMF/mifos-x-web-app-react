/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Each Page Object defines a SelectorMap interface.
 * Both Angular and React repos implement the same interface
 * with framework-specific selectors.
 */
export interface LoginSelectors {
  usernameInput: string
  passwordInput: string
  loginButton: string
  errorMessage: string
  loadingIndicator?: string
}

// Future Page Objects add their interfaces here:
// export interface ClientsSelectors { ... }
// export interface DashboardSelectors { ... }
