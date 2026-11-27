/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo, useState, type ReactNode } from 'react'
import {
  CopilotEntityContext,
  type CopilotEntityDetails,
} from './copilot-entity-context'

/**
 * Provider that allows active page views (ClientsView, LoansView, etc.)
 * to register active entity details (such as clientName) that cannot be inferred
 * from URL route parameters alone.
 */
export function CopilotContextProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<CopilotEntityDetails | null>(null)

  const value = useMemo(() => ({ entity, setEntity }), [entity])

  return (
    <CopilotEntityContext.Provider value={value}>
      {children}
    </CopilotEntityContext.Provider>
  )
}
