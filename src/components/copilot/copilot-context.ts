/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createContext } from 'react'

import type { SendResult } from '@/hooks/use-copilot-chat'
import type { CopilotThread } from '@/lib/copilot'

/** The conversation and the panel around it. Changes with every word. */
export interface CopilotState {
  thread: CopilotThread
  /** Whether the panel is open. */
  open: boolean
  /** Something arrived while the panel was closed and is not yet seen. */
  unread: boolean
  /** The first answer that arrived while the panel was closed: "New" goes
   * above it. Cleared by the next question. */
  newFrom: string | null
  /** The question being typed, kept while the panel is closed. */
  draft: string
}

/** What can be done with the conversation. Stable across renders. */
export interface CopilotActions {
  send: (text: string) => SendResult
  stop: () => void
  reset: () => void
  setOpen: (open: boolean) => void
  setDraft: (text: string) => void
}

// Two contexts: the actions never change, so a component that only needs
// them is not re-rendered for every streamed word.
export const CopilotStateContext = createContext<CopilotState | null>(null)
export const CopilotActionsContext = createContext<CopilotActions | null>(null)
