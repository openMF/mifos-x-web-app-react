/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// The generated client types GET /recurringdepositproducts/template as a
// string, so the parts of the response this form reads are described here.
export interface EnumOption {
  id?: number
  code?: string
  value?: string
}

export interface CurrencyOption {
  code?: string
  name?: string
  decimalPlaces?: number
  inMultiplesOf?: number
  displayLabel?: string
}

export interface GlAccountOption {
  id?: number
  name?: string
  glCode?: string
}

export interface ChargeOption {
  id?: number
  name?: string
  amount?: number
  chargeTimeType?: EnumOption
  chargeCalculationType?: EnumOption
}

export interface RecurringDepositProductTemplate {
  currency?: CurrencyOption
  currencyOptions?: CurrencyOption[]
  interestCompoundingPeriodType?: EnumOption
  interestPostingPeriodType?: EnumOption
  interestCalculationType?: EnumOption
  interestCalculationDaysInYearType?: EnumOption
  interestCompoundingPeriodTypeOptions?: EnumOption[]
  interestPostingPeriodTypeOptions?: EnumOption[]
  interestCalculationTypeOptions?: EnumOption[]
  interestCalculationDaysInYearTypeOptions?: EnumOption[]
  periodFrequencyTypeOptions?: EnumOption[]
  lockinPeriodFrequencyTypeOptions?: EnumOption[]
  preClosurePenalInterestOnTypeOptions?: EnumOption[]
  accountingRuleOptions?: EnumOption[]
  taxGroupOptions?: { id?: number; name?: string }[]
  chargeOptions?: ChargeOption[]
  accountingMappingOptions?: {
    assetAccountOptions?: GlAccountOption[]
    liabilityAccountOptions?: GlAccountOption[]
    incomeAccountOptions?: GlAccountOption[]
    expenseAccountOptions?: GlAccountOption[]
  }
  chartTemplate?: {
    periodTypes?: EnumOption[]
  }
}

export interface ChartSlabForm {
  periodType?: number
  fromPeriod?: number
  toPeriod?: number
  amountRangeFrom?: number
  amountRangeTo?: number
  annualInterestRate?: number
  description: string
}

export interface InterestRateChartForm {
  name: string
  description: string
  fromDate: string
  endDate: string
  isPrimaryGroupingByAmount: boolean
  chartSlabs: ChartSlabForm[]
}

export const ACCOUNTING_RULE = {
  none: 1,
  cash: 2,
  accrualPeriodic: 3,
} as const

export type GlAccountType = 'asset' | 'liability' | 'income' | 'expense'

export type GlMappingKey =
  | 'savingsReferenceAccountId'
  | 'savingsControlAccountId'
  | 'transfersInSuspenseAccountId'
  | 'interestOnSavingsAccountId'
  | 'incomeFromFeeAccountId'
  | 'incomeFromPenaltyAccountId'
  | 'feesReceivableAccountId'
  | 'penaltiesReceivableAccountId'
  | 'interestPayableAccountId'

// GL accounts Fineract asks for under cash based accounting, and the extra
// ones it asks for under accrual based accounting.
export const CASH_GL_MAPPINGS: { key: GlMappingKey; type: GlAccountType }[] = [
  { key: 'savingsReferenceAccountId', type: 'asset' },
  { key: 'savingsControlAccountId', type: 'liability' },
  { key: 'transfersInSuspenseAccountId', type: 'liability' },
  { key: 'interestOnSavingsAccountId', type: 'expense' },
  { key: 'incomeFromFeeAccountId', type: 'income' },
  { key: 'incomeFromPenaltyAccountId', type: 'income' },
]

export const ACCRUAL_GL_MAPPINGS: { key: GlMappingKey; type: GlAccountType }[] =
  [
    { key: 'feesReceivableAccountId', type: 'asset' },
    { key: 'penaltiesReceivableAccountId', type: 'asset' },
    { key: 'interestPayableAccountId', type: 'liability' },
  ]

export const getRequiredGlMappings = (accountingRule?: number) => {
  if (accountingRule === ACCOUNTING_RULE.cash) return CASH_GL_MAPPINGS
  if (accountingRule === ACCOUNTING_RULE.accrualPeriodic)
    return [...CASH_GL_MAPPINGS, ...ACCRUAL_GL_MAPPINGS]
  return []
}

export interface RecurringDepositProductForm {
  // Details
  name: string
  shortName: string
  description: string
  // Currency
  currencyCode?: string
  digitsAfterDecimal?: number
  inMultiplesOf?: number
  // Terms
  minDepositAmount?: number
  depositAmount?: number
  maxDepositAmount?: number
  interestCompoundingPeriodType?: number
  interestPostingPeriodType?: number
  interestCalculationType?: number
  interestCalculationDaysInYearType?: number
  // Settings
  isMandatoryDeposit: boolean
  adjustAdvanceTowardsFuturePayments: boolean
  allowWithdrawal: boolean
  lockinPeriodFrequency?: number
  lockinPeriodFrequencyType?: number
  minDepositTerm?: number
  minDepositTermTypeId?: number
  inMultiplesOfDepositTerm?: number
  inMultiplesOfDepositTermTypeId?: number
  maxDepositTerm?: number
  maxDepositTermTypeId?: number
  preClosurePenalApplicable: boolean
  preClosurePenalInterest?: number
  preClosurePenalInterestOnTypeId?: number
  minBalanceForInterestCalculation?: number
  withHoldTax: boolean
  taxGroupId?: number
  // Interest rate chart
  chart: InterestRateChartForm
  // Charges
  chargeIds: number[]
  // Accounting
  accountingRule: number
  glMappings: Partial<Record<GlMappingKey, number>>
}

