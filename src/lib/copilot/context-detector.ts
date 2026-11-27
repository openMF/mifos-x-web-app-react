/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CopilotContext } from './transport'

/**
 * Validates whether a route parameter can be safely converted to a positive entity ID.
 */
function parseNumericId(val: string | undefined): number | null {
  if (!val) return null
  const num = Number(val)
  return Number.isSafeInteger(num) && num > 0 ? num : null
}

/**
 * Pure route path analyzer that maps application URL paths to logical Copilot screens
 * and extracts active entity identifiers (clientId, loanId, savingsId).
 *
 * This enables the AI assistant to know whether the user is viewing a client,
 * evaluating a specific loan, managing savings, or inspecting accounting journals.
 */
export function detectContextFromPath(
  pathname: string
): Partial<CopilotContext> {
  // Strip trailing slashes and search/hash fragments if any
  const normalized =
    pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'

  // 1. Client Loan Account: e.g. /clients/12/loans-accounts/45/general or actions
  const clientLoanMatch = normalized.match(
    /^\/clients\/(\d+)\/loans-accounts\/(\d+)(?:\/.*)?$/
  )
  if (clientLoanMatch) {
    return {
      screen: 'loan-detail',
      clientId: parseNumericId(clientLoanMatch[1]),
      loanId: parseNumericId(clientLoanMatch[2]),
    }
  }

  // 2. Client Savings Account: e.g. /clients/12/savings-accounts/88/general or actions
  const clientSavingsMatch = normalized.match(
    /^\/clients\/(\d+)\/savings-accounts\/(\d+)(?:\/.*)?$/
  )
  if (clientSavingsMatch) {
    return {
      screen: 'savings-detail',
      clientId: parseNumericId(clientSavingsMatch[1]),
      savingsId: parseNumericId(clientSavingsMatch[2]),
    }
  }

  // 3. Client Fixed / Recurring Deposits
  const clientDepositMatch = normalized.match(
    /^\/clients\/(\d+)\/(?:fixed-deposits-accounts|recurring-deposits-accounts)\/(\d+)(?:\/.*)?$/
  )
  if (clientDepositMatch) {
    return {
      screen: 'savings-detail',
      clientId: parseNumericId(clientDepositMatch[1]),
      savingsId: parseNumericId(clientDepositMatch[2]),
    }
  }

  // 4. Group Loan Account: e.g. /groups/5/loans-accounts/45/general
  const groupLoanMatch = normalized.match(
    /^\/groups\/(\d+)\/loans-accounts\/(\d+)(?:\/.*)?$/
  )
  if (groupLoanMatch) {
    return {
      screen: 'loan-detail',
      loanId: parseNumericId(groupLoanMatch[2]),
    }
  }

  // 5. Group Savings Account: e.g. /groups/5/savings-accounts/88/general
  const groupSavingsMatch = normalized.match(
    /^\/groups\/(\d+)\/savings-accounts\/(\d+)(?:\/.*)?$/
  )
  if (groupSavingsMatch) {
    return {
      screen: 'savings-detail',
      savingsId: parseNumericId(groupSavingsMatch[2]),
    }
  }

  // 6. Direct Loan Route: e.g. /loans/45 or /loans/view/45
  const directLoanMatch = normalized.match(
    /^\/loans\/(?:view\/)?(\d+)(?:\/.*)?$/
  )
  if (directLoanMatch) {
    return {
      screen: 'loan-detail',
      loanId: parseNumericId(directLoanMatch[1]),
    }
  }

  // 7. Direct Savings Route: e.g. /savings/88 or /savings/view/88
  const directSavingsMatch = normalized.match(
    /^\/savings\/(?:view\/)?(\d+)(?:\/.*)?$/
  )
  if (directSavingsMatch) {
    return {
      screen: 'savings-detail',
      savingsId: parseNumericId(directSavingsMatch[1]),
    }
  }

  // 8. Client Creation
  if (normalized === '/clients/create') {
    return { screen: 'client-create' }
  }

  // 9. Client Detail: e.g. /clients/12 or /clients/12/general
  const clientDetailMatch = normalized.match(/^\/clients\/(\d+)(?:\/.*)?$/)
  if (clientDetailMatch) {
    return {
      screen: 'client-detail',
      clientId: parseNumericId(clientDetailMatch[1]),
    }
  }

  // 10. Client List
  if (normalized === '/clients') {
    return { screen: 'client-list' }
  }

  // 11. Loans List
  if (normalized === '/loans') {
    return { screen: 'loan-list' }
  }

  // 12. Savings List
  if (normalized === '/savings') {
    return { screen: 'savings-list' }
  }

  // 13. Journal Entries / Accounting
  if (
    normalized === '/accounting/create-journal-entry' ||
    normalized.startsWith('/accounting/journal-entries') ||
    normalized.includes('journal-entry')
  ) {
    return { screen: 'journal-entry' }
  }

  if (normalized.startsWith('/accounting')) {
    return { screen: 'accounting' }
  }

  // 14. Group Routes
  if (normalized === '/groups/create') {
    return { screen: 'group-create' }
  }
  const groupDetailMatch = normalized.match(/^\/groups\/(\d+)(?:\/.*)?$/)
  if (groupDetailMatch) {
    return { screen: 'group-detail' }
  }
  if (normalized === '/groups') {
    return { screen: 'group-list' }
  }

  // 15. Reports
  if (normalized.startsWith('/reports')) {
    return { screen: 'reports' }
  }

  // 16. Users
  if (normalized.startsWith('/users')) {
    return { screen: 'users' }
  }

  // 17. Products
  if (normalized.startsWith('/products')) {
    return { screen: 'products' }
  }

  // 18. Settings
  if (normalized === '/settings') {
    return { screen: 'settings' }
  }

  // 19. Home / Dashboard
  if (
    normalized === '/' ||
    normalized === '/home' ||
    normalized === '/dashboard'
  ) {
    return { screen: 'home' }
  }

  // 20. Fallback: use top-level route name if available
  const topLevel = normalized.split('/')[1]
  if (topLevel) {
    return { screen: topLevel }
  }

  return { screen: 'home' }
}
