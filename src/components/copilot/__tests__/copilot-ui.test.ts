/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import type { CopilotMessage } from '@/lib/copilot'
import {
  canUseCopilot,
  dayPart,
  elapsedSeconds,
  errorMessageKey,
  groupTurns,
  isDisplayMode,
  replyArrived,
  visibleText,
} from '../copilot-ui'

describe('canUseCopilot', () => {
  it('is hidden when the deployment has not switched it on', () => {
    expect(canUseCopilot(false, ['ALL_FUNCTIONS'])).toBe(false)
    expect(canUseCopilot(false, undefined)).toBe(false)
  })

  it.each(['ALL_FUNCTIONS', 'USE_MCP_TOOLS', 'READ_COPILOT'])(
    'is offered to an officer with %s',
    permission => {
      expect(canUseCopilot(true, ['READ_CLIENT', permission])).toBe(true)
    }
  )

  it('is hidden from an officer without any of those permissions', () => {
    expect(canUseCopilot(true, ['READ_CLIENT', 'READ_LOAN'])).toBe(false)
    expect(canUseCopilot(true, [])).toBe(false)
  })

  it('is offered when the permissions are not known to the app', () => {
    expect(canUseCopilot(true, undefined)).toBe(true)
    expect(canUseCopilot(true, null)).toBe(true)
  })
})

describe('errorMessageKey', () => {
  it.each([
    ['LLM_UNAVAILABLE', 'errors.timedOut'],
    ['AUTH_EXPIRED', 'errors.sessionExpired'],
    ['PERMISSION_DENIED', 'errors.permissionDenied'],
    ['RATE_LIMITED', 'errors.rateLimited'],
    ['TOOL_FAILED', 'errors.toolFailed'],
    ['INTERNAL', 'errors.streamFailed'],
    ['CANCELLED', 'errors.streamFailed'],
  ] as const)('maps %s to %s', (code, key) => {
    expect(errorMessageKey(code)).toBe(key)
  })
})

describe('visibleText', () => {
  it('hides a suggest block the model is still writing', () => {
    expect(visibleText('Here it is.\n\n```suggest\n- Show sch', true)).toBe(
      'Here it is.'
    )
  })

  it('leaves text without a suggest block alone', () => {
    expect(visibleText('The balance is', true)).toBe('The balance is')
  })

  it('shows a finished answer as the reducer left it', () => {
    expect(visibleText('Done.', false)).toBe('Done.')
  })
})

describe('elapsedSeconds', () => {
  it('rounds to whole seconds and never shows zero', () => {
    expect(elapsedSeconds(200)).toBe(1)
    expect(elapsedSeconds(1400)).toBe(1)
    expect(elapsedSeconds(2600)).toBe(3)
  })
})

describe('groupTurns', () => {
  const message = (
    id: string,
    role: 'user' | 'assistant',
    text: string,
    streaming = false
  ): CopilotMessage => ({
    id,
    role,
    text,
    streaming,
    steps: [],
    cards: [],
    suggestions: [],
  })

  it('pairs each question with its answer', () => {
    const turns = groupTurns([
      message('1', 'user', 'Overdue loans?'),
      message('2', 'assistant', 'None.'),
      message('3', 'user', 'Find Maria'),
      message('4', 'assistant', 'Found her.'),
    ])
    expect(turns.map(turn => turn.question?.id)).toEqual(['1', '3'])
    expect(turns.map(turn => turn.answers.map(a => a.id))).toEqual([
      ['2'],
      ['4'],
    ])
  })

  it('makes the same question asked again a branch of that turn', () => {
    const turns = groupTurns([
      message('1', 'user', 'Overdue loans?'),
      message('2', 'assistant', 'None.'),
      message('3', 'user', 'Overdue loans?'),
      message('4', 'assistant', 'Still none.', true),
    ])
    expect(turns).toHaveLength(1)
    expect(turns[0].answers.map(a => a.id)).toEqual(['2', '4'])
  })

  it('keeps the same question apart when asked later, not right after', () => {
    const turns = groupTurns([
      message('1', 'user', 'Overdue loans?'),
      message('2', 'assistant', 'None.'),
      message('3', 'user', 'Find Maria'),
      message('4', 'assistant', 'Found her.'),
      message('5', 'user', 'Overdue loans?'),
      message('6', 'assistant', 'One now.'),
    ])
    expect(turns).toHaveLength(3)
  })
})

describe('replyArrived', () => {
  it('is true when a running turn finishes, fails or waits for a confirmation', () => {
    expect(replyArrived('streaming', 'idle')).toBe(true)
    expect(replyArrived('thinking', 'error')).toBe(true)
    expect(replyArrived('streaming', 'awaitingApproval')).toBe(true)
  })

  it('is false while a turn starts or keeps running', () => {
    expect(replyArrived('idle', 'thinking')).toBe(false)
    expect(replyArrived('thinking', 'streaming')).toBe(false)
    expect(replyArrived('idle', 'idle')).toBe(false)
  })
})

describe('isDisplayMode', () => {
  it('accepts the three modes and nothing else', () => {
    expect(isDisplayMode('floating')).toBe(true)
    expect(isDisplayMode('docked')).toBe(true)
    expect(isDisplayMode('fullscreen')).toBe(true)
    // An old or tampered stored value falls back to the default.
    expect(isDisplayMode('expanded')).toBe(false)
    expect(isDisplayMode(null)).toBe(false)
  })
})

describe('dayPart', () => {
  it('greets by the hour on the clock', () => {
    expect(dayPart(5)).toBe('morning')
    expect(dayPart(11)).toBe('morning')
    expect(dayPart(12)).toBe('afternoon')
    expect(dayPart(17)).toBe('afternoon')
    expect(dayPart(18)).toBe('evening')
    expect(dayPart(23)).toBe('evening')
    // A late shift is still an evening, not a morning.
    expect(dayPart(2)).toBe('evening')
  })
})
