/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ApprovalRequest,
  CardRow,
  CopilotErrorCode,
  CopilotEvent,
  DisplayCard,
  DisplayCardAction,
} from './events'
import type { SseFrame } from './sse'

/**
 * Wire contract v1 of the Copilot gateway (openMF/mcp-mifosx/gateway,
 * ADR-001), translated into CopilotEvents. This is the only module that
 * knows the v1 event names; the rest of the app never sees them.
 *
 * Paths:
 *   POST /copilot/api/v1/chat                      a chat turn, SSE response
 *   POST /copilot/api/v1/actions/{cardId}/decision approve/reject, SSE response
 */
export const CHAT_PATH = '/copilot/api/v1/chat'

export const decisionPath = (cardId: string): string =>
  `/copilot/api/v1/actions/${encodeURIComponent(cardId)}/decision`

/**
 * Card ids are plain gateway-minted tokens. Anything else is refused before
 * it reaches a URL: dot-segments survive encodeURIComponent.
 */
export const CARD_ID_PATTERN = /^[A-Za-z0-9_-]+$/

const ERROR_CODES: readonly CopilotErrorCode[] = [
  'AUTH_EXPIRED',
  'PERMISSION_DENIED',
  'LLM_UNAVAILABLE',
  'TOOL_FAILED',
  'RATE_LIMITED',
  'CANCELLED',
  'INTERNAL',
]

export const toErrorCode = (value: unknown): CopilotErrorCode =>
  ERROR_CODES.includes(value as CopilotErrorCode)
    ? (value as CopilotErrorCode)
    : 'INTERNAL'

type RunError = Extract<CopilotEvent, { type: 'RunError' }>

/** An HTTP failure before any stream, as a RunError. */
export const httpError = (status: number, body: unknown): RunError => {
  let code: CopilotErrorCode = 'INTERNAL'
  let retryable = false
  if (status === 401) {
    code = 'AUTH_EXPIRED'
    retryable = true
  } else if (status === 403) {
    code = 'PERMISSION_DENIED'
  } else if (status === 429) {
    code = 'RATE_LIMITED'
    retryable = true
  } else if (status === 502 || status === 503 || status === 504) {
    code = 'LLM_UNAVAILABLE'
    retryable = true
  }
  let message: string | undefined
  if (isRecord(body)) {
    if (body.code != null) code = toErrorCode(body.code)
    if (typeof body.message === 'string') message = body.message
    if (typeof body.retryable === 'boolean') retryable = body.retryable
  }
  return { type: 'RunError', code, message, retryable }
}

/**
 * Translates the v1 frames of one response into CopilotEvents.
 *
 * Stateful, because v1 spreads some facts over several frames:
 * - A step has no id; 'finished' closes the last open step with that tool.
 * - An approval card ends the stream without a 'done'; the run is paused.
 * - An 'error' is followed by a 'done' carrying the conversation id, which
 *   the error should keep, so the error is held until 'done' or the end.
 *
 * One instance per response. Every response ends in exactly one RunFinished
 * or RunError, even when the stream closes early.
 */
export class V1EventMapper {
  private nextStepId = 0
  private readonly openSteps: { id: string; toolName: string }[] = []
  private approval: ApprovalRequest | null = null
  private error: RunError | null = null
  private finished = false

  map(frame: SseFrame): CopilotEvent[] {
    if (this.finished) return []

    let payload: unknown
    try {
      payload = JSON.parse(frame.data)
    } catch {
      return [] // A malformed frame is skipped, never shown.
    }
    if (!isRecord(payload)) return []
    const type = frame.event || text(payload.type) || ''

    switch (type) {
      case 'token': {
        const delta = text(payload.delta ?? payload.token) ?? ''
        return delta ? [{ type: 'TextMessageContent', delta }] : []
      }
      case 'thinking':
        return this.thinking(payload)
      case 'tool_call':
        return this.toolCall(payload)
      case 'action_card':
        return this.actionCard(payload)
      case 'suggest': {
        const items = Array.isArray(payload.items) ? payload.items : []
        const value = items.map(String).filter(item => item.trim())
        return value.length
          ? [{ type: 'Custom', name: 'suggestions', value }]
          : []
      }
      case 'done':
        return this.finish(text(payload.conversation_id) || undefined)
      case 'error':
        // Keep the first error: it is the cause, anything after is fallout.
        this.error ??= {
          type: 'RunError',
          code: toErrorCode(payload.code),
          message: text(payload.message) || undefined,
          retryable: payload.retryable === true,
        }
        return []
      default:
        return [] // Unknown events are ignored, as the contract requires.
    }
  }

  /** The stream closed. Ends the run if 'done' never arrived. */
  end(): CopilotEvent[] {
    if (this.finished) return []
    if (!this.error && !this.approval) {
      // Closing without 'done' or a card means the answer was cut off.
      // Reporting it as complete would present half an answer as a whole one.
      this.error = { type: 'RunError', code: 'INTERNAL', retryable: false }
    }
    return this.finish(undefined)
  }

