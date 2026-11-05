/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Loan status ids Fineract reports for rejected, withdrawn and closed loans */
const STATUS_WITHDRAWN = 400
const STATUS_REJECTED = 500
const CLOSED_STATUS_IDS = [600, 601, 602]

export type Severity = 'active' | 'arrears' | 'pending' | 'closed' | 'neutral'

/** A date as Fineract sends it: [year, month, day] */
export type FineractDate = number[]

export interface LoanCurrency {
  code?: string
  decimalPlaces?: number
}

/**
 * Shape the loans list endpoint returns at runtime. The generated type
 * declares pageItems as a Set of the single-loan response, which carries
 * neither the client's office nor the loan type.
 */
export interface LoansListItem {
  id?: number
  accountNo?: string
  externalId?: string | { value?: string } | null
  clientId?: number
  clientName?: string
  clientOfficeId?: number
  group?: { id?: number; name?: string; officeId?: number }
  loanProductId?: number
  loanProductName?: string
  loanOfficerName?: string
  loanType?: { value?: string }
  principal?: number
  annualInterestRate?: number
  interestRatePerPeriod?: number
  numberOfRepayments?: number
  currency?: LoanCurrency
  inArrears?: boolean
  status?: {
    id?: number
    value?: string
    active?: boolean
    closed?: boolean
    overpaid?: boolean
    pendingApproval?: boolean
    waitingForDisbursal?: boolean
  }
  timeline?: {
    submittedOnDate?: FineractDate
    expectedDisbursementDate?: FineractDate
    actualDisbursementDate?: FineractDate
    expectedMaturityDate?: FineractDate
    actualMaturityDate?: FineractDate
    closedOnDate?: FineractDate
  }
  summary?: {
    principalOutstanding?: number
    totalOutstanding?: number
    totalOverdue?: number
  }
}

/** Row shape the table renders */
export interface LoanRow {
  id: number
  accountNo: string
  borrowerName: string
  loanType: string
  clientId?: number
  groupId?: number
  officeId?: number
  productId?: number
  productName: string
  principal?: number
  currency?: LoanCurrency
  statusValue: string
  severity: Severity
  isClosed: boolean
  /** The loan as the endpoint returned it, which the optional columns read */
  source: LoansListItem
}

/** Groups Fineract's loan states into the colours the list distinguishes */
const severityOf = (loan: LoansListItem): Severity => {
  const s = loan.status ?? {}
  // overpaid is its own state, not one waiting on approval or disbursal
  if (s.overpaid) return 'neutral'
  // an active loan that is overdue needs attention rather than looking healthy
  if (s.active) return loan.inArrears ? 'arrears' : 'active'
  if (s.pendingApproval || s.waitingForDisbursal) return 'pending'
  if (
    s.closed ||
    s.id === STATUS_WITHDRAWN ||
    s.id === STATUS_REJECTED ||
    CLOSED_STATUS_IDS.includes(s.id ?? -1)
  ) {
    return 'closed'
  }
  return 'neutral'
}

export const toRow = (loan: LoansListItem): LoanRow => {
  const severity = severityOf(loan)
  return {
    id: loan.id ?? 0,
    accountNo: loan.accountNo ?? '',
    borrowerName: (loan.clientName || loan.group?.name || '').trim(),
    loanType: loan.loanType?.value ?? '',
    clientId: loan.clientId,
    groupId: loan.group?.id,
    // client loans carry the office at the top level, group loans only nested
    officeId: loan.clientOfficeId ?? loan.group?.officeId,
    productId: loan.loanProductId,
    productName: loan.loanProductName ?? '',
    principal: loan.principal,
    currency: loan.currency,
    statusValue: loan.status?.value ?? '',
    severity,
    isClosed: severity === 'closed',
    source: loan,
  }
}
