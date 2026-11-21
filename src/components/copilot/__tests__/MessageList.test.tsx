/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MessageList } from '@/components/copilot/MessageList'
import type { CopilotThread } from '@/lib/copilot'
import {
  approved,
  loanSummary,
  modelRefused,
  rateLimited,
  replay,
  writeCard,
  type ScriptedTurn,
} from '@/lib/copilot/recordings'

const ASK = 'Summarise loan 000004521'
const REPAY = 'Record a repayment of 1,500'

function renderThread(thread: CopilotThread) {
  const onAsk = vi.fn()
  render(<MessageList thread={thread} onAsk={onAsk} />)
  return onAsk
}

const turns = (...list: ScriptedTurn[]) => replay(list)

describe('MessageList', () => {
  it('says it is thinking before anything arrives, without an expander that opens nothing', () => {
    renderThread(replay([{ ask: ASK, frames: loanSummary() }], { last: 0 }))

    expect(screen.getByText('Thinking')).toBeTruthy()
    expect(screen.queryByRole('button', { expanded: true })).toBeNull()
  })

  it('shows the answer without the suggest block, and its follow-ups as buttons', () => {
    const onAsk = renderThread(turns({ ask: ASK, frames: loanSummary() }))

    expect(screen.getByText(ASK)).toBeTruthy()
    expect(screen.queryByText(/```suggest/)).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Show the repayment schedule' })
    )
    expect(onAsk).toHaveBeenCalledWith('Show the repayment schedule')
  })

  it("shows the gateway's own wording for an error, and offers to ask again when it may work", () => {
    const onAsk = renderThread(turns({ ask: ASK, frames: rateLimited() }))

    const alert = screen.getByRole('alert')
    // Busy is a wait, not a failure: calm, with a short title to scan.
    expect(alert.dataset.tone).toBe('wait')
    expect(alert.textContent).toContain('Busy right now')
    expect(alert.textContent).toContain('That was a lot of questions at once.')
    fireEvent.click(screen.getByRole('button', { name: 'Ask again' }))
    expect(onAsk).toHaveBeenCalledWith(ASK)
  })

  it('does not offer to ask again when waiting will not help', () => {
    renderThread(turns({ ask: ASK, frames: modelRefused() }))

    const alert = screen.getByRole('alert')
    expect(alert.dataset.tone).toBe('blocked')
    expect(alert.textContent).toContain('Retrying will not help')
    expect(screen.queryByRole('button', { name: 'Ask again' })).toBeNull()
  })

  it('says what is waiting for confirmation, and offers no way to run it yet', () => {
    renderThread(
      turns({ ask: REPAY, frames: writeCard('repayment', 'card-1') })
    )

    expect(screen.getByRole('status').textContent).toContain(
      'Record repayment on Small Business Loan for Rajesh Kumar'
    )
    expect(
      screen.queryByRole('button', { name: /confirm|approve/i })
    ).toBeNull()
  })

  it('shows the receipt the gateway sends after a confirmed write', () => {
    renderThread(
      turns(
        { ask: REPAY, frames: writeCard('repayment', 'card-1') },
        { decide: 'approve', frames: approved('repayment') }
      )
    )

    const receipt = screen.getByRole('heading', {
      name: 'Loan updated',
    }).parentElement!
    expect(receipt.textContent).toContain('Loan account')
    expect(receipt.textContent).toContain('000004521')
    expect(screen.queryByRole('status')).toBeNull()
  })
})
