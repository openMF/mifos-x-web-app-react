/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// The generated client does not describe the body of
// GET /products/share/template, so the parts this form reads are typed here.
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
  currency?: CurrencyOption
  chargeTimeType?: EnumOption
  chargeCalculationType?: EnumOption
}

export interface ShareProductTemplate {
  currencyOptions?: CurrencyOption[]
  chargeOptions?: ChargeOption[]
  minimumActivePeriodFrequencyTypeOptions?: EnumOption[]
  lockinPeriodFrequencyTypeOptions?: EnumOption[]
  accountingMappingOptions?: {
    assetAccountOptions?: GlAccountOption[]
    liabilityAccountOptions?: GlAccountOption[]
    equityAccountOptions?: GlAccountOption[]
    incomeAccountOptions?: GlAccountOption[]
  }
}

// Share products only support no accounting or cash based accounting
export const ACCOUNTING_RULE = {
  none: 1,
  cash: 2,
} as const

export type GlAccountType = 'asset' | 'liability' | 'equity' | 'income'

export type GlMappingKey =
  | 'shareReferenceId'
  | 'shareSuspenseId'
  | 'shareEquityId'
  | 'incomeFromFeeAccountId'

// GL accounts Fineract asks for under cash based accounting
export const CASH_GL_MAPPINGS: { key: GlMappingKey; type: GlAccountType }[] = [
  { key: 'shareReferenceId', type: 'asset' },
  { key: 'shareSuspenseId', type: 'liability' },
  { key: 'shareEquityId', type: 'equity' },
  { key: 'incomeFromFeeAccountId', type: 'income' },
]

export const getRequiredGlMappings = (accountingRule?: number) =>
  accountingRule === ACCOUNTING_RULE.cash ? CASH_GL_MAPPINGS : []

export interface MarketPricePeriodForm {
  fromDate: string
  shareValue: number
}

export interface ShareProductForm {
  // Details
  name: string
  shortName: string
  description: string
  // Currency
  currencyCode?: string
  digitsAfterDecimal?: number
  inMultiplesOf?: number
  // Terms
  totalShares?: number
  sharesIssued?: number
  unitPrice?: number
  // Settings
  minimumShares?: number
  nominalShares?: number
  maximumShares?: number
  minimumActivePeriodForDividends?: number
  minimumactiveperiodFrequencyType?: number
  lockinPeriodFrequency?: number
  lockinPeriodFrequencyType?: number
  allowDividendCalculationForInactiveClients: boolean
  // Market price
  marketPricePeriods: MarketPricePeriodForm[]
  // Charges
  chargeIds: number[]
  // Accounting
  accountingRule: number
  glMappings: Partial<Record<GlMappingKey, number>>
}

export const initialShareProductForm: ShareProductForm = {
  name: '',
  shortName: '',
  description: '',
  allowDividendCalculationForInactiveClients: false,
  marketPricePeriods: [],
  chargeIds: [],
  accountingRule: ACCOUNTING_RULE.none,
  glMappings: {},
}

export type FormUpdater = (patch: Partial<ShareProductForm>) => void

/** Empty input means "not set" rather than zero */
export const toOptionalNumber = (value: string) =>
  value === '' ? undefined : Number(value)

export const toSelectOptions = (options?: EnumOption[]) =>
  (options ?? [])
    .filter(option => option.id !== undefined)
    .map(option => ({ id: option.id!.toString(), name: option.value ?? '' }))

/** Shares issued multiplied by the unit price, as Fineract stores it */
export const getShareCapital = (form: ShareProductForm) =>
  form.sharesIssued !== undefined && form.unitPrice !== undefined
    ? form.sharesIssued * form.unitPrice
    : undefined

/** Builds the POST /products/share body from the form state */
export const buildShareProductPayload = (form: ShareProductForm) => {
  const glMappings = Object.fromEntries(
    getRequiredGlMappings(form.accountingRule).map(({ key }) => [
      key,
      form.glMappings[key],
    ])
  )

  return {
    locale: 'en',
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    description: form.description.trim(),
    currencyCode: form.currencyCode,
    digitsAfterDecimal: form.digitsAfterDecimal,
    inMultiplesOf: form.inMultiplesOf,
    totalShares: form.totalShares,
    sharesIssued: form.sharesIssued,
    unitPrice: form.unitPrice,
    shareCapital: getShareCapital(form),
    minimumShares: form.minimumShares,
    nominalShares: form.nominalShares,
    maximumShares: form.maximumShares,
    minimumActivePeriodForDividends: form.minimumActivePeriodForDividends,
    minimumactiveperiodFrequencyType: form.minimumactiveperiodFrequencyType,
    lockinPeriodFrequency: form.lockinPeriodFrequency,
    lockinPeriodFrequencyType: form.lockinPeriodFrequencyType,
    allowDividendCalculationForInactiveClients:
      form.allowDividendCalculationForInactiveClients,
    marketPricePeriods: form.marketPricePeriods.map(period => ({
      ...period,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
    })),
    chargesSelected: form.chargeIds.map(id => ({ id })),
    accountingRule: form.accountingRule,
    ...glMappings,
  }
}
