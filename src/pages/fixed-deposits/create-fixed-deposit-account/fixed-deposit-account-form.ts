/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'

import type clientsEn from '@/locales/en-US/clients.json'

/** Translation keys for the form's field labels */
export type FieldLabelKey =
  keyof (typeof clientsEn)['fixedDepositApplication']['fields']

/** A Fineract enum option such as { id: 2, code: '...', value: 'Months' } */
export type EnumOption = { id: number; code?: string; value?: string }

export type Currency = {
  code: string
  decimalPlaces?: number
  displaySymbol?: string
}

export type ChargeOption = {
  id: number
  name?: string
  amount?: number
  currency?: Currency
  chargeTimeType?: EnumOption
  chargeCalculationType?: EnumOption
  feeInterval?: number
}

export type ChartSlab = {
  description?: string
  periodType?: EnumOption
  fromPeriod?: number
  toPeriod?: number
  amountRangeFrom?: number
  amountRangeTo?: number
  annualInterestRate?: number
  incentives?: {
    entityType?: EnumOption
    attributeName?: EnumOption
    conditionType?: EnumOption
    attributeValue?: string
    incentiveType?: EnumOption
    amount?: number
  }[]
}

export type AccountChart = {
  id?: number
  name?: string
  description?: string
  fromDate?: number[]
  endDate?: number[]
  isPrimaryGroupingByAmount?: boolean
  chartSlabs?: ChartSlab[]
}

/**
 * GET /fixeddepositaccounts/template. Without a productId it only lists the
 * products; with one it also carries that product's defaults and options. The
 * spec types only a few of these fields, so they are described here.
 */
export type FixedDepositAccountTemplate = {
  clientId?: number
  clientName?: string
  productOptions?: { id: number; name?: string }[]
  depositProductId?: number
  currency?: Currency
  depositAmount?: number
  minDepositTerm?: number
  minDepositTermType?: EnumOption
  maxDepositTerm?: number
  maxDepositTermType?: EnumOption
  inMultiplesOfDepositTerm?: number
  inMultiplesOfDepositTermType?: EnumOption
  interestCompoundingPeriodType?: EnumOption
  interestPostingPeriodType?: EnumOption
  interestCalculationType?: EnumOption
  interestCalculationDaysInYearType?: EnumOption
  lockinPeriodFrequency?: number
  lockinPeriodFrequencyType?: EnumOption
  preClosurePenalApplicable?: boolean
  preClosurePenalInterest?: number
  preClosurePenalInterestOnType?: EnumOption
  withHoldTax?: boolean
  taxGroup?: { id: number; name?: string }
  maturityInstructionId?: number
  accountChart?: AccountChart
  fieldOfficerOptions?: { id: number; displayName?: string }[]
  savingsAccounts?: {
    id: number
    accountNo?: string
    savingsProductName?: string
  }[]
  chargeOptions?: ChargeOption[]
  interestCompoundingPeriodTypeOptions?: EnumOption[]
  interestPostingPeriodTypeOptions?: EnumOption[]
  interestCalculationTypeOptions?: EnumOption[]
  interestCalculationDaysInYearTypeOptions?: EnumOption[]
  periodFrequencyTypeOptions?: EnumOption[]
  lockinPeriodFrequencyTypeOptions?: EnumOption[]
  preClosurePenalInterestOnTypeOptions?: EnumOption[]
  maturityInstructionOptions?: EnumOption[]
}

/** A charge added to the application, with the values the user can change */
export type AccountCharge = {
  chargeId: number
  name?: string
  calculationType?: string
  timeType?: EnumOption
  amount?: number
  /** yyyy-MM-dd */
  dueDate?: string
  feeInterval?: number
}

export type FixedDepositAccountForm = {
  productId?: number
  /** yyyy-MM-dd */
  submittedOnDate: string
  fieldOfficerId?: number
  externalId: string
  depositAmount?: number
  depositPeriod?: number
  depositPeriodFrequencyId?: number
  interestCompoundingPeriodType?: number
  interestPostingPeriodType?: number
  interestCalculationType?: number
  interestCalculationDaysInYearType?: number
  lockinPeriodFrequency?: number
  lockinPeriodFrequencyType?: number
  transferInterestToSavings: boolean
  linkAccountId?: number
  maturityInstructionId?: number
  transferToSavingsId?: number
  withHoldTax: boolean
  charges: AccountCharge[]
}

export type FixedDepositAccountStepProps = {
  formData: FixedDepositAccountForm
  onChange: (form: FixedDepositAccountForm) => void
  /** The template for the selected product */
  productTemplate?: FixedDepositAccountTemplate
}

// Fineract's depositAccountClosureType.transferToSavings, the only maturity
// instruction that needs a savings account to move the money to
export const MATURITY_TRANSFER_TO_SAVINGS = 200

// Fineract's period frequency types used by deposit terms
const PERIOD_DAYS = 0
const PERIOD_WEEKS = 1
const PERIOD_MONTHS = 2
const PERIOD_YEARS = 3

/**
 * The date a deposit term ends when it starts on the given yyyy-MM-dd date.
 * Fineract compares deposit terms in different units this way, so a term in
 * weeks can be checked against a product limit in months.
 */
