/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen,
  faDollarSign,
  faCalendarAlt,
  faSlidersH,
  faTag,
  faBook,
} from '@fortawesome/free-solid-svg-icons'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppStepper from '@/components/custom/stepper/AppStepper'
import SavingsProductDetailsStep from './create-saving-products-stepper/SavingsProductDetailsStep'
import SavingsProductCurrencyStep from './create-saving-products-stepper/SavingsProductCurrencyStep'
import SavingsProductTermsStep from './create-saving-products-stepper/SavingsProductTermsStep'
import SavingsProductSettingsStep from './create-saving-products-stepper/SavingsProductSettingsStep'
import SavingsProductChargesStep from './create-saving-products-stepper/SavingsProductChargesStep'
import SavingsProductAccountingStep from './create-saving-products-stepper/SavingsProductAccountingStep'
import {
  SavingsProductApi,
  type GetSavingsProductsTemplateResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const savingProductApi = new SavingsProductApi(getConfiguration())

const CreateSavingsProducts = () => {
  const [savingProductTemplate, setSavingProductTemplate] =
    useState<GetSavingsProductsTemplateResponse>()

  useEffect(() => {
    const fetchSavingProductTemplateDetails = async () => {
      try {
        const response = await savingProductApi.retrieveTemplate20()
        setSavingProductTemplate(response.data)
      } catch (err) {
        console.error('Failed to fetch Saving Product Response', err)
      }
    }
    fetchSavingProductTemplateDetails()
  }, [])

  const mapDropdownOptions = <T,>(
    set: Set<T> | undefined,
    mapper: (item: T) => { id: string; name: string }
  ): { id: string; name: string }[] => {
    return Array.from(set ?? []).map(mapper)
  }

  const currencyOptions = Array.from(
    savingProductTemplate?.currencyOptions ?? []
  ).map(c => ({
    id: c.code!,
    name: c.name!,
    decimalPlaces: c.decimalPlaces!,
  }))

  const compoundingPeriodOptions = mapDropdownOptions(
    savingProductTemplate?.interestCompoundingPeriodTypeOptions,
    o => ({ id: o.id!.toString(), name: o.value! })
  )

  const postingPeriodOptions = mapDropdownOptions(
    savingProductTemplate?.interestPostingPeriodTypeOptions,
    o => ({ id: o.id!.toString(), name: o.value! })
  )

  const interestCalculationOptions = mapDropdownOptions(
    savingProductTemplate?.interestCalculationTypeOptions,
    o => ({ id: o.id!.toString(), name: o.value! })
  )

  const daysInYearOptions = mapDropdownOptions(
    savingProductTemplate?.interestCalculationDaysInYearTypeOptions,
    o => ({ id: o.id!.toString(), name: o.value! })
  )

  const chargeOptions = Array.from(
    savingProductTemplate?.chargeOptions ?? []
  ).map(o => ({
    id: o.id!.toString(),
    name: o.name!,
    chargeTimeType: o.chargeTimeType?.description ?? '',
    amount: o.amount!,
    chargeCalculationType: o.chargeCalculationType?.description ?? '',
  }))

  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: '',
    shortName: '',
    description: '',
    currency: {
      code: 'USD',
      name: 'US Dollar',
      decimalPlaces: 2,
    },
    decimalPlaces: 2,
    currencyMultiples: '',

    nominalAnnualInterestRate: 0,
    interestCompoundingPeriod: '',
    interestPostingPeriod: '',
    interestCalculationType: '',
    interestCalculationDaysInYearType: '',

    // Settings
    minOpeningBalance: 0,
    balanceRequiredForInterestCalculation: 0,
    lockinPeriodFrequency: 0,
    minBalance: 0,
    withdrawalFeeForTransfers: false,
    enforceMinRequiredBalance: false,
    withHoldTax: false,
    allowOverdraft: false,
    trackDormancy: false,

    // Charges
    charges: [],

    // Accounting
    accountingRule: '',
  })

  // Each step component defines its own narrower FormData interface, but they all
  // share a single flat state object. We cast through unknown to bridge the types.
  const formDataBridge: unknown = formData
  const setFormDataBridge: unknown = setFormData

  const pages = [
    {
      icon: <FontAwesomeIcon icon={faPen} className="text-base" />,
      label: 'DETAILS',
      component: (
        <SavingsProductDetailsStep
          formData={
            formDataBridge as {
              name: string
              shortName: string
              description: string
              [key: string]: unknown
            }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                name: string
                shortName: string
                description: string
                [key: string]: unknown
              }) => {
                name: string
                shortName: string
                description: string
                [key: string]: unknown
              }
            ) => void
          }
        />
      ),
    },
    {
      icon: <FontAwesomeIcon icon={faDollarSign} className="text-base" />,
      label: 'CURRENCY',
      component: (
        <SavingsProductCurrencyStep
          formData={
            formDataBridge as {
              currency: {
                id: string
                name: string
                decimalPlaces: number
              } | null
              decimalPlaces: number
              currencyMultiples: string
              [key: string]: unknown
            }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                currency: {
                  id: string
                  name: string
                  decimalPlaces: number
                } | null
                decimalPlaces: number
                currencyMultiples: string
                [key: string]: unknown
              }) => {
                currency: {
                  id: string
                  name: string
                  decimalPlaces: number
                } | null
                decimalPlaces: number
                currencyMultiples: string
                [key: string]: unknown
              }
            ) => void
          }
          currencyOptions={currencyOptions}
        />
      ),
    },
    {
      icon: <FontAwesomeIcon icon={faCalendarAlt} className="text-base" />,
      label: 'TERMS',
      component: (
        <SavingsProductTermsStep
          formData={
            formDataBridge as {
              nominalAnnualInterestRate: number
              interestCompoundingPeriod: string
              interestPostingPeriod: string
              interestCalculationType: string
              interestCalculationDaysInYearType: string
              [key: string]: unknown
            }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                nominalAnnualInterestRate: number
                interestCompoundingPeriod: string
                interestPostingPeriod: string
                interestCalculationType: string
                interestCalculationDaysInYearType: string
                [key: string]: unknown
              }) => {
                nominalAnnualInterestRate: number
                interestCompoundingPeriod: string
                interestPostingPeriod: string
                interestCalculationType: string
                interestCalculationDaysInYearType: string
                [key: string]: unknown
              }
            ) => void
          }
          compoundingPeriodOptions={compoundingPeriodOptions}
          postingPeriodOptions={postingPeriodOptions}
          interestCalculationOptions={interestCalculationOptions}
          daysInYearOptions={daysInYearOptions}
        />
      ),
    },
    {
      icon: <FontAwesomeIcon icon={faSlidersH} className="text-base" />,
      label: 'SETTINGS',
      component: (
        <SavingsProductSettingsStep
          formData={
            formDataBridge as {
              minOpeningBalance: number
              balanceRequiredForInterestCalculation: number
              lockinPeriodFrequency: number
              minBalance: number
              withdrawalFeeForTransfers: boolean
              enforceMinRequiredBalance: boolean
              withHoldTax: boolean
              allowOverdraft: boolean
              trackDormancy: boolean
              [key: string]: unknown
            }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                minOpeningBalance: number
                balanceRequiredForInterestCalculation: number
                lockinPeriodFrequency: number
                minBalance: number
                withdrawalFeeForTransfers: boolean
                enforceMinRequiredBalance: boolean
                withHoldTax: boolean
                allowOverdraft: boolean
                trackDormancy: boolean
                [key: string]: unknown
              }) => {
                minOpeningBalance: number
                balanceRequiredForInterestCalculation: number
                lockinPeriodFrequency: number
                minBalance: number
                withdrawalFeeForTransfers: boolean
                enforceMinRequiredBalance: boolean
                withHoldTax: boolean
                allowOverdraft: boolean
                trackDormancy: boolean
                [key: string]: unknown
              }
            ) => void
          }
        />
      ),
    },
    {
      icon: <FontAwesomeIcon icon={faTag} className="text-base" />,
      label: 'CHARGES',
      component: (
        <SavingsProductChargesStep
          formData={
            formDataBridge as {
              charges: {
                id: string
                name: string
                chargeTimeType: string
                amount: number
                chargeCalculationType: string
              }[]
              [key: string]: unknown
            }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                charges: {
                  id: string
                  name: string
                  chargeTimeType: string
                  amount: number
                  chargeCalculationType: string
                }[]
                [key: string]: unknown
              }) => {
                charges: {
                  id: string
                  name: string
                  chargeTimeType: string
                  amount: number
                  chargeCalculationType: string
                }[]
                [key: string]: unknown
              }
            ) => void
          }
          chargeOptions={chargeOptions}
        />
      ),
    },
    {
      icon: <FontAwesomeIcon icon={faBook} className="text-base" />,
      label: 'ACCOUNTING',
      component: (
        <SavingsProductAccountingStep
          formData={
            formDataBridge as { accountingRule: string; [key: string]: unknown }
          }
          setFormData={
            setFormDataBridge as (
              updater: (prev: {
                accountingRule: string
                [key: string]: unknown
              }) => { accountingRule: string; [key: string]: unknown }
            ) => void
          }
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: 'Home', href: '/home' },
            { label: 'Products', href: '/products' },
            { label: 'Saving Products', href: '/products/saving-products' },
            { label: 'Create', current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Savings Product</h1>
        <AppStepper steps={pages} />
      </div>
    </div>
  )
}

export default CreateSavingsProducts
