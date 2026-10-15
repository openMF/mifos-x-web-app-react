/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type productsEn from '@/locales/en-US/products.json'

// The OpenAPI spec types GET /fixeddepositproducts/template as a plain string
// and leaves several create fields out, so the shapes used here are local.

/** Translation keys for the form's field labels */
export type FieldLabelKey =
  keyof (typeof productsEn)['createFixedDepositProduct']['fields']

export type EnumOption = { id: number; code?: string; value?: string }

export type GlAccountOption = { id: number; name?: string; glCode?: string }

export type FixedDepositProductTemplate = {
  currency?: { code?: string; decimalPlaces?: number }
  currencyOptions?: { code: string; name?: string; decimalPlaces?: number }[]
  interestCompoundingPeriodType?: EnumOption
  interestPostingPeriodType?: EnumOption
  interestCalculationType?: EnumOption
  interestCalculationDaysInYearType?: EnumOption
  interestCompoundingPeriodTypeOptions?: EnumOption[]
  interestPostingPeriodTypeOptions?: EnumOption[]
  interestCalculationTypeOptions?: EnumOption[]
  interestCalculationDaysInYearTypeOptions?: EnumOption[]
  lockinPeriodFrequencyTypeOptions?: EnumOption[]
  periodFrequencyTypeOptions?: EnumOption[]
  preClosurePenalInterestOnTypeOptions?: EnumOption[]
  taxGroupOptions?: { id: number; name?: string }[]
  chargeOptions?: {
    id: number
    name?: string
    amount?: number
    currency?: { code?: string }
    chargeTimeType?: { value?: string }
    chargeCalculationType?: { value?: string }
  }[]
  accountingMappingOptions?: {
    assetAccountOptions?: GlAccountOption[]
    liabilityAccountOptions?: GlAccountOption[]
    expenseAccountOptions?: GlAccountOption[]
    incomeAccountOptions?: GlAccountOption[]
  }
  chartTemplate?: { periodTypes?: EnumOption[] }
}

export type ChartSlabForm = {
  periodType?: number
  fromPeriod?: number
  toPeriod?: number
  amountRangeFrom?: number
  amountRangeTo?: number
  annualInterestRate?: number
  description?: string
}

export type ChartForm = {
  name: string
  description: string
  fromDate: string
  endDate: string
  isPrimaryGroupingByAmount: boolean
  chartSlabs: ChartSlabForm[]
}

/** GL account fields sent when accounting is cash or accrual based */
export const ACCOUNT_MAPPING_FIELDS = {
  assets: [
    'savingsReferenceAccountId',
    'feesReceivableAccountId',
    'penaltiesReceivableAccountId',
  ],
  liabilities: [
    'savingsControlAccountId',
    'transfersInSuspenseAccountId',
    'interestPayableAccountId',
  ],
  expenses: ['interestOnSavingsAccountId'],
  income: ['incomeFromFeeAccountId', 'incomeFromPenaltyAccountId'],
} as const

/** Only needed for accrual accounting */
export const ACCRUAL_ONLY_FIELDS: readonly AccountMappingField[] = [
  'feesReceivableAccountId',
  'penaltiesReceivableAccountId',
  'interestPayableAccountId',
]

export type AccountMappingField =
  (typeof ACCOUNT_MAPPING_FIELDS)[keyof typeof ACCOUNT_MAPPING_FIELDS][number]

export const ACCOUNTING_RULE_NONE = 1
export const ACCOUNTING_RULE_CASH = 2
export const ACCOUNTING_RULE_ACCRUAL_PERIODIC = 3

export type FixedDepositProductForm = {
  name: string
  shortName: string
  description: string
  currencyCode: string
  digitsAfterDecimal?: number
  inMultiplesOf?: number
  minDepositAmount?: number
  depositAmount?: number
  maxDepositAmount?: number
  interestCompoundingPeriodType?: number
  interestPostingPeriodType?: number
  interestCalculationType?: number
  interestCalculationDaysInYearType?: number
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
  withHoldTax: boolean
  taxGroupId?: number
  chart: ChartForm
  chargeIds: number[]
  accountingRule: number
  accounts: Partial<Record<AccountMappingField, number>>
}

