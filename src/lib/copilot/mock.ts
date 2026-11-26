/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  approved,
  confirmationExpired,
  loanSummary,
  overdueNotAvailable,
  rateLimited,
  rejected,
  repaymentSchedule,
  toSse,
  writeCard,
  type MockCommand,
  type RecordedFrame,
} from './recordings'
import { createV1Transport, type CopilotTransport } from './transport'

/**
 * A stand-in gateway for development, demos and tests.
 *
 * It answers with recorded wire contract v1 frames (see `recordings.ts`)
 * through a fake fetch, so mock mode runs the same parser and translator as
 * a real gateway: the only difference between the two is where the bytes
 * come from. The recordings follow what the real gateway sends, so the demo
 * never promises more than a live one can do.
 *
 * Replies are picked from the message:
 *   mentions an error or failure                  -> a retryable error
 *   mentions a schedule                           -> a schedule, as a table
 *   mentions disbursing, approving or a repayment -> a card to confirm
 *   mentions overdue loans, arrears or portfolio  -> "no tool for that yet"
 *   anything else                                 -> a loan summary
 */
export interface MockOptions {
  /** Pause between frames, so streaming is visible. 0 in tests. */
  delayMs?: number
}

const MOCK_ORIGIN = 'https://copilot.mock'

export function createMockTransport(
  options: MockOptions = {}
): CopilotTransport {
  return createV1Transport({
    baseUrl: MOCK_ORIGIN,
    getHeaders: () => ({}),
    fetchFn: createMockFetch(options),
  })
}

export function createMockFetch({
  delayMs = 25,
}: MockOptions = {}): typeof fetch {
  let cardSequence = 0
  // Cards still awaiting a decision, as the gateway holds them: each can be
  // decided once, and a new question discards it.
  const pending = new Map<string, MockCommand>()

  return async (input, init) => {
    const url = String(input instanceof Request ? input.url : input)
    const body = parseBody(init?.body)
    const signal = init?.signal ?? undefined
    if (signal?.aborted) throw abortError()

    let frames: RecordedFrame[]
    const decision = url.match(/\/actions\/([^/]+)\/decision$/)
    if (decision) {
      const command = pending.get(decodeURIComponent(decision[1]))
      pending.clear()
      if (!command) frames = confirmationExpired()
      else if (body.decision === 'approve') frames = approved(command)
      else frames = rejected()
    } else {
      pending.clear()
      const message = String(body.message ?? '')
      const command = commandIn(message)
      if (/\b(error|fail(ed|ure)?)\b/i.test(message)) {
        frames = rateLimited()
      } else if (/\bschedule\b/i.test(message)) {
        // Before writes: "the repayment schedule" is a question, not a
        // repayment.
        frames = repaymentSchedule()
      } else if (command) {
        cardSequence += 1
        const cardId = `mock-card-${cardSequence}`
        pending.set(cardId, command)
        frames = writeCard(command, cardId)
      } else if (/\b(overdue|arrears?|portfolio)\b/i.test(message)) {
        frames = overdueNotAvailable()
      } else {
        frames = loanSummary()
      }
    }
    return new Response(stream(frames.map(toSse), delayMs, signal), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
}

function commandIn(message: string): MockCommand | null {
  if (/\bdisburse(ment)?\b/i.test(message)) return 'disburse'
  if (/\bapprove\b/i.test(message)) return 'approve'
  if (/\brepay(ment)?\b/i.test(message)) return 'repayment'
  return null
}

function stream(
  frames: string[],
  delayMs: number,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let index = 0
  return new ReadableStream({
    start(controller) {
      signal?.addEventListener('abort', () => controller.error(abortError()))
    },
    async pull(controller) {
      if (index >= frames.length) {
        controller.close()
        return
      }
      if (delayMs > 0) await sleep(delayMs)
      if (signal?.aborted) return
      controller.enqueue(encoder.encode(frames[index]))
      index += 1
    },
  })
}

function parseBody(body: unknown): Record<string, unknown> {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function abortError(): Error {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
