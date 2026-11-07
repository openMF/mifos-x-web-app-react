/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import type { ApprovalRequest, CopilotEvent } from '../events'
import {
  copilotReducer,
  initialThread,
  parseSuggestions,
  type CopilotAction,
  type CopilotThread,
} from '../reducer'

const send: CopilotAction = {
  type: 'send',
  text: 'What is the balance?',
  userMessageId: 'u1',
  assistantMessageId: 'a1',
}

const approval: ApprovalRequest = {
  cardId: 'card_1',
  tool: 'make_loan_repayment',
  args: { loanId: 12 },
  rows: [{ label: 'Amount', value: 'INR 1,500.00' }],
  summary: 'Record a repayment',
}

const ACTION_TYPES = new Set(['send', 'decide', 'cancel', 'reset', 'event'])

/** Apply officer actions and transport events in order. */
function run(
  thread: CopilotThread,
  ...steps: (CopilotAction | CopilotEvent)[]
): CopilotThread {
  return steps.reduce<CopilotThread>((state, step) => {
    const action = ACTION_TYPES.has(step.type)
      ? (step as CopilotAction)
      : { type: 'event' as const, event: step as CopilotEvent }
    return copilotReducer(state, action)
  }, thread)
}

const finished = (conversationId?: string): CopilotEvent => ({
  type: 'RunFinished',
  outcome: { type: 'success' },
  conversationId,
})

const last = (thread: CopilotThread) =>
  thread.messages[thread.messages.length - 1]

