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
    expect(answer.text).toContain('Loan account **000004521**')
    expect(answer.text).not.toContain('suggest')
    expect(answer.reasoning).toBeTruthy()
    expect(answer.steps).toMatchObject([
      {
        toolName: 'mifos_loan_details',
        label: 'Read the loan account',
        readOnly: true,
        done: true,
      },
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
      tool: 'mifos_loan_repayment',
      summary: 'Record repayment on Small Business Loan for Rajesh Kumar',
    })
    expect(card?.rows.map(r => r.label)).toEqual([
      'Client',
      'Loan account',
      'Product',
      'Outstanding',
      'Repayment amount',
      'Transaction date',
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
    expect(result.text).toMatch(/^✔ Executed: Record repayment/)
    expect(result.steps).toMatchObject([
      { label: 'Prepared the repayment', readOnly: false, done: true },
    ])
    expect(result.cards).toMatchObject([
      {
        title: 'Loan updated',
        actions: [{ route: '/clients/12/loans-accounts/4521/general' }],
      },
    ])
  })

  it.each([
    ['Disburse loan 4521', 'mifos_loan_disburse'],
    ['Approve loan 4521', 'mifos_loan_approve'],
  ])('pauses on the write that was asked for: %s', async (text, tool) => {
    const thread = await ask(initialThread, text, 1)
    expect(thread.pendingApproval?.tool).toBe(tool)
  })

  it('says nothing changed when the officer rejects', async () => {
    const mock = createMockTransport({ delayMs: 0 })
    const asked = await play(
      copilotReducer(initialThread, {
        type: 'send',
        text: 'Record a repayment of 1500',
        userMessageId: 'u1',
        assistantMessageId: 'a1',
      }),
      mock.chat({ message: 'Record a repayment of 1500' })
    )
    const thread = await play(
      copilotReducer(asked, {
        type: 'decide',
        decision: 'reject',
        assistantMessageId: 'a2',
      }),
      mock.decide(asked.pendingApproval!.cardId, 'reject')
    )
    expect(thread.phase).toBe('idle')
    expect(thread.messages[thread.messages.length - 1].text).toBe(
      'Understood. Nothing was recorded, and loan account 000004521 is unchanged.'
    )
  })

  it('refuses a second decision on the same card, as the gateway does', async () => {
    const mock = createMockTransport({ delayMs: 0 })
    const asked = await play(
      copilotReducer(initialThread, {
        type: 'send',
        text: 'Record a repayment',
        userMessageId: 'u1',
        assistantMessageId: 'a1',
      }),
      mock.chat({ message: 'Record a repayment' })
    )
    const cardId = asked.pendingApproval!.cardId
    const events: CopilotEvent[] = []
    for await (const event of mock.decide(cardId, 'approve')) {
      events.push(event)
    }
    for await (const event of mock.decide(cardId, 'approve')) {
      events.push(event)
    }
    expect(events[events.length - 1]).toMatchObject({
      type: 'RunError',
      code: 'PERMISSION_DENIED',
      retryable: false,
    })
  })

  it('does not invent an overdue list: the gateway has no tool for it', async () => {
    const thread = await ask(initialThread, 'Which loans are overdue?', 1)
    const answer = thread.messages[1]
    expect(answer.steps).toEqual([])
    expect(answer.text).toMatch(/^I can't list overdue loans yet/)
  })

  // Also the follow-up chip under a loan summary: it says "repayment", and
  // must not raise a repayment card.
  it('writes a schedule as a markdown table', async () => {
    const thread = await ask(initialThread, 'Show the repayment schedule', 1)
    const answer = thread.messages[1]
    expect(answer.steps[0].toolName).toBe('mifos_loan_schedule')
    expect(answer.text).toContain('| # | Due date |')
  })

  it('demonstrates a retryable error', async () => {
    const thread = await ask(initialThread, 'Show me an error', 1)
    expect(thread.phase).toBe('error')
    expect(thread.messages[1].error).toEqual({
      code: 'RATE_LIMITED',
      message:
        'That was a lot of questions at once. Please wait a moment and try again.',
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
