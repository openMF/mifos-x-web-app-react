/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useLocation } from 'react-router-dom'

import { savingsAccountBasePath } from './savings-account-menu'

/**
 * Path of the savings account the current page belongs to, such as
 * `/clients/12/savings-accounts/34`, so action pages return to the client or
 * group the account belongs to. Null outside a savings account page.
 */
export function useSavingsAccountPath(): string | null {
  const base = savingsAccountBasePath(useLocation().pathname)
  return base ? `/${base}` : null
}