describe('copilotReducer', () => {
  it('adds the question and an empty answer, and starts thinking', () => {
    const thread = run(initialThread, send)
    expect(thread.phase).toBe('thinking')
    expect(thread.lastPrompt).toBe('What is the balance?')
    expect(thread.messages.map(m => [m.role, m.text, m.streaming])).toEqual([
      ['user', 'What is the balance?', false],
      ['assistant', '', true],
    ])
  })

  it('builds the answer as text arrives and finishes it', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'RunStarted' },
      { type: 'TextMessageContent', delta: 'INR ' },
      { type: 'TextMessageContent', delta: '42,000.00' },
      finished('c-1')
    )
    expect(thread.phase).toBe('idle')
    expect(thread.conversationId).toBe('c-1')
    expect(last(thread)).toMatchObject({
      text: 'INR 42,000.00',
      streaming: false,
    })
  })

  it('keeps thinking until real text arrives', () => {
    let thread = run(initialThread, send, {
      type: 'TextMessageContent',
      delta: '  ',
    })
    expect(thread.phase).toBe('thinking')
    thread = run(thread, { type: 'TextMessageContent', delta: 'Hi' })
    expect(thread.phase).toBe('streaming')
  })

  it('keeps working notes apart from the answer', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'ReasoningStart' },
      { type: 'ReasoningContent', delta: 'Need the loan.' },
      { type: 'ReasoningEnd', elapsedMs: 800 },
      { type: 'TextMessageContent', delta: 'Done.' },
      finished()
    )
    expect(last(thread)).toMatchObject({
      text: 'Done.',
      reasoning: 'Need the loan.',
      reasoningElapsedMs: 800,
    })
  })

  it('records steps and closes them by id', () => {
    const thread = run(
      initialThread,
      send,
      {
        type: 'ToolCallStart',
        toolCallId: 's1',
        toolName: 'get_loan',
        label: 'Looking up the loan',
        readOnly: true,
      },
      {
        type: 'ToolCallEnd',
        toolCallId: 's1',
        toolName: 'get_loan',
        label: 'Looked up the loan',
        durationMs: 300,
      }
    )
    expect(last(thread).steps).toEqual([
      {
        id: 's1',
        toolName: 'get_loan',
        label: 'Looked up the loan',
        readOnly: true,
        done: true,
        durationMs: 300,
      },
    ])
    // A step is a sign of life, not the answer arriving.
    expect(thread.phase).toBe('thinking')
  })

  it('collects display cards and suggestions', () => {
    const card = { type: 'loan', title: 'Loan 12', data: { Balance: '1' } }
    const thread = run(
      initialThread,
      send,
      { type: 'DisplayCard', card },
      { type: 'Custom', name: 'suggestions', value: ['Show schedule'] },
      finished()
    )
    expect(last(thread)).toMatchObject({
      cards: [card],
      suggestions: ['Show schedule'],
    })
  })

  it('takes suggestions from a fenced block and removes it from the text', () => {
    const thread = run(
      initialThread,
      send,
      {
        type: 'TextMessageContent',
        delta:
          'Here it is.\n\n\n```suggest\n- Show schedule\n2. Record a repayment\n```',
      },
      finished()
    )
    expect(last(thread)).toMatchObject({
      text: 'Here it is.',
      suggestions: ['Show schedule', 'Record a repayment'],
    })
  })

  it('pauses for approval and resumes with the decision', () => {
    let thread = run(
      initialThread,
      send,
      { type: 'TextMessageContent', delta: 'Please confirm.' },
      { type: 'RunFinished', outcome: { type: 'interrupt', approval } }
    )
    expect(thread.phase).toBe('awaitingApproval')
    expect(thread.pendingApproval).toEqual(approval)

    thread = run(thread, {
      type: 'decide',
      decision: 'approve',
      assistantMessageId: 'a2',
    })
    expect(thread.phase).toBe('thinking')
    expect(thread.pendingApproval).toBeNull()
    expect(thread.decidedApproval).toEqual(approval)

    thread = run(
      thread,
      { type: 'TextMessageContent', delta: '✔ Executed' },
      finished('c-1')
    )
    expect(thread.phase).toBe('idle')
    expect(thread.decidedApproval).toBeNull()
    expect(thread.messages.map(m => m.text)).toEqual([
      'What is the balance?',
      'Please confirm.',
      '✔ Executed',
    ])
  })

  it('ignores a decision when nothing is waiting for one', () => {
    const decide: CopilotAction = {
      type: 'decide',
      decision: 'approve',
      assistantMessageId: 'a2',
    }
    expect(run(initialThread, decide)).toBe(initialThread)
  })

  it('shows the failure and keeps the error state after a trailing finish', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'TextMessageContent', delta: 'Partial' },
      {
        type: 'RunError',
        code: 'RATE_LIMITED',
        message: 'Busy',
        retryable: true,
        conversationId: 'c-2',
      },
      finished()
    )
    expect(thread.phase).toBe('error')
    expect(thread.conversationId).toBe('c-2')
    expect(last(thread)).toMatchObject({
      text: 'Partial',
      streaming: false,
      error: { code: 'RATE_LIMITED', message: 'Busy', retryable: true },
    })
  })

  it('gives the card back when the session expired during the decision', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'RunFinished', outcome: { type: 'interrupt', approval } },
      { type: 'decide', decision: 'approve', assistantMessageId: 'a2' },
      { type: 'RunError', code: 'AUTH_EXPIRED', retryable: true }
    )
    expect(thread.phase).toBe('error')
    expect(thread.pendingApproval).toEqual(approval)
  })

  it('does not give the card back on any other error', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'RunFinished', outcome: { type: 'interrupt', approval } },
      { type: 'decide', decision: 'approve', assistantMessageId: 'a2' },
      { type: 'RunError', code: 'LLM_UNAVAILABLE', retryable: true }
    )
    expect(thread.pendingApproval).toBeNull()
  })

  it('stops on cancel and drops events that arrive afterwards', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'TextMessageContent', delta: 'The bal' },
      { type: 'cancel' },
      { type: 'TextMessageContent', delta: 'ance' }
    )
    expect(thread.phase).toBe('idle')
    expect(last(thread)).toMatchObject({ text: 'The bal', streaming: false })
  })

  it('drops an answer that ended with nothing in it', () => {
    const thread = run(initialThread, send, { type: 'cancel' })
    expect(thread.messages.map(m => m.role)).toEqual(['user'])
  })

  it('ignores a new question while a turn is running', () => {
    const thread = run(initialThread, send)
    expect(run(thread, send)).toBe(thread)
  })

  it('lets a new question replace a card that is still waiting', () => {
    const thread = run(
      initialThread,
      send,
      { type: 'RunFinished', outcome: { type: 'interrupt', approval } },
      { ...send, userMessageId: 'u2', assistantMessageId: 'a2' }
    )
    expect(thread.phase).toBe('thinking')
    expect(thread.pendingApproval).toBeNull()
  })

  it('forgets everything on reset', () => {
    const thread = run(initialThread, send, finished('c-1'), { type: 'reset' })
    expect(thread).toEqual(initialThread)
  })
})

describe('parseSuggestions', () => {
  it('reads one suggestion per line and strips list markers', () => {
    expect(
      parseSuggestions('```suggest\n* One\n- Two\n3) Three\n\n```')
    ).toEqual(['One', 'Two', 'Three'])
  })

  it('never turns other fenced blocks into anything', () => {
    expect(parseSuggestions('```action_card\n{"card_id":"x"}\n```')).toEqual([])
  })
})