  private finish(conversationId: string | undefined): CopilotEvent[] {
    this.finished = true
    if (this.error) {
      return [{ ...this.error, ...(conversationId ? { conversationId } : {}) }]
    }
    return [
      {
        type: 'RunFinished',
        outcome: this.approval
          ? { type: 'interrupt', approval: this.approval }
          : { type: 'success' },
        ...(conversationId ? { conversationId } : {}),
      },
    ]
  }

  private thinking(payload: Record<string, unknown>): CopilotEvent[] {
    if (payload.phase === 'start') return [{ type: 'ReasoningStart' }]
    if (payload.phase === 'end') {
      const elapsedMs = number(payload.elapsed_ms)
      return [
        { type: 'ReasoningEnd', ...(elapsedMs != null ? { elapsedMs } : {}) },
      ]
    }
    const delta = text(payload.delta) ?? ''
    return delta ? [{ type: 'ReasoningContent', delta }] : []
  }

  private toolCall(payload: Record<string, unknown>): CopilotEvent[] {
    const toolName = text(payload.tool) ?? ''
    // The gateway names the step. Falling back to the tool id keeps an older
    // gateway working rather than showing an empty row.
    const label = text(payload.label) || toolName
    if (!label) return []

    if (payload.phase !== 'finished') {
      const id = this.newStepId()
      this.openSteps.push({ id, toolName })
      return [
        {
          type: 'ToolCallStart',
          toolCallId: id,
          toolName,
          label,
          readOnly: payload.read_only === true,
        },
      ]
    }

    const durationMs = number(payload.duration_ms)
    const end = (toolCallId: string): CopilotEvent => ({
      type: 'ToolCallEnd',
      toolCallId,
      toolName,
      label,
      ...(durationMs != null ? { durationMs } : {}),
    })
    for (let i = this.openSteps.length - 1; i >= 0; i--) {
      if (this.openSteps[i].toolName === toolName) {
        const [open] = this.openSteps.splice(i, 1)
        return [end(open.id)]
      }
    }
    // Finished with no matching start: record it as a complete step.
    const id = this.newStepId()
    return [
      {
        type: 'ToolCallStart',
        toolCallId: id,
        toolName,
        label,
        readOnly: payload.read_only === true,
      },
      end(id),
    ]
  }

  /** A card with a card_id awaits approval; without one it only displays. */
  private actionCard(payload: Record<string, unknown>): CopilotEvent[] {
    if (payload.card_id != null) {
      const cardId = String(payload.card_id)
      if (!CARD_ID_PATTERN.test(cardId)) {
        // Refuse the action and say so, rather than leave the officer
        // waiting on a confirmation that will never appear.
        this.error ??= {
          type: 'RunError',
          code: 'INTERNAL',
          message: 'Invalid confirmation reference.',
          retryable: false,
        }
        return []
      }
      this.approval = {
        cardId,
        tool: text(payload.tool) ?? '',
        args: isRecord(payload.args) ? payload.args : {},
        rows: toRows(payload.rows),
        summary: text(payload.human_summary ?? payload.summary) ?? '',
        idempotencyKey: text(payload.idempotency_key),
        expiresAt: text(payload.expires_at),
      }
      return []
    }
    const card = toDisplayCard(payload.card)
    return card ? [{ type: 'DisplayCard', card }] : []
  }

  private newStepId(): string {
    this.nextStepId += 1
    return `step-${this.nextStepId}`
  }
}

/**
 * Rows arrive as an ordered object, so the gateway decides what the officer
 * reads first. Blank labels or values are dropped rather than shown empty.
 */
function toRows(raw: unknown): CardRow[] {
  if (!isRecord(raw)) return []
  return Object.entries(raw)
    .map(([label, value]) => ({
      label,
      value: value == null ? '' : String(value),
    }))
    .filter(row => row.label.trim() && row.value.trim())
}

function toDisplayCard(raw: unknown): DisplayCard | null {
  if (!isRecord(raw) || typeof raw.title !== 'string') return null
  const data: Record<string, string> = {}
  if (isRecord(raw.data)) {
    for (const [key, value] of Object.entries(raw.data)) {
      if (value != null) data[key] = String(value)
    }
  }
  const actions = Array.isArray(raw.actions)
    ? raw.actions.filter(isRecord).flatMap((action): DisplayCardAction[] =>
        typeof action.label === 'string'
          ? [
              {
                label: action.label,
                style: text(action.style),
                route: text(action.route),
                action: text(action.action),
              },
            ]
          : []
      )
    : undefined
  return {
    type: text(raw.type) ?? 'insight',
    title: raw.title,
    data,
    ...(actions?.length ? { actions } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return value == null ? undefined : String(value)
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
