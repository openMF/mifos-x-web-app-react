/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ArrowLeftRight,
  BookOpen,
  Calculator,
  Calendar,
  CheckCheck,
  CreditCard,
  Percent,
  PiggyBank,
  Scale,
  Search,
  TriangleAlert,
  User,
  type LucideIcon,
} from 'lucide-react'

export type StarterKey =
  | 'overdueLoans'
  | 'findClient'
  | 'savingsBalance'
  | 'loanSchedule'
  | 'loanForeclosure'
  | 'loanWaiver'
  | 'clientSummary'
  | 'clientOverdue'
  | 'clientAccounts'
  | 'savingsBalanceDetail'
  | 'savingsTransactions'
  | 'savingsCalculateInterest'
  | 'glAccountBalances'
  | 'recentJournalEntries'
  | 'reconcileDiscrepancies'

export interface StarterItem {
  key: StarterKey
  icon: LucideIcon
}

export const DEFAULT_STARTERS: StarterItem[] = [
  { key: 'overdueLoans', icon: TriangleAlert },
  { key: 'findClient', icon: Search },
  { key: 'savingsBalance', icon: PiggyBank },
]

export const LOAN_STARTERS: StarterItem[] = [
  { key: 'loanSchedule', icon: Calendar },
  { key: 'loanForeclosure', icon: Calculator },
  { key: 'loanWaiver', icon: Percent },
]

export const CLIENT_STARTERS: StarterItem[] = [
  { key: 'clientSummary', icon: User },
  { key: 'clientOverdue', icon: TriangleAlert },
  { key: 'clientAccounts', icon: CreditCard },
]

export const SAVINGS_STARTERS: StarterItem[] = [
  { key: 'savingsBalanceDetail', icon: PiggyBank },
  { key: 'savingsTransactions', icon: ArrowLeftRight },
  { key: 'savingsCalculateInterest', icon: Calculator },
]

export const ACCOUNTING_STARTERS: StarterItem[] = [
  { key: 'glAccountBalances', icon: Scale },
  { key: 'recentJournalEntries', icon: BookOpen },
  { key: 'reconcileDiscrepancies', icon: CheckCheck },
]

/**
 * Returns three screen-aware suggested questions so officers can act immediately
 * on the exact record (loan, client, savings, journal) open on their screen.
 */
export function getStartersForScreen(screen?: string): StarterItem[] {
  switch (screen) {
    case 'loan-detail':
      return LOAN_STARTERS
    case 'client-detail':
      return CLIENT_STARTERS
    case 'savings-detail':
      return SAVINGS_STARTERS
    case 'journal-entry':
    case 'accounting':
      return ACCOUNTING_STARTERS
    default:
      return DEFAULT_STARTERS
  }
}
