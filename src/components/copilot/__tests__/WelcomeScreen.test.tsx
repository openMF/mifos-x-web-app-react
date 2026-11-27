/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import { store } from '@/app/store'
import { WelcomeScreen } from '../WelcomeScreen'
import { getStartersForScreen } from '../welcome-starters'

function renderWelcome(context?: {
  screen?: string
  loanId?: number
  clientId?: number
  savingsId?: number
}) {
  const onAsk = vi.fn()
  render(
    <Provider store={store}>
      <MemoryRouter>
        <WelcomeScreen
          onAsk={onAsk}
          orbState="idle"
          spacious={false}
          context={context}
        />
      </MemoryRouter>
    </Provider>
  )
  return onAsk
}

describe('WelcomeScreen and getStartersForScreen', () => {
  it('returns default starters for home or unrecognized screens', () => {
    const starters = getStartersForScreen('home')
    expect(starters.map(s => s.key)).toEqual([
      'overdueLoans',
      'findClient',
      'savingsBalance',
    ])
  })

  it('returns loan starters for loan-detail screen', () => {
    const starters = getStartersForScreen('loan-detail')
    expect(starters.map(s => s.key)).toEqual([
      'loanSchedule',
      'loanForeclosure',
      'loanWaiver',
    ])
  })

  it('returns client starters for client-detail screen', () => {
    const starters = getStartersForScreen('client-detail')
    expect(starters.map(s => s.key)).toEqual([
      'clientSummary',
      'clientOverdue',
      'clientAccounts',
    ])
  })

  it('returns savings starters for savings-detail screen', () => {
    const starters = getStartersForScreen('savings-detail')
    expect(starters.map(s => s.key)).toEqual([
      'savingsBalanceDetail',
      'savingsTransactions',
      'savingsCalculateInterest',
    ])
  })

  it('returns accounting starters for journal-entry and accounting screens', () => {
    const s1 = getStartersForScreen('journal-entry')
    expect(s1.map(s => s.key)).toEqual([
      'glAccountBalances',
      'recentJournalEntries',
      'reconcileDiscrepancies',
    ])

    const s2 = getStartersForScreen('accounting')
    expect(s2.map(s => s.key)).toEqual([
      'glAccountBalances',
      'recentJournalEntries',
      'reconcileDiscrepancies',
    ])
  })

  it('renders loan-detail starters when loan context is active and triggers onAsk on click', () => {
    const onAsk = renderWelcome({ screen: 'loan-detail', loanId: 45 })

    expect(screen.getByText('Check repayment schedule')).toBeTruthy()
    expect(screen.getByText('Simulate foreclosure')).toBeTruthy()
    expect(screen.getByText('Calculate interest waiver')).toBeTruthy()

    fireEvent.click(screen.getByText('Check repayment schedule'))
    expect(onAsk).toHaveBeenCalledWith('Check repayment schedule')
  })

  it('renders client-detail starters when client context is active', () => {
    renderWelcome({ screen: 'client-detail', clientId: 12 })

    expect(screen.getByText('Summarize client profile')).toBeTruthy()
    expect(screen.getByText('Check overdue loans')).toBeTruthy()
    expect(screen.getByText('List all active accounts')).toBeTruthy()
  })

  it('renders default starters when on general screens', () => {
    renderWelcome({ screen: 'home' })

    expect(screen.getByText('Which loans are overdue this week?')).toBeTruthy()
    expect(screen.getByText('Find a client by name')).toBeTruthy()
    expect(screen.getByText("Check a client's savings balance")).toBeTruthy()
  })
})