export type FixedDepositStepProps = {
  formData: FixedDepositProductForm
  onChange: (data: FixedDepositProductForm) => void
  template?: FixedDepositProductTemplate
}

const today = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export const createInitialForm = (): FixedDepositProductForm => ({
  name: '',
  shortName: '',
  description: '',
  currencyCode: '',
  preClosurePenalApplicable: false,
  withHoldTax: false,
  chart: {
    name: '',
    description: '',
    fromDate: today(),
    endDate: '',
    isPrimaryGroupingByAmount: false,
    chartSlabs: [],
  },
  chargeIds: [],
  accountingRule: ACCOUNTING_RULE_NONE,
  accounts: {},
})

/** Fills the defaults the template suggests, without overwriting user input */
export const applyTemplateDefaults = (
  form: FixedDepositProductForm,
  template: FixedDepositProductTemplate
): FixedDepositProductForm => {
  const currency = template.currency ?? template.currencyOptions?.[0]
  return {
    ...form,
    currencyCode: form.currencyCode || currency?.code || '',
    digitsAfterDecimal: form.digitsAfterDecimal ?? currency?.decimalPlaces,
    interestCompoundingPeriodType:
      form.interestCompoundingPeriodType ??
      template.interestCompoundingPeriodType?.id,
    interestPostingPeriodType:
      form.interestPostingPeriodType ?? template.interestPostingPeriodType?.id,
    interestCalculationType:
      form.interestCalculationType ?? template.interestCalculationType?.id,
    interestCalculationDaysInYearType:
      form.interestCalculationDaysInYearType ??
      template.interestCalculationDaysInYearType?.id,
  }
}

export const toSelectOptions = (options: EnumOption[] | undefined) =>
  (options ?? []).map(option => ({
    id: option.id.toString(),
    name: option.value ?? option.id.toString(),
  }))

/** Turns an input's text into a number, keeping an empty input unset */
export const toOptionalNumber = (value: string) =>
  value === '' ? undefined : Number(value)

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === ''

/** Drops unset fields, since Fineract rejects some of them when sent blank */
const withoutBlanks = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, field]) => !isBlank(field))
  ) as Partial<T>

// Matches the locale the other product forms send numbers and dates in
const LOCALE = 'en'

export const buildFixedDepositProductRequest = (
  form: FixedDepositProductForm
) => {
  const { chart, chargeIds, accounts, ...fields } = form
  const usesAccounts = form.accountingRule !== ACCOUNTING_RULE_NONE
  const isAccrual = form.accountingRule === ACCOUNTING_RULE_ACCRUAL_PERIODIC

  const accountFields = usesAccounts
    ? Object.fromEntries(
        Object.entries(accounts).filter(
          ([field]) =>
            isAccrual ||
            !ACCRUAL_ONLY_FIELDS.includes(field as AccountMappingField)
        )
      )
    : {}

  return {
    ...withoutBlanks({
      ...fields,
      preClosurePenalInterest: form.preClosurePenalApplicable
        ? form.preClosurePenalInterest
        : undefined,
      preClosurePenalInterestOnTypeId: form.preClosurePenalApplicable
        ? form.preClosurePenalInterestOnTypeId
        : undefined,
      taxGroupId: form.withHoldTax ? form.taxGroupId : undefined,
    }),
    ...accountFields,
    charges: chargeIds.map(id => ({ id })),
    charts: [
      {
        ...withoutBlanks({
          name: chart.name.trim(),
          description: chart.description.trim(),
          fromDate: chart.fromDate,
          endDate: chart.endDate,
        }),
        isPrimaryGroupingByAmount: chart.isPrimaryGroupingByAmount,
        dateFormat: 'yyyy-MM-dd',
        locale: LOCALE,
        chartSlabs: chart.chartSlabs.map(slab => ({
          ...withoutBlanks(slab),
          incentives: [],
        })),
      },
    ],
    locale: LOCALE,
  }
}
