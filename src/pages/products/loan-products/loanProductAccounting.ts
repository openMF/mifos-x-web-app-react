/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract's accounting rule ids for loan products */
export const ACCOUNTING_RULE = {
  none: 1,
  cash: 2,
  accrualPeriodic: 3,
  accrualUpfront: 4,
} as const

/** Translation key under loanProductAccounting.rules for a rule id */
export const ruleLabel = (rule?: number) =>
  (
    ({
      1: 'none',
      2: 'cash',
      3: 'accrualPeriodic',
      4: 'accrualUpfront',
    }) as const
  )[rule as 1 | 2 | 3 | 4]

export const isAccrual = (rule?: number) =>
  rule === ACCOUNTING_RULE.accrualPeriodic ||
  rule === ACCOUNTING_RULE.accrualUpfront

/** Whether the product books journal entries, so it needs GL accounts */
export const usesAccounts = (rule?: number) =>
  rule !== undefined && rule > ACCOUNTING_RULE.none

/** Which GL accounts of the template a field picks from */
export type AccountList = 'asset' | 'income' | 'expense' | 'liability' | 'fund'

export type AccountingSection = 'assets' | 'income' | 'expenses' | 'liabilities'

/** Translation keys under loanProductAccounting.fields */
export type AccountingFieldLabel =
  | 'fundSource'
  | 'loanPortfolio'
  | 'transfersInSuspense'
  | 'interestReceivable'
  | 'feesReceivable'
  | 'penaltiesReceivable'
  | 'incomeFromInterest'
  | 'incomeFromFees'
  | 'incomeFromPenalties'
  | 'incomeFromRecovery'
  | 'incomeFromChargeOffInterest'
  | 'incomeFromChargeOffFees'
  | 'incomeFromChargeOffPenalty'
  | 'incomeFromGoodwillCreditInterest'
  | 'incomeFromGoodwillCreditFees'
  | 'incomeFromGoodwillCreditPenalty'
  | 'lossesWrittenOff'
  | 'goodwillCreditExpense'
  | 'chargeOffExpense'
  | 'chargeOffFraudExpense'
  | 'overpaymentLiability'

export type AccountingField = {
  /** Request parameter, e.g. fundSourceAccountId */
  key: string
  label: AccountingFieldLabel
  section: AccountingSection
  list: AccountList
  /** 'any' = Cash and both Accruals; 'accrual' = only shown and required for Accrual */
  required: 'any' | 'accrual' | false
}

/**
 * The GL account mappings of the Angular web app's loan product Accounting
 * step, with what Fineract requires (LoanProductDataValidator): the 9 'any'
 * accounts for Cash and Accrual, and the 3 receivables for Accrual only.
 */
export const ACCOUNTING_FIELDS: AccountingField[] = [
  {
    key: 'fundSourceAccountId',
    label: 'fundSource',
    section: 'assets',
    list: 'fund',
    required: 'any',
  },
  {
    key: 'loanPortfolioAccountId',
    label: 'loanPortfolio',
    section: 'assets',
    list: 'asset',
    required: 'any',
  },
  {
    key: 'transfersInSuspenseAccountId',
    label: 'transfersInSuspense',
    section: 'assets',
    list: 'asset',
    required: 'any',
  },
  {
    key: 'receivableInterestAccountId',
    label: 'interestReceivable',
    section: 'assets',
    list: 'asset',
    required: 'accrual',
  },
  {
    key: 'receivableFeeAccountId',
    label: 'feesReceivable',
    section: 'assets',
    list: 'asset',
    required: 'accrual',
  },
  {
    key: 'receivablePenaltyAccountId',
    label: 'penaltiesReceivable',
    section: 'assets',
    list: 'asset',
    required: 'accrual',
  },
  {
    key: 'interestOnLoanAccountId',
    label: 'incomeFromInterest',
    section: 'income',
    list: 'income',
    required: 'any',
  },
  {
    key: 'incomeFromFeeAccountId',
    label: 'incomeFromFees',
    section: 'income',
    list: 'income',
    required: 'any',
  },
  {
    key: 'incomeFromPenaltyAccountId',
    label: 'incomeFromPenalties',
    section: 'income',
    list: 'income',
    required: 'any',
  },
  {
    key: 'incomeFromRecoveryAccountId',
    label: 'incomeFromRecovery',
    section: 'income',
    list: 'income',
    required: 'any',
  },
  {
    key: 'incomeFromChargeOffInterestAccountId',
    label: 'incomeFromChargeOffInterest',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'incomeFromChargeOffFeesAccountId',
    label: 'incomeFromChargeOffFees',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'incomeFromChargeOffPenaltyAccountId',
    label: 'incomeFromChargeOffPenalty',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'incomeFromGoodwillCreditInterestAccountId',
    label: 'incomeFromGoodwillCreditInterest',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'incomeFromGoodwillCreditFeesAccountId',
    label: 'incomeFromGoodwillCreditFees',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'incomeFromGoodwillCreditPenaltyAccountId',
    label: 'incomeFromGoodwillCreditPenalty',
    section: 'income',
    list: 'income',
    required: false,
  },
  {
    key: 'writeOffAccountId',
    label: 'lossesWrittenOff',
    section: 'expenses',
    list: 'expense',
    required: 'any',
  },
  {
    key: 'goodwillCreditAccountId',
    label: 'goodwillCreditExpense',
    section: 'expenses',
    list: 'expense',
    required: false,
  },
  {
    key: 'chargeOffExpenseAccountId',
    label: 'chargeOffExpense',
    section: 'expenses',
    list: 'expense',
    required: false,
  },
  {
    key: 'chargeOffFraudExpenseAccountId',
    label: 'chargeOffFraudExpense',
    section: 'expenses',
    list: 'expense',
    required: false,
  },
  {
    key: 'overpaymentLiabilityAccountId',
    label: 'overpaymentLiability',
    section: 'liabilities',
    list: 'liability',
    required: 'any',
  },
]

export const ACCOUNTING_SECTIONS: AccountingSection[] = [
  'assets',
  'income',
  'expenses',
  'liabilities',
]

/** The fields shown for a rule: none for None, the receivables only for Accrual */
export const accountingFieldsFor = (rule?: number) =>
  usesAccounts(rule)
    ? ACCOUNTING_FIELDS.filter(f => f.required !== 'accrual' || isAccrual(rule))
    : []

/** The required fields with no account chosen, in the order they are shown */
export const missingAccounts = (
  rule: number | undefined,
  values: Record<string, unknown>
) => accountingFieldsFor(rule).filter(f => f.required && !values[f.key])

/**
 * Removes every account mapping (and the accrual-only setting) from the
 * request, so a rule change can't leave accounts of a hidden field behind.
 */
export const withoutAccountMappings = <T extends Record<string, unknown>>(
  values: T
): T => {
  const next: Record<string, unknown> = { ...values }
  for (const f of ACCOUNTING_FIELDS) delete next[f.key]
  delete next.enableAccrualActivityPosting
  return next as T
}

/**
 * GET /loanproducts/{id} returns the mappings in accountingMappings, named
 * after the request parameter without "Id" (fundSourceAccountId ->
 * fundSourceAccount).
 */
export const mappingKey = (key: string) => key.replace(/Id$/, '')

export type GlAccountOption = { id?: number; name?: string; glCode?: string }

/** "Name (GL code)", the way the Angular web app lists GL accounts */
export const glAccountLabel = (account?: GlAccountOption) =>
  account?.name
    ? account.glCode
      ? `${account.name} (${account.glCode})`
      : account.name
    : ''
