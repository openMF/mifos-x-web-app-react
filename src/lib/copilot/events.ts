/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * The events the Copilot UI understands.
 *
 * Every backend is translated into these by a transport, so the UI never
 * reads a gateway's own wire format. The names follow the AG-UI protocol
 * (run lifecycle, text, reasoning, tool calls, interrupts), which keeps the
 * door open for an agent harness that speaks AG-UI natively: it would need a
 * new transport, not a new UI.
 */

/** Error codes, as defined by the gateway's wire contract v1. */
export type CopilotErrorCode =
  | 'AUTH_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'LLM_UNAVAILABLE'
  | 'TOOL_FAILED'
  | 'RATE_LIMITED'
  | 'CANCELLED'
  | 'INTERNAL'

/** One labelled line on an approval card, already formatted by the gateway. */
export interface CardRow {
  label: string
  value: string
}

/**
 * A write the officer must confirm before it runs. Built by the gateway from
 * the parsed tool call, never from model prose, so what the officer reads is
 * what will execute.
 */
export interface ApprovalRequest {
  /** Gateway-issued id, sent back with the decision. */
  cardId: string
  /** The tool that will run on approval. */
  tool: string
  /** The exact arguments that will run. */
  args: Record<string, unknown>
  /** What the officer reads: named accounts and formatted values. */
  rows: CardRow[]
  /** One sentence describing what will happen. */
  summary: string
  /** Display only. The gateway's copy is the one that counts. */
  idempotencyKey?: string
  /** ISO timestamp after which the gateway refuses the decision. */
  expiresAt?: string
}

/** A button on a display card. */
export interface DisplayCardAction {
  label: string
  style?: string
  /** In-app route to open. */
  route?: string
  /** Tool the gateway may run when pressed. */
  action?: string
}

/** Read-only structured data shown under a reply (no approval involved). */
export interface DisplayCard {
  type: string
  title: string
  data: Record<string, string>
  actions?: DisplayCardAction[]
}

/** How a run ended without an error. */
export type RunOutcome =
  | { type: 'success' }
  /** Paused until the officer approves or rejects a write. */
  | { type: 'interrupt'; approval: ApprovalRequest }

export type CopilotEvent =
  /** The backend accepted the request and the response is streaming. */
  | { type: 'RunStarted' }
  /** A piece of the answer text. */
  | { type: 'TextMessageContent'; delta: string }
  /** The model started writing working notes. */
  | { type: 'ReasoningStart' }
  /** A piece of the model's working notes. Never presented as the answer. */
  | { type: 'ReasoningContent'; delta: string }
  /** The working notes are finished. */
  | { type: 'ReasoningEnd'; elapsedMs?: number }
  /** A step began, e.g. reading a loan. */
  | {
      type: 'ToolCallStart'
      toolCallId: string
      toolName: string
      /** Named in banking terms by the gateway's tool manifest. */
      label: string
      readOnly: boolean
    }
  /** A step finished. */
  | {
      type: 'ToolCallEnd'
      toolCallId: string
      toolName: string
      label: string
      durationMs?: number
    }
  /** Structured data to show under the reply. */
  | { type: 'DisplayCard'; card: DisplayCard }
  /** Anything else, by name. Used for follow-up suggestions. */
  | { type: 'Custom'; name: 'suggestions'; value: string[] }
  /** The run ended: finished, or paused for an approval. Always last. */
  | { type: 'RunFinished'; outcome: RunOutcome; conversationId?: string }
  /** The run failed. Always last. */
  | {
      type: 'RunError'
      code: CopilotErrorCode
      /** The gateway's own wording, when it sent one. */
      message?: string
      /** Whether asking again may work, as judged by the gateway. */
      retryable: boolean
      conversationId?: string
    }