export const depositTermEndDate = (
  start: string,
  term: number,
  periodTypeId: number
): Date | undefined => {
  const date = new Date(`${start}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  switch (periodTypeId) {
    case PERIOD_DAYS:
      return addDays(date, term)
    case PERIOD_WEEKS:
      return addWeeks(date, term)
    case PERIOD_MONTHS:
      return addMonths(date, term)
    case PERIOD_YEARS:
      return addYears(date, term)
    default:
      return undefined
  }
}

const CHARGE_TIME_SPECIFIED_DUE_DATE = 'chargeTimeType.specifiedDueDate'
const CHARGE_TIME_ANNUAL_FEE = 'chargeTimeType.annualFee'
const CHARGE_TIME_MONTHLY_FEE = 'chargeTimeType.monthlyFee'
const CHARGE_TIME_WEEKLY_FEE = 'chargeTimeType.weeklyFee'

/** Charges that are collected on a date the user picks */
export const chargeNeedsDate = (charge: AccountCharge) =>
  [
    CHARGE_TIME_SPECIFIED_DUE_DATE,
    CHARGE_TIME_ANNUAL_FEE,
    CHARGE_TIME_WEEKLY_FEE,
  ].includes(charge.timeType?.code ?? '')

/** Charges that repeat every few months */
export const chargeNeedsInterval = (charge: AccountCharge) =>
  charge.timeType?.code === CHARGE_TIME_MONTHLY_FEE

export const createInitialForm = (
  submittedOnDate: string
): FixedDepositAccountForm => ({
  submittedOnDate,
  externalId: '',
  transferInterestToSavings: false,
  withHoldTax: false,
  charges: [],
})

/**
 * Fills the terms and settings with the selected product's defaults, like the
 * Angular web app does when a product is picked. The details the user already
 * entered are kept.
 */
export const applyProductTemplate = (
  form: FixedDepositAccountForm,
  template: FixedDepositAccountTemplate
): FixedDepositAccountForm => ({
  ...form,
  productId: template.depositProductId ?? form.productId,
  fieldOfficerId: undefined,
  depositAmount: template.depositAmount,
  depositPeriod: template.minDepositTerm,
  depositPeriodFrequencyId: template.minDepositTermType?.id,
  interestCompoundingPeriodType: template.interestCompoundingPeriodType?.id,
  interestPostingPeriodType: template.interestPostingPeriodType?.id,
  interestCalculationType: template.interestCalculationType?.id,
  interestCalculationDaysInYearType:
    template.interestCalculationDaysInYearType?.id,
  lockinPeriodFrequency: template.lockinPeriodFrequency,
  lockinPeriodFrequencyType: template.lockinPeriodFrequencyType?.id,
  maturityInstructionId: template.maturityInstructionId,
  transferInterestToSavings: false,
  linkAccountId: undefined,
  transferToSavingsId: undefined,
  withHoldTax: template.withHoldTax ?? false,
  charges: [],
})

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

/** yyyy-MM-dd to the dd MMMM a charge's annual fee date is sent in */
const toMonthDay = (isoDate: string) => {
  const [, month, day] = isoDate.split('-').map(Number)
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(2000, month - 1, 1)
  )
  return `${String(day).padStart(2, '0')} ${monthName}`
}

/**
 * The POST /fixeddepositaccounts body. The product's deposit term limits and
 * pre-closure penalty are not sent: the account takes them from the product.
 */
export const buildFixedDepositAccountRequest = (
  form: FixedDepositAccountForm,
  clientId: number,
  template?: FixedDepositAccountTemplate
) => ({
  ...withoutBlanks({
    clientId,
    productId: form.productId,
    submittedOnDate: form.submittedOnDate,
    fieldOfficerId: form.fieldOfficerId,
    externalId: form.externalId.trim(),
    depositAmount: form.depositAmount,
    depositPeriod: form.depositPeriod,
    depositPeriodFrequencyId: form.depositPeriodFrequencyId,
    interestCompoundingPeriodType: form.interestCompoundingPeriodType,
    interestPostingPeriodType: form.interestPostingPeriodType,
    interestCalculationType: form.interestCalculationType,
    interestCalculationDaysInYearType: form.interestCalculationDaysInYearType,
    lockinPeriodFrequency: form.lockinPeriodFrequency,
    lockinPeriodFrequencyType: form.lockinPeriodFrequencyType,
    maturityInstructionId: form.maturityInstructionId,
    transferToSavingsId:
      form.maturityInstructionId === MATURITY_TRANSFER_TO_SAVINGS
        ? form.transferToSavingsId
        : undefined,
    linkAccountId: form.transferInterestToSavings
      ? form.linkAccountId
      : undefined,
    chartId: template?.accountChart?.id,
  }),
  transferInterestToSavings: form.transferInterestToSavings,
  ...(template?.withHoldTax ? { withHoldTax: form.withHoldTax } : {}),
  charges: form.charges.map(charge =>
    withoutBlanks({
      chargeId: charge.chargeId,
      amount: charge.amount,
      ...(charge.dueDate && charge.timeType?.code === CHARGE_TIME_ANNUAL_FEE
        ? { feeOnMonthDay: toMonthDay(charge.dueDate) }
        : { dueDate: charge.dueDate }),
      feeInterval: charge.feeInterval,
    })
  ),
  dateFormat: 'yyyy-MM-dd',
  monthDayFormat: 'dd MMMM',
  locale: 'en',
})

/**
 * A yyyy-MM-dd input value as [year, month, day], so formatDate reads it as a
 * local date and not as midnight UTC, which is the day before west of UTC
 */
export const inputDateParts = (isoDate?: string) =>
  isoDate ? isoDate.split('-').map(Number) : undefined
