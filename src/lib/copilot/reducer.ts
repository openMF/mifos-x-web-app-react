/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ApprovalRequest,
  CopilotErrorCode,
  CopilotEvent,
  DisplayCard,
} from './events'
import type { Decision } from './transport'

/**
 * Where the current turn has got to, as one value, so exactly one indicator
 * can be right at a time.
 */
export type TurnPhase =
  /** Nothing in flight. */
  | 'idle'
  /** Asked, and nothing of the answer has arrived yet. */
  | 'thinking'
  /** The answer is arriving. */
  | 'streaming'
  /** Stopped at a write the officer has to approve. */
  | 'awaitingApproval'
  /** The turn ended badly, and the reply says how. */
  | 'error'

/** One step the assistant took, e.g. reading a loan. */
export interface ToolStep {
  id: string
  toolName: string
  label: string
  /** Writes are shown apart from reads: that is what matters on an account. */
  readOnly: boolean
  done: boolean
  durationMs?: number
}

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** True while the answer is still arriving. */
  streaming: boolean
  /** The model's working notes, kept apart from the answer. */
  reasoning?: string
  reasoningElapsedMs?: number
  steps: ToolStep[]
  cards: DisplayCard[]
  suggestions: string[]
  error?: { code: CopilotErrorCode; message?: string; retryable: boolean }
}

export interface CopilotThread {
  /** Issued by the gateway on the first turn; sent back on later turns. */
  conversationId?: string
  messages: CopilotMessage[]
  phase: TurnPhase
  /** The write waiting for the officer's decision, if any. */
  pendingApproval: ApprovalRequest | null
  /**
   * The card a decision was made on, kept until that decision settles. If
   * the session expired, the gateway puts the card back, so the panel does
   * too and the officer can decide again after signing in.
   */
  decidedApproval: ApprovalRequest | null
  /** The last question, so a failed turn can offer to ask it again. */
  lastPrompt?: string
}

export type CopilotAction =
  | {
      type: 'send'
      text: string
      userMessageId: string
      assistantMessageId: string
    }
  | { type: 'decide'; decision: Decision; assistantMessageId: string }
  /** The officer pressed stop. */
  | { type: 'cancel' }
  /** Sign-out or user switch: nothing of the previous session survives. */
  | { type: 'reset' }
  | { type: 'event'; event: CopilotEvent }

export const initialThread: CopilotThread = {
  messages: [],
  phase: 'idle',
  pendingApproval: null,
  decidedApproval: null,
}

/** Whether a turn is running, which is what re-entrancy guards mean. */
export const isTurnActive = (phase: TurnPhase): boolean =>
  phase === 'thinking' || phase === 'streaming'

/**
 * The Copilot conversation as a pure function of what happened: the
 * officer's actions and the transport's events. No I/O and no clock, so
 * every rule below is testable with plain values.
 */
export function copilotReducer(
  thread: CopilotThread,
  action: CopilotAction
): CopilotThread {
  switch (action.type) {
    case 'send':
      if (isTurnActive(thread.phase)) return thread
      return {
        ...thread,
        phase: 'thinking',
        // A new question replaces any card still on screen.
        pendingApproval: null,
        decidedApproval: null,
        lastPrompt: action.text,
        messages: [
          ...thread.messages,
          { ...emptyMessage(action.userMessageId, 'user'), text: action.text },
          draft(action.assistantMessageId),
        ],
      }

    case 'decide':
      if (!thread.pendingApproval || isTurnActive(thread.phase)) return thread
      return {
        ...thread,
        phase: 'thinking',
        pendingApproval: null,
        decidedApproval: thread.pendingApproval,
        messages: [...thread.messages, draft(action.assistantMessageId)],
      }

    case 'cancel':
      if (!isTurnActive(thread.phase)) return thread
      return { ...finalize(thread), phase: 'idle' }

    case 'reset':
      return initialThread

    case 'event':
      return applyEvent(thread, action.event)
  }
}

