/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useOutletContext } from 'react-router-dom'

export type EnumOption = { id?: number; code?: string; value?: string }

export type DepositCurrency = { code?: string; decimalPlaces?: number }

/** A Fineract date: [y, m, d], or a string depending on the server's date format. */
export type FineractDate = number[] | string

export type DepositTransaction = {
  id: number
  transactionType?: EnumOption & {
    accrual?: boolean
    withdrawal?: boolean
    feeDeduction?: boolean
    overdraftInterest?: boolean
    withholdTax?: boolean
  }
  date?: FineractDate
  amount?: number
  runningBalance?: number
  reversed?: boolean
}

export type DepositCharge = {
  id: number
  name?: string
  penalty?: boolean
  chargeTimeType?: EnumOption
  chargeCalculationType?: EnumOption
  dueDate?: FineractDate
  amount?: number
  amountPaid?: number
  amountWaived?: number
  amountOutstanding?: number
  isActive?: boolean
}

export type ChartIncentive = {
  id?: number
  entityType?: EnumOption
  attributeName?: EnumOption
  conditionType?: EnumOption
  attributeValue?: string
  incentiveType?: EnumOption
  amount?: number
}

export type ChartSlab = {
  id?: number
  periodType?: EnumOption
  fromPeriod?: number
  toPeriod?: number
  amountRangeFrom?: number
  amountRangeTo?: number
  annualInterestRate?: number
  description?: string
  incentives?: ChartIncentive[]
}

/**
 * GET /fixeddepositaccounts/{id}?associations=all. The generated
 * GetFixedDepositAccountsAccountIdResponse leaves out most of these fields, so
 * the account is typed locally.
 */
export type FixedDepositAccount = {
  id: number
  accountNo?: string
  externalId?: string
  clientId?: number
  clientName?: string
  groupName?: string
  depositProductName?: string
  fieldOfficerName?: string
  status?: EnumOption & {
    submittedAndPendingApproval?: boolean
    approved?: boolean
    rejected?: boolean
    withdrawnByApplicant?: boolean
    active?: boolean
    closed?: boolean
    prematureClosed?: boolean
    matured?: boolean
    transferInProgress?: boolean
    transferOnHold?: boolean
  }
  timeline?: { activatedOnDate?: FineractDate; closedOnDate?: FineractDate }
  currency?: DepositCurrency
  depositAmount?: number
  maturityAmount?: number
  maturityDate?: FineractDate
  depositPeriod?: number
  depositPeriodFrequency?: EnumOption
  onAccountClosure?: EnumOption
  withHoldTax?: boolean
  taxGroup?: { name?: string }
  nominalAnnualInterestRate?: number
  interestCompoundingPeriodType?: EnumOption
  interestPostingPeriodType?: EnumOption
  interestCalculationType?: EnumOption
  interestCalculationDaysInYearType?: EnumOption
  preClosurePenalApplicable?: boolean
  preClosurePenalInterest?: number
  preClosurePenalInterestOnType?: EnumOption
  summary?: {
    accountBalance?: number
    totalDeposits?: number
    totalWithdrawals?: number
    totalInterestEarned?: number
  }
  accountChart?: {
    fromDate?: FineractDate
    endDate?: FineractDate
    chartSlabs?: ChartSlab[]
  }
  transactions?: DepositTransaction[]
  charges?: DepositCharge[]
}

/** What the account view passes to its tabs through the router outlet. */
export type FixedDepositOutletContext = { account: FixedDepositAccount }

export const useFixedDepositAccount = () =>
  useOutletContext<FixedDepositOutletContext>().account

/**
 * Only accounts that were activated have transactions: active, closed,
 * matured, premature closed and in transfer. Fineract also marks a rejected or
 * withdrawn application as closed, so those are left out explicitly.
 */
export const hasTransactions = (account: FixedDepositAccount) => {
  const s = account.status
  if (!s || s.rejected || s.withdrawnByApplicant) return false
  return !!(
    s.active ||
    s.closed ||
    s.prematureClosed ||
    s.matured ||
    s.transferInProgress ||
    s.transferOnHold
  )
}

/** Pending and rejected accounts have no balance or history yet. */
export const isPendingOrRejected = (account: FixedDepositAccount) =>
  !!(account.status?.submittedAndPendingApproval || account.status?.rejected)

export const formatMoney = (
  value: number | undefined,
  currency: DepositCurrency | undefined,
  locale: string
) => {
  if (typeof value !== 'number') return '—'
  const digits = currency?.decimalPlaces ?? 2
  const options = {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }
  try {
    return new Intl.NumberFormat(locale, {
      ...options,
      style: 'currency',
      currency: currency?.code,
    }).format(value)
  } catch {
    // no currency, or a code Intl does not know
    return new Intl.NumberFormat(locale, options).format(value)
  }
}

/** Splits a yyyy-MM-dd string so it is read in local time rather than UTC. */
export const toDateParts = (value?: FineractDate) =>
  Array.isArray(value) ? value : value?.split('-').map(Number)
