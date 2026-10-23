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
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import {
  FixedDepositProductApi,
  type PostFixedDepositProductsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import FixedDepositProductDetailsStep from './create-fixed-deposit-product-stepper/FixedDepositProductDetailsStep'
import FixedDepositProductCurrencyStep from './create-fixed-deposit-product-stepper/FixedDepositProductCurrencyStep'
import FixedDepositProductTermsStep from './create-fixed-deposit-product-stepper/FixedDepositProductTermsStep'
import FixedDepositProductSettingsStep from './create-fixed-deposit-product-stepper/FixedDepositProductSettingsStep'
import FixedDepositProductInterestRateChartStep from './create-fixed-deposit-product-stepper/FixedDepositProductInterestRateChartStep'
import FixedDepositProductChargesStep from './create-fixed-deposit-product-stepper/FixedDepositProductChargesStep'
import FixedDepositProductAccountingStep from './create-fixed-deposit-product-stepper/FixedDepositProductAccountingStep'
import {
  ACCOUNT_MAPPING_FIELDS,
  ACCOUNTING_RULE_ACCRUAL_PERIODIC,
  ACCOUNTING_RULE_NONE,
  ACCRUAL_ONLY_FIELDS,
  applyTemplateDefaults,
  buildFixedDepositProductRequest,
  createInitialForm,
  type FieldLabelKey,
  type FixedDepositProductForm,
  type FixedDepositProductTemplate,
} from './fixed-deposit-product-form'

const fdApi = new FixedDepositProductApi(getConfiguration())

const LIST_PATH = '/products/fixed-deposit-products'

type FineractErrorResponse = {
  defaultUserMessage?: string
  errors?: { defaultUserMessage?: string }[]
}

const isMissing = (value: unknown) =>
  value === undefined || value === null || value === ''

const CreateFixedDepositProduct = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const [template, setTemplate] = useState<FixedDepositProductTemplate>()
  const [templateError, setTemplateError] = useState(false)
  const [formData, setFormData] =
    useState<FixedDepositProductForm>(createInitialForm)

  useEffect(() => {
    let stale = false
    const fetchTemplate = async () => {
      try {
        const response = await fdApi.retrieveTemplate15()
        if (stale) return
        // The spec types this response as a string, but it is the template JSON
        const data = response.data as unknown as FixedDepositProductTemplate
        setTemplate(data)
        setFormData(form => applyTemplateDefaults(form, data))
      } catch (err) {
        console.error('Failed to fetch Fixed Deposit Product template', err)
        if (!stale) setTemplateError(true)
      }
    }
    fetchTemplate()
    return () => {
      stale = true
    }
  }, [])

  const field = (name: FieldLabelKey) =>
    t(`createFixedDepositProduct.fields.${name}`)
  const required = (name: FieldLabelKey) =>
    t('createFixedDepositProduct.validation.required', { field: field(name) })

  /** Returns the first required field, keyed by its label, that is empty */
  const firstMissing = (fields: [unknown, FieldLabelKey][]) => {
    const missing = fields.find(([value]) => isMissing(value))
    return missing ? required(missing[1]) : null
  }

  const validateDetails = () =>
    firstMissing([
      [formData.name.trim(), 'productName'],
      [formData.shortName.trim(), 'shortName'],
      [formData.description.trim(), 'description'],
    ])

  const validateCurrency = () => {
    const missing = firstMissing([
      [formData.currencyCode, 'currency'],
      [formData.digitsAfterDecimal, 'decimalPlaces'],
    ])
    if (missing) return missing
    if (formData.inMultiplesOf !== undefined && formData.inMultiplesOf < 1) {
      return t('createFixedDepositProduct.validation.atLeastOne', {
        field: field('inMultiplesOf'),
      })
    }
    return null
  }

  const validateTerms = () => {
    const missing = firstMissing([
      [formData.depositAmount, 'depositAmount'],
      [formData.interestCompoundingPeriodType, 'interestCompoundingPeriod'],
      [formData.interestPostingPeriodType, 'interestPostingPeriod'],
      [formData.interestCalculationType, 'interestCalculatedUsing'],
      [formData.interestCalculationDaysInYearType, 'daysInYear'],
    ])
    if (missing) return missing
    const { minDepositAmount, depositAmount = 0, maxDepositAmount } = formData
    if (minDepositAmount !== undefined && minDepositAmount > depositAmount) {
      return t('createFixedDepositProduct.validation.minAboveDefault')
    }
    if (maxDepositAmount !== undefined && depositAmount > maxDepositAmount) {
      return t('createFixedDepositProduct.validation.defaultAboveMax')
    }
    return null
  }

  const validateSettings = () => {
    const missing = firstMissing([
      [formData.minDepositTerm, 'minDepositTerm'],
      [formData.minDepositTermTypeId, 'minDepositTermType'],
      ...(formData.preClosurePenalApplicable
        ? ([
            [formData.preClosurePenalInterest, 'penalInterest'],
            [formData.preClosurePenalInterestOnTypeId, 'penalInterestOn'],
          ] as [unknown, FieldLabelKey][])
        : []),
      ...(formData.withHoldTax
        ? ([[formData.taxGroupId, 'taxGroup']] as [unknown, FieldLabelKey][])
        : []),
    ])
    if (missing) return missing
    const { minDepositTerm, maxDepositTerm } = formData
    if (
      maxDepositTerm !== undefined &&
      minDepositTerm !== undefined &&
      formData.minDepositTermTypeId === formData.maxDepositTermTypeId &&
      minDepositTerm > maxDepositTerm
    ) {
      return t('createFixedDepositProduct.validation.minTermAboveMax')
    }
    return null
  }

  const validateChart = () => {
    const { chart } = formData
    if (!chart.fromDate) return required('fromDate')
    if (chart.endDate && chart.endDate < chart.fromDate) {
      return t('createFixedDepositProduct.validation.endBeforeFrom')
    }
    if (chart.chartSlabs.length === 0) {
      return t('createFixedDepositProduct.validation.slabRequired')
    }
    // Slabs added before amount grouping was turned on have no amount range
    if (
      chart.isPrimaryGroupingByAmount &&
      chart.chartSlabs.some(slab => isMissing(slab.amountRangeFrom))
    ) {
      return required('amountRangeFrom')
    }
    return null
  }

  const validateAccounting = () => {
    if (formData.accountingRule === ACCOUNTING_RULE_NONE) return null
    const isAccrual =
      formData.accountingRule === ACCOUNTING_RULE_ACCRUAL_PERIODIC
    const missing = Object.values(ACCOUNT_MAPPING_FIELDS)
      .flat()
      .filter(name => isAccrual || !ACCRUAL_ONLY_FIELDS.includes(name))
      .find(name => isMissing(formData.accounts[name]))
    return missing
      ? t('createFixedDepositProduct.validation.required', {
          field: t(`createFixedDepositProduct.accounts.${missing}`),
        })
      : null
  }

  const handleSubmit = async () => {
    // The stepper validates only the open step, and a user can reach
    // Accounting after clearing a field on an earlier step, so every step is
    // checked again before the request is sent
    for (const step of steps) {
      const error = step.validate?.()
      if (error) {
        throw new Error(
          t('createFixedDepositProduct.validation.stepInvalid', {
            step: step.title,
            error,
          })
        )
      }
    }
    try {
      // The spec models charts as a Set and leaves out fields such as
      // depositAmount, so the request is built to match the live API instead
      const request = buildFixedDepositProductRequest(
        formData
      ) as unknown as PostFixedDepositProductsRequest
      const response = await fdApi.create11(request)
      const productId = response.data?.resourceId
      const state: RouteSuccessState = {
        successMessage: t('createFixedDepositProduct.success'),
      }
      navigate(productId ? `${LIST_PATH}/${productId}/general` : LIST_PATH, {
        state,
      })
    } catch (error) {
      // Thrown back to the stepper, which shows it above the buttons
      const data = (error as AxiosError<FineractErrorResponse>).response?.data
      const messages = (data?.errors ?? [])
        .map(err => err.defaultUserMessage)
        .filter(Boolean)
      throw new Error(
        messages.length > 0
          ? messages.join(' ')
          : data?.defaultUserMessage ||
              t('createFixedDepositProduct.errors.createFailed')
      )
    }
  }

  const stepProps = { formData, onChange: setFormData, template }
  const steps = [
    {
      title: t('createFixedDepositProduct.steps.details'),
      component: <FixedDepositProductDetailsStep {...stepProps} />,
      validate: validateDetails,
    },
    {
      title: t('createFixedDepositProduct.steps.currency'),
      component: <FixedDepositProductCurrencyStep {...stepProps} />,
      validate: validateCurrency,
    },
    {
      title: t('createFixedDepositProduct.steps.terms'),
      component: <FixedDepositProductTermsStep {...stepProps} />,
      validate: validateTerms,
    },
    {
      title: t('createFixedDepositProduct.steps.settings'),
      component: <FixedDepositProductSettingsStep {...stepProps} />,
      validate: validateSettings,
    },
    {
      title: t('createFixedDepositProduct.steps.interestRateChart'),
      component: <FixedDepositProductInterestRateChartStep {...stepProps} />,
      validate: validateChart,
    },
    {
      title: t('createFixedDepositProduct.steps.charges'),
      component: <FixedDepositProductChargesStep {...stepProps} />,
    },
    {
      title: t('createFixedDepositProduct.steps.accounting'),
      component: <FixedDepositProductAccountingStep {...stepProps} />,
      validate: validateAccounting,
    },
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: tc('nav.home'), href: '/home' },
            { label: t('title'), href: '/products' },
            { label: t('fixedDepositProducts'), href: LIST_PATH },
            { label: tc('actions.create'), current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">
          {t('createFixedDepositProduct.title')}
        </h1>
        {templateError ? (
          <p role="alert" className="text-sm text-red-600">
            {t('createFixedDepositProduct.errors.templateFailed')}
          </p>
        ) : !template ? (
          <p className="text-sm text-muted-foreground">
            {tc('actions.loading')}
          </p>
        ) : (
          <MultiStepForm
            prefix={t('createFixedDepositProduct.stepPrefix')}
            steps={steps}
            onSubmit={handleSubmit}
            onCancel={() => navigate(LIST_PATH)}
            submitLabel={tc('actions.submit')}
          />
        )}
      </div>
    </div>
  )
}

export default CreateFixedDepositProduct
