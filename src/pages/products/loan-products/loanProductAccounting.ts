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
export type AccountList =
  | 'asset'
  | 'income'
  | 'expense'
  | 'liability'
  | 'fund'
  | 'incomeOrLiability'

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
  for (const m of ADVANCED_MAPPINGS) delete next[m.key]
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

/** Translation keys under loanProductAccounting.advanced */
export type AdvancedMappingLabel =
  | 'paymentChannels'
  | 'fees'
  | 'penalties'
  | 'chargeOffReasons'
  | 'writeOffReasons'

/** Template option lists the first column of a mapping table picks from */
export type AdvancedMappingOptions =
  | 'paymentTypes'
  | 'fees'
  | 'penalties'
  | 'chargeOffReasons'
  | 'writeOffReasons'

export type AdvancedMapping = {
  /** Request array, e.g. feeToIncomeAccountMappings */
  key: string
  label: AdvancedMappingLabel
  options: AdvancedMappingOptions
  /** Row field holding the payment type, charge or code value id */
  valueKey: string
  /** Row field holding the GL account id */
  accountKey: string
  list: AccountList
  /** Fields of a GET /loanproducts/{id} row: the mapped thing and its account */
  readValue: 'paymentType' | 'charge' | 'reasonCodeValue'
  readAccount: 'fundSourceAccount' | 'incomeAccount' | 'expenseAccount'
}

/**
 * The "Advanced accounting rules" of the Angular web app's Accounting step,
 * with the names Fineract reads (LoanProductAccountingParams): each table maps
 * a payment type, fee, penalty or reason to its own GL account instead of the
 * product's default one. The account lists are the ones Angular offers and
 * Fineract accepts (fees may also go to a liability account).
 */
export const ADVANCED_MAPPINGS: AdvancedMapping[] = [
  {
    key: 'paymentChannelToFundSourceMappings',
    label: 'paymentChannels',
    options: 'paymentTypes',
    valueKey: 'paymentTypeId',
    accountKey: 'fundSourceAccountId',
    list: 'asset',
    readValue: 'paymentType',
    readAccount: 'fundSourceAccount',
  },
  {
    key: 'feeToIncomeAccountMappings',
    label: 'fees',
    options: 'fees',
    valueKey: 'chargeId',
    accountKey: 'incomeAccountId',
    list: 'incomeOrLiability',
    readValue: 'charge',
    readAccount: 'incomeAccount',
  },
  {
    key: 'penaltyToIncomeAccountMappings',
    label: 'penalties',
    options: 'penalties',
    valueKey: 'chargeId',
    accountKey: 'incomeAccountId',
    list: 'income',
    readValue: 'charge',
    readAccount: 'incomeAccount',
  },
  {
    key: 'chargeOffReasonToExpenseAccountMappings',
    label: 'chargeOffReasons',
    options: 'chargeOffReasons',
    valueKey: 'chargeOffReasonCodeValueId',
    accountKey: 'expenseAccountId',
    list: 'expense',
    readValue: 'reasonCodeValue',
    readAccount: 'expenseAccount',
  },
  {
    key: 'writeOffReasonsToExpenseMappings',
    label: 'writeOffReasons',
    options: 'writeOffReasons',
    valueKey: 'writeOffReasonCodeValueId',
    accountKey: 'expenseAccountId',
    list: 'expense',
    readValue: 'reasonCodeValue',
    readAccount: 'expenseAccount',
  },
]

/** One row of a mapping table; an id is undefined until it is chosen */
export type AdvancedMappingRow = Record<string, number | undefined>

export const mappingRows = (
  values: Record<string, unknown>,
  mapping: AdvancedMapping
): AdvancedMappingRow[] =>
  Array.isArray(values[mapping.key])
    ? (values[mapping.key] as AdvancedMappingRow[])
    : []

/** The "Advanced accounting rules" box is ticked while the tables are in the request */
export const usesAdvancedMappings = (values: Record<string, unknown>) =>
  ADVANCED_MAPPINGS.some(m => Array.isArray(values[m.key]))

/**
 * Ticking the box adds the five tables, empty; unticking removes them with
 * their rows, so nothing of a hidden table is sent.
 */
export const withAdvancedMappings = <T extends Record<string, unknown>>(
  values: T,
  enabled: boolean
): T => {
  const next: Record<string, unknown> = { ...values }
  for (const m of ADVANCED_MAPPINGS) {
    if (enabled) next[m.key] = mappingRows(values, m)
    else delete next[m.key]
  }
  return next as T
}

export const emptyMappingRow = (
  mapping: AdvancedMapping
): AdvancedMappingRow => ({
  [mapping.valueKey]: undefined,
  [mapping.accountKey]: undefined,
})

/**
 * Ids already mapped in the other rows of a table: a payment type, charge or
 * reason can be mapped once (Fineract refuses a reason mapped twice).
 */
export const usedMappingValues = (
  rows: AdvancedMappingRow[],
  mapping: AdvancedMapping,
  exceptRow?: number
) =>
  new Set(
    rows
      .filter((_, i) => i !== exceptRow)
      .map(row => row[mapping.valueKey])
      .filter((id): id is number => id !== undefined)
  )

/** The tables with a row whose value or account is not chosen yet */
export const incompleteMappings = (values: Record<string, unknown>) =>
  ADVANCED_MAPPINGS.filter(m =>
    mappingRows(values, m).some(row => !row[m.valueKey] || !row[m.accountKey])
  )

type MappedValue = { id?: number; name?: string }

/**
 * The rows of a table as GET /loanproducts/{id} returns them, e.g.
 * { paymentType: {...}, fundSourceAccount: {...} }, for the View page.
 */
export const readMappings = (
  product: Record<string, unknown> | null | undefined,
  mapping: AdvancedMapping
) =>
  (Array.isArray(product?.[mapping.key])
    ? (product[mapping.key] as Record<string, unknown>[])
    : []
  ).map(row => ({
    value: row[mapping.readValue] as MappedValue | undefined,
    account: row[mapping.readAccount] as GlAccountOption | undefined,
  }))
