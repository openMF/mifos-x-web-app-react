/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CopilotErrorCode, CopilotMessage, TurnPhase } from '@/lib/copilot'
// The reducer module, not the package index: the index reads the deployment
// config on load, which this file (and its tests) must not depend on.
import { isTurnActive } from '@/lib/copilot/reducer'

/** Any one of these lets an officer see the Copilot, as in the Angular app. */
export const COPILOT_PERMISSIONS = [
  'ALL_FUNCTIONS',
  'USE_MCP_TOOLS',
  'READ_COPILOT',
] as const

/**
 * Whether to offer the Copilot to the signed-in officer.
 *
 * This only decides whether the button is shown. What the assistant can do is
 * decided by Fineract, which checks the officer's own credential on every
 * call. Permissions are only known right after a password sign-in; after a
 * reload or an OIDC sign-in the app does not hold them, and hiding the
 * button then would hide it from everyone, so it is shown.
 */
export function canUseCopilot(enabled: boolean, permissions: unknown): boolean {
  if (!enabled) return false
  if (!Array.isArray(permissions)) return true
  return permissions.some(permission =>
    (COPILOT_PERMISSIONS as readonly unknown[]).includes(permission)
  )
}

export type CopilotErrorKey =
  | 'errors.timedOut'
  | 'errors.streamFailed'
  | 'errors.sessionExpired'
  | 'errors.permissionDenied'
  | 'errors.rateLimited'
  | 'errors.toolFailed'

/**
 * The translated message for an error the gateway did not describe itself.
 * The browser's own wording ("Failed to fetch") is never shown: it tells an
 * officer nothing they can act on.
 */
export function errorMessageKey(code: CopilotErrorCode): CopilotErrorKey {
  switch (code) {
    case 'LLM_UNAVAILABLE':
      return 'errors.timedOut'
    case 'AUTH_EXPIRED':
      return 'errors.sessionExpired'
    case 'PERMISSION_DENIED':
      return 'errors.permissionDenied'
    case 'RATE_LIMITED':
      return 'errors.rateLimited'
    case 'TOOL_FAILED':
      return 'errors.toolFailed'
    default:
      return 'errors.streamFailed'
  }
}

/**
 * The part of an answer to show. While it streams, a ```suggest block the
 * model is still writing is hidden: it becomes the chips once the answer is
 * finished, and should never flash up as raw text.
 */
export function visibleText(text: string, streaming: boolean): string {
  if (!streaming) return text
  const fence = text.search(/```suggest\b/i)
  return (fence === -1 ? text : text.slice(0, fence)).trimEnd()
}

/** Whole seconds for "Thought for N s", never shown as zero. */
export function elapsedSeconds(ms: number): number {
  return Math.max(1, Math.round(ms / 1000))
}

/** One question and every answer it got: asking again adds a branch. */
export interface Turn {
  question?: CopilotMessage
  answers: CopilotMessage[]
}

/**
 * Groups the conversation into turns. The same question asked again right
 * after its answer, by "Ask again" or retyped, becomes another branch of
 * that turn rather than a repeat of the question.
 */
export function groupTurns(messages: CopilotMessage[]): Turn[] {
  const turns: Turn[] = []
  for (const message of messages) {
    const last = turns[turns.length - 1]
    if (message.role === 'assistant') {
      if (last) last.answers.push(message)
      else turns.push({ answers: [message] })
    } else if (
      last?.question?.text === message.text &&
      last.answers.length > 0 &&
      !last.answers[last.answers.length - 1].streaming
    ) {
      continue
    } else {
      turns.push({ question: message, answers: [] })
    }
  }
  return turns
}

/**
 * Where the panel sits: floating above its button, docked to the right edge,
 * or filling the screen. Phones always get the whole screen.
 */
export const DISPLAY_MODES = ['floating', 'docked', 'fullscreen'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

export function isDisplayMode(value: unknown): value is DisplayMode {
  return (DISPLAY_MODES as readonly unknown[]).includes(value)
}

/**
 * Whether a turn just left the officer something to read: it finished,
 * failed, or stopped to ask for a confirmation. Shown on the closed launcher
 * as an unread dot.
 */
export function replyArrived(previous: TurnPhase, next: TurnPhase): boolean {
  return isTurnActive(previous) && !isTurnActive(next)
}

export type DayPart = 'morning' | 'afternoon' | 'evening'

/** Which greeting fits the hour on the officer's own clock (0 to 23). */
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}