export const emptyChartSlab = (): ChartSlabForm => ({ description: '' })

export const initialRecurringDepositProductForm: RecurringDepositProductForm = {
  name: '',
  shortName: '',
  description: '',
  isMandatoryDeposit: false,
  adjustAdvanceTowardsFuturePayments: false,
  allowWithdrawal: false,
  preClosurePenalApplicable: false,
  withHoldTax: false,
  chart: {
    name: '',
    description: '',
    fromDate: '',
    endDate: '',
    isPrimaryGroupingByAmount: false,
    chartSlabs: [emptyChartSlab()],
  },
  chargeIds: [],
  accountingRule: ACCOUNTING_RULE.none,
  glMappings: {},
}

export type FormUpdater = (patch: Partial<RecurringDepositProductForm>) => void

/** Empty input means "not set" rather than zero */
export const toOptionalNumber = (value: string) =>
  value === '' ? undefined : Number(value)

export const toSelectOptions = (options?: EnumOption[]) =>
  (options ?? [])
    .filter(option => option.id !== undefined)
    .map(option => ({ id: option.id!.toString(), name: option.value ?? '' }))

// Days in one period of each type (days, weeks, months, years), the same
// conversion Fineract uses when it compares the minimum and maximum terms
const DAYS_PER_PERIOD_TYPE = [1, 7, 30, 365]

/** A deposit term in days, so terms of different period types can be compared */
export const depositTermInDays = (term: number, periodTypeId: number) =>
  term * (DAYS_PER_PERIOD_TYPE[periodTypeId] ?? 0)

/** Builds the POST /recurringdepositproducts body from the form state */
export const buildRecurringDepositProductPayload = (
  form: RecurringDepositProductForm
) => {
  const requiredMappings = getRequiredGlMappings(form.accountingRule)
  const glMappings = Object.fromEntries(
    requiredMappings.map(({ key }) => [key, form.glMappings[key]])
  )

  return {
    locale: 'en',
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    description: form.description.trim(),
    currencyCode: form.currencyCode,
    digitsAfterDecimal: form.digitsAfterDecimal,
    inMultiplesOf: form.inMultiplesOf,
    minDepositAmount: form.minDepositAmount,
    depositAmount: form.depositAmount,
    maxDepositAmount: form.maxDepositAmount,
    interestCompoundingPeriodType: form.interestCompoundingPeriodType,
    interestPostingPeriodType: form.interestPostingPeriodType,
    interestCalculationType: form.interestCalculationType,
    interestCalculationDaysInYearType: form.interestCalculationDaysInYearType,
    isMandatoryDeposit: form.isMandatoryDeposit,
    adjustAdvanceTowardsFuturePayments: form.adjustAdvanceTowardsFuturePayments,
    allowWithdrawal: form.allowWithdrawal,
    lockinPeriodFrequency: form.lockinPeriodFrequency,
    lockinPeriodFrequencyType: form.lockinPeriodFrequencyType,
    minDepositTerm: form.minDepositTerm,
    minDepositTermTypeId: form.minDepositTermTypeId,
    inMultiplesOfDepositTerm: form.inMultiplesOfDepositTerm,
    inMultiplesOfDepositTermTypeId: form.inMultiplesOfDepositTermTypeId,
    maxDepositTerm: form.maxDepositTerm,
    maxDepositTermTypeId: form.maxDepositTermTypeId,
    preClosurePenalApplicable: form.preClosurePenalApplicable,
    ...(form.preClosurePenalApplicable && {
      preClosurePenalInterest: form.preClosurePenalInterest,
      preClosurePenalInterestOnTypeId: form.preClosurePenalInterestOnTypeId,
    }),
    minBalanceForInterestCalculation: form.minBalanceForInterestCalculation,
    withHoldTax: form.withHoldTax,
    ...(form.withHoldTax && { taxGroupId: form.taxGroupId }),
    charts: [
      {
        name: form.chart.name.trim() || undefined,
        description: form.chart.description.trim() || undefined,
        fromDate: form.chart.fromDate,
        endDate: form.chart.endDate || undefined,
        isPrimaryGroupingByAmount: form.chart.isPrimaryGroupingByAmount,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
        chartSlabs: form.chart.chartSlabs.map(slab => ({
          ...slab,
          description: slab.description.trim() || undefined,
        })),
      },
    ],
    charges: form.chargeIds.map(id => ({ id })),
    accountingRule: form.accountingRule,
    ...glMappings,
  }
}
