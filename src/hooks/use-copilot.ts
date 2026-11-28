/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useContext } from 'react'

import {
  CopilotActionsContext,
  CopilotStateContext,
  type CopilotActions,
  type CopilotState,
} from '@/components/copilot/copilot-context'

/** The Copilot conversation and panel state, from `CopilotProvider`. */
export function useCopilotState(): CopilotState {
  const state = useContext(CopilotStateContext)
  if (!state) throw new Error('useCopilotState needs a CopilotProvider')
  return state
}

/** Send, stop, reset, open and close, from `CopilotProvider`. */
export function useCopilotActions(): CopilotActions {
  const actions = useContext(CopilotActionsContext)
  if (!actions) throw new Error('useCopilotActions needs a CopilotProvider')
  return actions
}
