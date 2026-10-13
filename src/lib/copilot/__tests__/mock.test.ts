/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import type { CopilotEvent } from '../events'
import { createMockTransport } from '../mock'
import { copilotReducer, initialThread, type CopilotThread } from '../reducer'

/** Feed a transport's events into the reducer, as the panel will. */
async function play(
  thread: CopilotThread,
  events: AsyncIterable<CopilotEvent>
): Promise<CopilotThread> {
  let state = thread
  for await (const event of events) {
    state = copilotReducer(state, { type: 'event', event })
  }
  return state
}

const transport = createMockTransport({ delayMs: 0 })

function ask(thread: CopilotThread, text: string, n: number) {
  return play(
    copilotReducer(thread, {
      type: 'send',
      text,
      userMessageId: `u${n}`,
      assistantMessageId: `a${n}`,
    }),
    transport.chat({ message: text, conversationId: thread.conversationId })
  )
}

describe('mock transport, end to end through the reducer', () => {
  it('answers a read-only question with steps, notes and suggestions', async () => {
    const thread = await ask(initialThread, 'Summarise loan 4521', 1)
    const answer = thread.messages[1]
    expect(thread.phase).toBe('idle')
    expect(thread.conversationId).toBe('mock-conversation')
    expect(answer.text).toContain('Loan 000000004521 for Rajesh Kumar')
    expect(answer.reasoning).toBeTruthy()
    expect(answer.steps).toMatchObject([
      { label: 'Looked up the loan', readOnly: true, done: true },
    ])
    expect(answer.suggestions).toEqual([
      'Show the repayment schedule',
      'Record a repayment',
    ])
  })

  it('pauses on a repayment and records it once approved', async () => {
    let thread = await ask(initialThread, 'Record a repayment of 1500', 1)
    expect(thread.phase).toBe('awaitingApproval')
    const card = thread.pendingApproval
    expect(card).toMatchObject({
      cardId: 'mock-card-1',
      tool: 'make_loan_repayment',
      summary: 'Record a repayment of INR 1,500.00 on loan 000000004521',
    })
    expect(card?.rows.map(r => r.label)).toEqual([
      'Client',
      'Account',
      'Amount',
      'Date',
    ])

    thread = await play(
      copilotReducer(thread, {
        type: 'decide',
        decision: 'approve',
        assistantMessageId: 'a2',
      }),
      transport.decide(card!.cardId, 'approve')
    )
    expect(thread.phase).toBe('idle')
    expect(thread.pendingApproval).toBeNull()
    const result = thread.messages[thread.messages.length - 1]
    expect(result.text).toMatch(/^✔ Executed/)
    expect(result.steps).toMatchObject([{ readOnly: false, done: true }])
  })

  it('says nothing changed when the officer rejects', async () => {
    const thread = await play(
      copilotReducer(
        await ask(initialThread, 'Record a repayment of 1500', 1),
        { type: 'decide', decision: 'reject', assistantMessageId: 'a2' }
      ),
      transport.decide('mock-card-2', 'reject')
    )
    expect(thread.phase).toBe('idle')
    expect(thread.messages[thread.messages.length - 1].text).toBe(
      'Understood. Nothing was recorded on the loan.'
    )
  })

  it('demonstrates a retryable error', async () => {
    const thread = await ask(initialThread, 'Show me an error', 1)
    expect(thread.phase).toBe('error')
    expect(thread.messages[1].error).toEqual({
      code: 'RATE_LIMITED',
      message: 'The assistant is busy. Please try again in a moment.',
      retryable: true,
    })
  })

  it('stops streaming when the officer cancels', async () => {
    const slow = createMockTransport({ delayMs: 5 })
    const controller = new AbortController()
    const events: CopilotEvent[] = []
    for await (const event of slow.chat(
      { message: 'Summarise loan 4521' },
      controller.signal
    )) {
      events.push(event)
      if (event.type === 'TextMessageContent') controller.abort()
    }
    expect(events.some(e => e.type === 'RunFinished')).toBe(false)
  })
})
