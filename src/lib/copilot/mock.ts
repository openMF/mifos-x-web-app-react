/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createV1Transport, type CopilotTransport } from './transport'

/**
 * A stand-in gateway for development, demos and tests.
 *
 * It answers with recorded wire contract v1 frames through a fake fetch, so
 * mock mode runs the same parser and translator as a real gateway: the only
 * difference between the two is where the bytes come from.
 *
 * Replies are picked from the message:
 *   mentions a repayment, approval or disbursement  -> an approval card
 *   mentions an error or failure                     -> a retryable error
 *   anything else                                    -> a read-only answer
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

  return async (input, init) => {
    const url = String(input instanceof Request ? input.url : input)
    const body = parseBody(init?.body)
    const signal = init?.signal ?? undefined
    if (signal?.aborted) throw abortError()

    let frames: string[]
    const decision = /\/actions\/[^/]+\/decision$/.test(url)
    if (decision) {
      frames = body.decision === 'approve' ? approved() : rejected()
    } else {
      const message = String(body.message ?? '')
      if (/\b(error|fail(ed|ure)?)\b/i.test(message)) {
        frames = failure()
      } else if (/\b(repay(ment)?|approve|disburse(ment)?)\b/i.test(message)) {
        cardSequence += 1
        frames = approval(`mock-card-${cardSequence}`)
      } else {
        frames = answer()
      }
    }
    return new Response(stream(frames, delayMs, signal), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
}

const CONVERSATION_ID = 'mock-conversation'

function answer(): string[] {
  return [
    sse('thinking', { phase: 'start' }),
    ...words('The officer wants a summary of the loan.').map(delta =>
      sse('thinking', { phase: 'delta', delta })
    ),
    sse('thinking', { phase: 'end', elapsed_ms: 900 }),
    sse('tool_call', {
      tool: 'get_loan',
      label: 'Looking up the loan',
      phase: 'started',
      read_only: true,
    }),
    sse('tool_call', {
      tool: 'get_loan',
      label: 'Looked up the loan',
      phase: 'finished',
      read_only: true,
      duration_ms: 420,
    }),
    ...tokens(
      'Loan 000000004521 for Rajesh Kumar is active. The outstanding ' +
        'balance is INR 42,000.00 and the next instalment of INR 3,500.00 ' +
        'is due on 21 August 2026. No payments are overdue.'
    ),
    sse('suggest', {
      items: ['Show the repayment schedule', 'Record a repayment'],
    }),
    sse('done', { conversation_id: CONVERSATION_ID }),
  ]
}

/** Ends without 'done': the turn is paused until the officer decides. */
function approval(cardId: string): string[] {
  return [
    sse('tool_call', {
      tool: 'get_loan',
      label: 'Looking up the loan',
      phase: 'started',
      read_only: true,
    }),
    sse('tool_call', {
      tool: 'get_loan',
      label: 'Looked up the loan',
      phase: 'finished',
      read_only: true,
      duration_ms: 380,
    }),
    ...tokens('Please confirm the repayment below before I record it.'),
    sse('action_card', {
      card_id: cardId,
      tool: 'make_loan_repayment',
      args: {
        loanId: 4521,
        transactionAmount: 1500,
        transactionDate: '2026-08-21',
      },
      rows: {
        Client: 'Rajesh Kumar',
        Account: '000000004521',
        Amount: 'INR 1,500.00',
        Date: '21 August 2026',
      },
      human_summary: 'Record a repayment of INR 1,500.00 on loan 000000004521',
      idempotency_key: `${cardId}-key`,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    }),
  ]
}

function approved(): string[] {
  return [
    sse('tool_call', {
      tool: 'make_loan_repayment',
      label: 'Recording the repayment',
      phase: 'started',
      read_only: false,
    }),
    sse('tool_call', {
      tool: 'make_loan_repayment',
      label: 'Recorded the repayment',
      phase: 'finished',
      read_only: false,
      duration_ms: 610,
    }),
    ...tokens(
      '✔ Executed: Record a repayment of INR 1,500.00 on loan ' +
        '000000004521\n\nThe outstanding balance is now INR 40,500.00.'
    ),
    sse('done', { conversation_id: CONVERSATION_ID }),
  ]
}

function rejected(): string[] {
  return [
    ...tokens('Understood. Nothing was recorded on the loan.'),
    sse('done', { conversation_id: CONVERSATION_ID }),
  ]
}

function failure(): string[] {
  return [
    sse('error', {
      code: 'RATE_LIMITED',
      message: 'The assistant is busy. Please try again in a moment.',
      retryable: true,
    }),
    sse('done', { conversation_id: CONVERSATION_ID }),
  ]
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/** Word by word, the way a model streams. */
function tokens(text: string): string[] {
  return words(text).map(delta => sse('token', { delta }))
}

function words(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? []
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
