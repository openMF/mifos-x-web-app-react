/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import type { CopilotEvent } from '../events'
import { V1EventMapper, decisionPath, httpError } from '../v1-protocol'

/** Run v1 frames through one mapper, including the end of the stream. */
function translate(...frames: [string, unknown][]): CopilotEvent[] {
  const mapper = new V1EventMapper()
  return [
    ...frames.flatMap(([event, data]) =>
      mapper.map({ event, data: JSON.stringify(data) })
    ),
    ...mapper.end(),
  ]
}

const success = { type: 'RunFinished', outcome: { type: 'success' } }

describe('V1EventMapper', () => {
  it('maps tokens to text and done to a successful finish', () => {
    expect(
      translate(
        ['token', { delta: 'Hello ' }],
        ['token', { delta: '' }],
        ['done', { conversation_id: 'c-1' }]
      )
    ).toEqual([
      { type: 'TextMessageContent', delta: 'Hello ' },
      { ...success, conversationId: 'c-1' },
    ])
  })

  it('maps thinking to reasoning events', () => {
    expect(
      translate(
        ['thinking', { phase: 'start' }],
        ['thinking', { phase: 'delta', delta: 'Checking.' }],
        ['thinking', { phase: 'end', elapsed_ms: 1200 }],
        ['done', { conversation_id: '' }]
      )
    ).toEqual([
      { type: 'ReasoningStart' },
      { type: 'ReasoningContent', delta: 'Checking.' },
      { type: 'ReasoningEnd', elapsedMs: 1200 },
      success,
    ])
  })

  it('pairs started and finished tool calls under one id', () => {
    expect(
      translate(
        [
          'tool_call',
          {
            tool: 'get_loan',
            label: 'Looking up the loan',
            phase: 'started',
            read_only: true,
          },
        ],
        [
          'tool_call',
          {
            tool: 'get_loan',
            label: 'Looked up the loan',
            phase: 'finished',
            read_only: true,
            duration_ms: 420,
          },
        ],
        ['done', {}]
      )
    ).toEqual([
      {
        type: 'ToolCallStart',
        toolCallId: 'step-1',
        toolName: 'get_loan',
        label: 'Looking up the loan',
        readOnly: true,
      },
      {
        type: 'ToolCallEnd',
        toolCallId: 'step-1',
        toolName: 'get_loan',
        label: 'Looked up the loan',
        durationMs: 420,
      },
      success,
    ])
  })

  it('falls back to the tool id when the gateway sends no label', () => {
    const [start] = translate([
      'tool_call',
      { tool: 'get_client', phase: 'started', read_only: false },
    ])
    expect(start).toMatchObject({ label: 'get_client', readOnly: false })
  })

  it('records a finished step that never started as a complete step', () => {
    const events = translate(
      ['tool_call', { tool: 'get_loan', label: 'Read', phase: 'finished' }],
      ['done', {}]
    )
    expect(events.map(e => e.type)).toEqual([
      'ToolCallStart',
      'ToolCallEnd',
      'RunFinished',
    ])
  })

  it('turns an approval card into a paused run, without needing done', () => {
    expect(
      translate([
        'action_card',
        {
          card_id: 'card_42',
          tool: 'make_loan_repayment',
          args: { loanId: 12, transactionAmount: 1500 },
          rows: { Client: 'A. Rao', Amount: 'INR 1,500.00', Note: '' },
          human_summary: 'Record a repayment of INR 1,500.00',
          idempotency_key: 'key-1',
          expires_at: '2026-10-12T10:15:00Z',
        },
      ])
    ).toEqual([
      {
        type: 'RunFinished',
        outcome: {
          type: 'interrupt',
          approval: {
            cardId: 'card_42',
            tool: 'make_loan_repayment',
            args: { loanId: 12, transactionAmount: 1500 },
            // Blank rows are dropped, order is kept.
            rows: [
              { label: 'Client', value: 'A. Rao' },
              { label: 'Amount', value: 'INR 1,500.00' },
            ],
            summary: 'Record a repayment of INR 1,500.00',
            idempotencyKey: 'key-1',
            expiresAt: '2026-10-12T10:15:00Z',
          },
        },
      },
    ])
  })

  it('refuses an approval card whose id could alter the URL', () => {
    expect(
      translate(['action_card', { card_id: '../../admin', tool: 'x' }])
    ).toEqual([
      {
        type: 'RunError',
        code: 'INTERNAL',
        message: 'Invalid confirmation reference.',
        retryable: false,
      },
    ])
  })

  it('maps a display-only card', () => {
    const [card] = translate([
      'action_card',
      {
        card: {
          type: 'loan',
          title: 'Loan 12',
          data: { Balance: 'INR 42,000.00', Missing: null },
          actions: [{ label: 'Open', route: '/loans/12' }, { nolabel: 1 }],
        },
      },
    ])
    expect(card).toEqual({
      type: 'DisplayCard',
      card: {
        type: 'loan',
        title: 'Loan 12',
        data: { Balance: 'INR 42,000.00' },
        actions: [{ label: 'Open', route: '/loans/12' }],
      },
    })
  })

  it('maps suggestions and drops blank ones', () => {
    const [event] = translate(['suggest', { items: ['Show schedule', ' '] }])
    expect(event).toEqual({
      type: 'Custom',
      name: 'suggestions',
      value: ['Show schedule'],
    })
  })

  it('reports an error once, with the conversation id from the trailing done', () => {
    expect(
      translate(
        ['error', { code: 'RATE_LIMITED', message: 'Busy', retryable: true }],
        ['error', { code: 'INTERNAL', message: 'Later fallout' }],
        ['done', { conversation_id: 'c-9' }],
        ['token', { delta: 'ignored after done' }]
      )
    ).toEqual([
      {
        type: 'RunError',
        code: 'RATE_LIMITED',
        message: 'Busy',
        retryable: true,
        conversationId: 'c-9',
      },
    ])
  })

  it('treats an unknown error code as INTERNAL', () => {
    const [event] = translate(['error', { code: 'NOPE' }], ['done', {}])
    expect(event).toMatchObject({ type: 'RunError', code: 'INTERNAL' })
  })

  it('ignores unknown events and malformed frames', () => {
    const mapper = new V1EventMapper()
    expect(mapper.map({ event: 'future_event', data: '{}' })).toEqual([])
    expect(mapper.map({ event: 'token', data: 'not json' })).toEqual([])
    expect(mapper.map({ event: 'token', data: '[1]' })).toEqual([])
  })

  it('reads the event type from the payload when the frame has no name', () => {
    const mapper = new V1EventMapper()
    expect(
      mapper.map({ event: '', data: '{"type":"token","delta":"x"}' })
    ).toEqual([{ type: 'TextMessageContent', delta: 'x' }])
  })

  it('reports an answer cut off before done as an error, not as complete', () => {
    expect(translate(['token', { delta: 'The balance is' }])).toEqual([
      { type: 'TextMessageContent', delta: 'The balance is' },
      { type: 'RunError', code: 'INTERNAL', retryable: false },
    ])
  })
})

describe('httpError', () => {
  it.each([
    [401, 'AUTH_EXPIRED', true],
    [403, 'PERMISSION_DENIED', false],
    [429, 'RATE_LIMITED', true],
    [503, 'LLM_UNAVAILABLE', true],
    [500, 'INTERNAL', false],
  ])('maps HTTP %i to %s', (status, code, retryable) => {
    expect(httpError(status, null)).toEqual({
      type: 'RunError',
      code,
      message: undefined,
      retryable,
    })
  })

  it("prefers the gateway's own code, message and retry hint", () => {
    expect(
      httpError(500, {
        code: 'TOOL_FAILED',
        message: 'Fineract rejected it',
        retryable: true,
      })
    ).toEqual({
      type: 'RunError',
      code: 'TOOL_FAILED',
      message: 'Fineract rejected it',
      retryable: true,
    })
  })
})

describe('decisionPath', () => {
  it('builds the decision URL path', () => {
    expect(decisionPath('card_42')).toBe(
      '/copilot/api/v1/actions/card_42/decision'
    )
  })
})