function applyEvent(thread: CopilotThread, event: CopilotEvent): CopilotThread {
  // Events only ever belong to the turn in flight. Anything arriving after a
  // turn ended (a late frame after stop) is dropped.
  if (!isTurnActive(thread.phase)) return thread

  switch (event.type) {
    case 'RunStarted':
      return thread

    case 'TextMessageContent':
      return {
        ...updateDraft(thread, m => ({ ...m, text: m.text + event.delta })),
        // Whitespace is not the answer arriving: runtimes send it as a
        // keep-alive, and switching on it would flash an empty bubble.
        phase: event.delta.trim() ? 'streaming' : thread.phase,
      }

    case 'ReasoningStart':
      return thread

    case 'ReasoningContent':
      return updateDraft(thread, m => ({
        ...m,
        reasoning: (m.reasoning ?? '') + event.delta,
      }))

    case 'ReasoningEnd':
      return updateDraft(thread, m => ({
        ...m,
        reasoningElapsedMs: event.elapsedMs,
      }))

    case 'ToolCallStart':
      return updateDraft(thread, m => ({
        ...m,
        steps: [
          ...m.steps,
          {
            id: event.toolCallId,
            toolName: event.toolName,
            label: event.label,
            readOnly: event.readOnly,
            done: false,
          },
        ],
      }))

    case 'ToolCallEnd':
      return updateDraft(thread, m => ({
        ...m,
        steps: m.steps.map(step =>
          step.id === event.toolCallId
            ? {
                ...step,
                // Finished steps are worded in the past tense by the gateway.
                label: event.label,
                done: true,
                durationMs: event.durationMs,
              }
            : step
        ),
      }))

    case 'DisplayCard':
      return updateDraft(thread, m => ({
        ...m,
        cards: [...m.cards, event.card],
      }))

    case 'Custom':
      return event.name === 'suggestions'
        ? updateDraft(thread, m => ({ ...m, suggestions: event.value }))
        : thread

    case 'RunFinished': {
      const finished = finalize({
        ...thread,
        conversationId: event.conversationId || thread.conversationId,
      })
      if (event.outcome.type === 'interrupt') {
        return {
          ...finished,
          phase: 'awaitingApproval',
          pendingApproval: event.outcome.approval,
          decidedApproval: null,
        }
      }
      return { ...finished, phase: 'idle', decidedApproval: null }
    }

    case 'RunError': {
      const failed = finalize(
        updateDraft(
          {
            ...thread,
            conversationId: event.conversationId || thread.conversationId,
          },
          m => ({
            ...m,
            error: {
              code: event.code,
              message: event.message,
              retryable: event.retryable,
            },
          })
        )
      )
      // Only an expired session gives the card back. On any other error a
      // restored card could already have run, and offering it again would
      // invite a second repayment.
      const restore =
        event.code === 'AUTH_EXPIRED' && thread.decidedApproval
          ? thread.decidedApproval
          : null
      return {
        ...failed,
        phase: 'error',
        pendingApproval: restore ?? failed.pendingApproval,
        decidedApproval: null,
      }
    }
  }
}

/** Close the answer in flight: tidy its text and drop it if it is empty. */
function finalize(thread: CopilotThread): CopilotThread {
  const last = lastMessage(thread)
  if (!last || last.role !== 'assistant' || !last.streaming) return thread

  const suggestions = last.suggestions.length
    ? last.suggestions
    : parseSuggestions(last.text)
  const done: CopilotMessage = {
    ...last,
    text: stripSuggestions(last.text),
    suggestions,
    streaming: false,
  }
  const empty =
    !done.text &&
    !done.reasoning &&
    !done.error &&
    !done.steps.length &&
    !done.cards.length &&
    !done.suggestions.length
  return {
    ...thread,
    messages: empty
      ? thread.messages.slice(0, -1)
      : [...thread.messages.slice(0, -1), done],
  }
}

function updateDraft(
  thread: CopilotThread,
  update: (message: CopilotMessage) => CopilotMessage
): CopilotThread {
  const last = lastMessage(thread)
  if (!last || last.role !== 'assistant' || !last.streaming) return thread
  return {
    ...thread,
    messages: [...thread.messages.slice(0, -1), update(last)],
  }
}

function lastMessage(thread: CopilotThread): CopilotMessage | undefined {
  return thread.messages[thread.messages.length - 1]
}

function draft(id: string): CopilotMessage {
  return { ...emptyMessage(id, 'assistant'), streaming: true }
}

function emptyMessage(
  id: string,
  role: CopilotMessage['role']
): CopilotMessage {
  return {
    id,
    role,
    text: '',
    streaming: false,
    steps: [],
    cards: [],
    suggestions: [],
  }
}

const SUGGEST_BLOCK = /```suggest\s*([\s\S]*?)```/gi

/**
 * Follow-up questions a model wrote into a fenced ```suggest block, one per
 * line. Only suggestions are read from prose: approvals arrive solely as
 * gateway-built events, so text that merely looks like a card stays text.
 */
export function parseSuggestions(text: string): string[] {
  const suggestions: string[] = []
  for (const match of text.matchAll(SUGGEST_BLOCK)) {
    for (const line of match[1].split('\n')) {
      const item = line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()
      if (item) suggestions.push(item)
    }
  }
  return suggestions
}

function stripSuggestions(text: string): string {
  return text
    .replace(SUGGEST_BLOCK, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
