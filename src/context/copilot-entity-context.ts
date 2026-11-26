/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createContext } from 'react'

export interface CopilotEntityDetails {
  clientName?: string | null
  clientId?: number | null
  loanId?: number | null
  savingsId?: number | null
}

export interface CopilotEntityContextType {
  entity: CopilotEntityDetails | null
  setEntity: (entity: CopilotEntityDetails | null) => void
}

export const CopilotEntityContext = createContext<CopilotEntityContextType>({
  entity: null,
  setEntity: () => {},
})
