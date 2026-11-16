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
  currency?: { code?: string }
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

// A decimal as whole units and a scale (12.5 is 125 and 1), so slab bounds are
// compared exactly rather than with floating point sums
type Decimal = { units: bigint; scale: number }

const toDecimal = (value?: number): Decimal | null => {
  if (value === undefined || !Number.isFinite(value)) return null
  const match = String(value).match(/^(-?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i)
  if (!match) return null
  const fraction = match[3] ?? ''
  const scale = fraction.length - Number(match[4] ?? 0)
  const units = BigInt(`${match[1]}${match[2] || '0'}${fraction}`)
  return scale < 0
    ? { units: units * 10n ** BigInt(-scale), scale: 0 }
    : { units, scale }
}

const compareDecimals = (first: Decimal, second: Decimal) => {
  const scale = Math.max(first.scale, second.scale)
  const a = first.units * 10n ** BigInt(scale - first.scale)
  const b = second.units * 10n ** BigInt(scale - second.scale)
  return a < b ? -1 : a > b ? 1 : 0
}

type SlabRange = { from: Decimal; to: Decimal | null }

const toRange = (from?: number, to?: number): SlabRange | null => {
  const start = toDecimal(from)
  return start === null ? null : { from: start, to: toDecimal(to) }
}

const sameRange = (first: SlabRange, second: SlabRange) =>
  compareDecimals(first.from, second.from) === 0 &&
  (first.to === null || second.to === null
    ? first.to === second.to
    : compareDecimals(first.to, second.to) === 0)

const ZERO: Decimal = { units: 0n, scale: 0 }
const ONE: Decimal = { units: 1n, scale: 0 }

// Fineract only accepts ranges that start from 0 or 1
const isProperStart = (start: Decimal) =>
  compareDecimals(start, ZERO) === 0 || compareDecimals(start, ONE) === 0

const lowestStart = (ranges: SlabRange[]) =>
  ranges.reduce<Decimal | null>(
    (lowest, range) =>
      lowest === null || compareDecimals(range.from, lowest) < 0
        ? range.from
        : lowest,
    null
  )

export type SlabRangeError =
  | 'gap'
  | 'overlap'
  | 'periodTypeMismatch'
  | 'start'
  | 'secondaryStart'

const continuousRangeError = (ranges: SlabRange[]): SlabRangeError | null => {
  const sorted = [...ranges].sort((a, b) => compareDecimals(a.from, b.from))
  for (let index = 0; index < sorted.length - 1; index++) {
    const { to } = sorted[index]
    const next = sorted[index + 1]
    if (to === null || compareDecimals(next.from, to) <= 0) return 'overlap'
    // Fineract wants the next slab to start at exactly the previous end + 1,
    // decimal amounts included
    const nextStart = { ...to, units: to.units + 10n ** BigInt(to.scale) }
    if (compareDecimals(next.from, nextStart) !== 0) return 'gap'
  }
  return null
}

/**
 * Finds the gaps and overlaps between slabs that Fineract rejects on save,
 * ported from the Angular app's deposit-product-interest-rate-chart.util.ts.
 * Slabs with the same primary range (amount or period, by the chart grouping)
 * form a group, the groups' ranges must follow on from each other, and so must
 * the secondary ranges inside each group. Both must also start from 0 or 1,
 * which Fineract checks as well but the Angular app does not.
 */
export const getSlabRangeError = (
  slabs: ChartSlabForm[],
  isPrimaryGroupingByAmount: boolean
): SlabRangeError | null => {
  // A period type without a from period is left out of the request
  const periodTypes = new Set(
    slabs
      .filter(slab => slab.fromPeriod !== undefined)
      .map(slab => slab.periodType)
      .filter(type => type !== undefined)
  )
  if (periodTypes.size > 1) return 'periodTypeMismatch'

  const groups: { primary: SlabRange; secondary: (SlabRange | null)[] }[] = []
  for (const slab of slabs) {
    const amount = toRange(slab.amountRangeFrom, slab.amountRangeTo)
    const period = toRange(slab.fromPeriod, slab.toPeriod)
    const primary = isPrimaryGroupingByAmount ? amount : period
    const secondary = isPrimaryGroupingByAmount ? period : amount
    if (primary === null) continue
    const group = groups.find(candidate =>
      sameRange(candidate.primary, primary)
    )
    if (group) group.secondary.push(secondary)
    else groups.push({ primary, secondary: [secondary] })
  }

  const primaryRanges = groups.map(group => group.primary)
  const primaryStart = lowestStart(primaryRanges)
  if (primaryStart !== null && !isProperStart(primaryStart)) return 'start'
  const primaryError = continuousRangeError(primaryRanges)
  if (primaryError) return primaryError
  for (const { secondary } of groups) {
    // A slab with no secondary range covers all of it, so it overlaps any
    // other slab in the same group
    if (secondary.length > 1 && secondary.includes(null)) return 'overlap'
    const secondaryRanges = secondary.filter(
      (range): range is SlabRange => range !== null
    )
    const secondaryStart = lowestStart(secondaryRanges)
    if (secondaryStart !== null && !isProperStart(secondaryStart))
      return 'secondaryStart'
    const error = continuousRangeError(secondaryRanges)
    if (error) return error
  }
  return null
}

/** A period type is only sent with its value, as Fineract rejects it alone */
const typeWithValue = (value?: number, type?: number) =>
  value === undefined ? undefined : type

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
    lockinPeriodFrequencyType: typeWithValue(
      form.lockinPeriodFrequency,
      form.lockinPeriodFrequencyType
    ),
    minDepositTerm: form.minDepositTerm,
    minDepositTermTypeId: form.minDepositTermTypeId,
    inMultiplesOfDepositTerm: form.inMultiplesOfDepositTerm,
    inMultiplesOfDepositTermTypeId: typeWithValue(
      form.inMultiplesOfDepositTerm,
      form.inMultiplesOfDepositTermTypeId
    ),
    maxDepositTerm: form.maxDepositTerm,
    maxDepositTermTypeId: typeWithValue(
      form.maxDepositTerm,
      form.maxDepositTermTypeId
    ),
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
          periodType: typeWithValue(slab.fromPeriod, slab.periodType),
          description: slab.description.trim() || undefined,
        })),
      },
    ],
    charges: form.chargeIds.map(id => ({ id })),
    accountingRule: form.accountingRule,
    ...glMappings,
  }
}
