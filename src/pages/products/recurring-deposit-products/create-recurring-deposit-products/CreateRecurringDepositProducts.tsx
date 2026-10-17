/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import {
  RecurringDepositProductApi,
  type PostRecurringDepositProductsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import RecurringDepositProductDetailsStep from './create-recurring-deposit-products-stepper/RecurringDepositProductDetailsStep'
import RecurringDepositProductCurrencyStep from './create-recurring-deposit-products-stepper/RecurringDepositProductCurrencyStep'
import RecurringDepositProductTermsStep from './create-recurring-deposit-products-stepper/RecurringDepositProductTermsStep'
import RecurringDepositProductSettingsStep from './create-recurring-deposit-products-stepper/RecurringDepositProductSettingsStep'
import RecurringDepositProductInterestRateChartStep from './create-recurring-deposit-products-stepper/RecurringDepositProductInterestRateChartStep'
import RecurringDepositProductChargesStep from './create-recurring-deposit-products-stepper/RecurringDepositProductChargesStep'
import RecurringDepositProductAccountingStep from './create-recurring-deposit-products-stepper/RecurringDepositProductAccountingStep'
import {
  buildRecurringDepositProductPayload,
  getRequiredGlMappings,
  initialRecurringDepositProductForm,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from './recurring-deposit-product-form'

const rdApi = new RecurringDepositProductApi(getConfiguration())

const LIST_PATH = '/products/recurring-deposit-products'

type FineractError = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const getApiErrorMessage = (err: unknown) => {
  const data = (err as AxiosError<FineractError>).response?.data
  const messages = (data?.errors ?? [])
    .map(error => error.defaultUserMessage)
    .filter(Boolean)
  return messages.length > 0 ? messages.join(' ') : data?.defaultUserMessage
}

const isBlank = (value?: string) => !value || value.trim() === ''

const CreateRecurringDepositProducts = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('products')

  const [template, setTemplate] = useState<RecurringDepositProductTemplate>()
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [form, setForm] = useState<RecurringDepositProductForm>(
    initialRecurringDepositProductForm
  )

  const update = (patch: Partial<RecurringDepositProductForm>) =>
    setForm(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await rdApi.retrieveTemplate17()
        const data = res.data as unknown as RecurringDepositProductTemplate
        setTemplate(data)
        // Start from the same defaults Fineract suggests in the template
        setForm(prev => ({
          ...prev,
          currencyCode: prev.currencyCode ?? data.currency?.code,
          digitsAfterDecimal:
            prev.digitsAfterDecimal ?? data.currency?.decimalPlaces,
          interestCompoundingPeriodType:
            prev.interestCompoundingPeriodType ??
            data.interestCompoundingPeriodType?.id,
          interestPostingPeriodType:
            prev.interestPostingPeriodType ??
            data.interestPostingPeriodType?.id,
          interestCalculationType:
            prev.interestCalculationType ?? data.interestCalculationType?.id,
          interestCalculationDaysInYearType:
            prev.interestCalculationDaysInYearType ??
            data.interestCalculationDaysInYearType?.id,
        }))
      } catch (err) {
        console.error('Failed to fetch recurring deposit product template', err)
        setTemplateError(t('createRecurringDepositProduct.templateFailed'))
      }
    }
    fetchTemplate()
  }, [t])

  const validateDetails = () => {
    if (isBlank(form.name))
      return t('createRecurringDepositProduct.validation.nameRequired')
    if (isBlank(form.shortName))
      return t('createRecurringDepositProduct.validation.shortNameRequired')
    if (isBlank(form.description))
      return t('createRecurringDepositProduct.validation.descriptionRequired')
    return null
  }

  const validateCurrency = () => {
    if (!form.currencyCode)
      return t('createRecurringDepositProduct.validation.currencyRequired')
    if (form.digitsAfterDecimal === undefined || form.digitsAfterDecimal < 0)
      return t('createRecurringDepositProduct.validation.decimalPlacesRequired')
    if (form.inMultiplesOf === undefined || form.inMultiplesOf <= 0)
      return t('createRecurringDepositProduct.validation.inMultiplesOfRequired')
    return null
  }

  const validateTerms = () => {
    const { minDepositAmount, depositAmount, maxDepositAmount } = form
    if (depositAmount === undefined || depositAmount <= 0)
      return t('createRecurringDepositProduct.validation.depositAmountRequired')
    if (
      (minDepositAmount !== undefined && minDepositAmount > depositAmount) ||
      (maxDepositAmount !== undefined && maxDepositAmount < depositAmount)
    )
      return t('createRecurringDepositProduct.validation.depositAmountRange')
    if (
      form.interestCompoundingPeriodType === undefined ||
      form.interestPostingPeriodType === undefined ||
      form.interestCalculationType === undefined ||
      form.interestCalculationDaysInYearType === undefined
    )
      return t('createRecurringDepositProduct.validation.interestRequired')
    return null
  }

  const validateSettings = () => {
    if (form.minDepositTerm === undefined || form.minDepositTerm <= 0)
      return t(
        'createRecurringDepositProduct.validation.minDepositTermRequired'
      )
    const periodPairs = [
      [form.lockinPeriodFrequency, form.lockinPeriodFrequencyType],
      [form.minDepositTerm, form.minDepositTermTypeId],
      [form.inMultiplesOfDepositTerm, form.inMultiplesOfDepositTermTypeId],
      [form.maxDepositTerm, form.maxDepositTermTypeId],
    ]
    if (
      periodPairs.some(
        ([value, type]) => (value === undefined) !== (type === undefined)
      )
    )
      return t('createRecurringDepositProduct.validation.periodIncomplete')
    if (
      form.preClosurePenalApplicable &&
      (form.preClosurePenalInterest === undefined ||
        form.preClosurePenalInterestOnTypeId === undefined)
    )
      return t('createRecurringDepositProduct.validation.penalRequired')
    if (form.withHoldTax && form.taxGroupId === undefined)
      return t('createRecurringDepositProduct.validation.taxGroupRequired')
    return null
  }

  const validateChart = () => {
    const { chart } = form
    if (!chart.fromDate)
      return t('createRecurringDepositProduct.validation.fromDateRequired')
    if (chart.endDate && chart.endDate < chart.fromDate)
      return t('createRecurringDepositProduct.validation.endDateBeforeFromDate')
    if (chart.chartSlabs.length === 0)
      return t('createRecurringDepositProduct.validation.slabRequired')
    for (const slab of chart.chartSlabs) {
      if (
        slab.periodType === undefined ||
        slab.fromPeriod === undefined ||
        slab.annualInterestRate === undefined
      )
        return t('createRecurringDepositProduct.validation.slabFieldsRequired')
      if (slab.toPeriod !== undefined && slab.toPeriod < slab.fromPeriod)
        return t('createRecurringDepositProduct.validation.slabPeriodRange')
      if (
        slab.amountRangeFrom !== undefined &&
        slab.amountRangeTo !== undefined &&
        slab.amountRangeTo < slab.amountRangeFrom
      )
        return t('createRecurringDepositProduct.validation.slabAmountRange')
    }
    return null
  }

  const validateAccounting = () => {
    const missing = getRequiredGlMappings(form.accountingRule).some(
      ({ key }) => form.glMappings[key] === undefined
    )
    return missing
      ? t('createRecurringDepositProduct.validation.glMappingsRequired')
      : null
  }

  const steps = [
    {
      title: t('createRecurringDepositProduct.steps.details'),
      validate: validateDetails,
      component: (
        <RecurringDepositProductDetailsStep form={form} update={update} />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.currency'),
      validate: validateCurrency,
      component: (
        <RecurringDepositProductCurrencyStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.terms'),
      validate: validateTerms,
      component: (
        <RecurringDepositProductTermsStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.settings'),
      validate: validateSettings,
      component: (
        <RecurringDepositProductSettingsStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.interestRateChart'),
      validate: validateChart,
      component: (
        <RecurringDepositProductInterestRateChartStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.charges'),
      component: (
        <RecurringDepositProductChargesStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createRecurringDepositProduct.steps.accounting'),
      validate: validateAccounting,
      component: (
        <RecurringDepositProductAccountingStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
  ]

  const handleSubmit = async () => {
    // Completed steps can be reopened and edited without passing their
    // validation again, so every step is checked once more before saving
    for (const step of steps) {
      const error = step.validate?.()
      if (error) throw new Error(`${step.title}: ${error}`)
    }

    // The generated request type has no lock-in, mandatory deposit, tax or
    // GL mapping fields, and types charts as a Set, which axios would send
    // as an empty object
    const payload = buildRecurringDepositProductPayload(
      form
    ) as unknown as PostRecurringDepositProductsRequest

    let productId: number | undefined
    try {
      const res = await rdApi.create12(payload)
      productId = res.data.resourceId
    } catch (err) {
      console.error('Failed to create recurring deposit product', err)
      throw new Error(
        getApiErrorMessage(err) ??
          t('createRecurringDepositProduct.createFailed')
      )
    }

    alert(t('createRecurringDepositProduct.created'))
    navigate(productId ? `${LIST_PATH}/${productId}/general` : LIST_PATH)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: 'Home', href: '/home' },
            { label: t('title'), href: '/products' },
            { label: t('recurringDepositProducts'), href: LIST_PATH },
            {
              label: t('createRecurringDepositProduct.breadcrumb'),
              current: true,
            },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">
          {t('createRecurringDepositProduct.heading')}
        </h1>

        {templateError && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {templateError}
          </div>
        )}

        <MultiStepForm
          prefix={t('createRecurringDepositProduct.prefix')}
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate(LIST_PATH)}
          submitLabel={t('createRecurringDepositProduct.submit')}
        />
      </div>
    </div>
  )
}

export default CreateRecurringDepositProducts
