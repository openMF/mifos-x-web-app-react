/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import {
  FixedDepositAccountApi,
  type PostFixedDepositAccountsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useBusinessDateState } from '@/lib/business-date'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import FixedDepositAccountDetailsStep from './fixed-deposit-account-stepper/FixedDepositAccountDetailsStep'
import FixedDepositAccountTermsStep from './fixed-deposit-account-stepper/FixedDepositAccountTermsStep'
import FixedDepositAccountSettingsStep from './fixed-deposit-account-stepper/FixedDepositAccountSettingsStep'
import FixedDepositAccountInterestRateChartStep from './fixed-deposit-account-stepper/FixedDepositAccountInterestRateChartStep'
import FixedDepositAccountChargesStep from './fixed-deposit-account-stepper/FixedDepositAccountChargesStep'
import FixedDepositAccountPreviewStep from './fixed-deposit-account-stepper/FixedDepositAccountPreviewStep'
import {
  MATURITY_TRANSFER_TO_SAVINGS,
  applyProductTemplate,
  buildFixedDepositAccountRequest,
  chargeNeedsDate,
  createInitialForm,
  depositTermEndDate,
  type FieldLabelKey,
  type FixedDepositAccountForm,
  type FixedDepositAccountTemplate,
} from './fixed-deposit-account-form'

const fdApi = new FixedDepositAccountApi(getConfiguration())

type FineractErrorResponse = {
  defaultUserMessage?: string
  errors?: { defaultUserMessage?: string }[]
}

const isMissing = (value: unknown) =>
  value === undefined || value === null || value === ''

const CreateFixedDepositAccount = () => {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const [template, setTemplate] = useState<FixedDepositAccountTemplate>()
  const [templateError, setTemplateError] = useState(false)
  const [productTemplate, setProductTemplate] =
    useState<FixedDepositAccountTemplate>()
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [businessDate] = useBusinessDateState()
  const [formData, setFormData] = useState<FixedDepositAccountForm>(() =>
    createInitialForm('')
  )
  // The product the latest template request is for, so a slow earlier
  // response does not overwrite the product picked after it
  const requestedProduct = useRef<number | undefined>(undefined)

  const clientPath = `/clients/${clientId}/general`

  useEffect(() => {
    setFormData(form =>
      form.submittedOnDate ? form : { ...form, submittedOnDate: businessDate }
    )
  }, [businessDate])

  useEffect(() => {
    let stale = false
    const fetchTemplate = async () => {
      try {
        const response = await fdApi.template12(Number(clientId))
        if (!stale) {
          setTemplate(response.data as unknown as FixedDepositAccountTemplate)
        }
      } catch (err) {
        console.error('Failed to fetch Fixed Deposit Account template', err)
        if (!stale) setTemplateError(true)
      }
    }
    fetchTemplate()
    return () => {
      stale = true
    }
  }, [clientId])

  const handleProductChange = async (productId: number) => {
    requestedProduct.current = productId
    setFormData(form => ({ ...form, productId }))
    setProductTemplate(undefined)
    setProductError(null)
    setLoadingProduct(true)
    try {
      const response = await fdApi.template12(
        Number(clientId),
        undefined,
        productId
      )
      if (requestedProduct.current !== productId) return
      const data = response.data as unknown as FixedDepositAccountTemplate
      setProductTemplate(data)
      setFormData(form => applyProductTemplate(form, data))
    } catch (err) {
      console.error('Failed to fetch Fixed Deposit product template', err)
      if (requestedProduct.current === productId) {
        setProductError(t('fixedDepositApplication.errors.productFailed'))
      }
    } finally {
      if (requestedProduct.current === productId) setLoadingProduct(false)
    }
  }

  const field = (name: FieldLabelKey) =>
    t(`fixedDepositApplication.fields.${name}`)
  const required = (name: FieldLabelKey) =>
    t('fixedDepositApplication.validation.required', { field: field(name) })

  /** Returns the first required field, keyed by its label, that is empty */
  const firstMissing = (fields: [unknown, FieldLabelKey][]) => {
    const missing = fields.find(([value]) => isMissing(value))
    return missing ? required(missing[1]) : null
  }

  const validateDetails = () => {
    const missing = firstMissing([
      [formData.productId, 'product'],
      [formData.submittedOnDate, 'submittedOn'],
    ])
    if (missing) return missing
    if (productError) return productError
    if (!productTemplate) return t('fixedDepositApplication.loadingProduct')
    if (formData.submittedOnDate > todayInputValue()) {
      return t('fixedDepositApplication.validation.submittedInFuture')
    }
    // Fineract can only pick an interest rate from a chart that covers the
    // submitted date, and otherwise answers with an unclear error
    const chart = productTemplate.accountChart
    const chartFrom = dateArrayToInputValue(chart?.fromDate)
    const chartEnd = dateArrayToInputValue(chart?.endDate)
    if (
      (chartFrom && formData.submittedOnDate < chartFrom) ||
      (chartEnd && formData.submittedOnDate > chartEnd)
    ) {
      return t('fixedDepositApplication.validation.outsideChart')
    }
    return null
  }

  const validateTerms = () => {
    const missing = firstMissing([
      [formData.depositAmount, 'depositAmount'],
      [formData.depositPeriod, 'depositPeriod'],
      [formData.depositPeriodFrequencyId, 'depositPeriodType'],
      [formData.interestCompoundingPeriodType, 'interestCompoundingPeriod'],
      [formData.interestPostingPeriodType, 'interestPostingPeriod'],
      [formData.interestCalculationType, 'interestCalculatedUsing'],
      [formData.interestCalculationDaysInYearType, 'daysInYear'],
    ])
    if (missing) return missing
    if ((formData.depositAmount ?? 0) <= 0) {
      return t('fixedDepositApplication.validation.positive', {
        field: field('depositAmount'),
      })
    }
    // Compare the term with the product's limits by the date each one ends,
    // as Fineract does, so that limits in a different unit are still applied
    const period = formData.depositPeriod ?? 0
    const periodTypeId = formData.depositPeriodFrequencyId ?? 0
    const start = formData.submittedOnDate
    const termEnd = depositTermEndDate(start, period, periodTypeId)
    const { minDepositTerm, minDepositTermType, maxDepositTerm } =
      productTemplate ?? {}
    const maxDepositTermType = productTemplate?.maxDepositTermType
    const minEnd =
      minDepositTerm !== undefined && minDepositTermType
        ? depositTermEndDate(start, minDepositTerm, minDepositTermType.id)
        : undefined
    const maxEnd =
      maxDepositTerm !== undefined && maxDepositTermType
        ? depositTermEndDate(start, maxDepositTerm, maxDepositTermType.id)
        : undefined
    if (termEnd && minEnd && termEnd < minEnd) {
      return t('fixedDepositApplication.validation.periodBelowMin', {
        min: `${minDepositTerm} ${minDepositTermType?.value ?? ''}`.trim(),
      })
    }
    if (termEnd && maxEnd && termEnd > maxEnd) {
      return t('fixedDepositApplication.validation.periodAboveMax', {
        max: `${maxDepositTerm} ${maxDepositTermType?.value ?? ''}`.trim(),
      })
    }
    return null
  }

  const validateSettings = () => {
    if (
      formData.lockinPeriodFrequency !== undefined &&
      formData.lockinPeriodFrequencyType === undefined
    ) {
      return required('type')
    }
    return firstMissing([
      ...(formData.transferInterestToSavings
        ? ([[formData.linkAccountId, 'linkedSavingsAccount']] as [
            unknown,
            FieldLabelKey,
          ][])
        : []),
      ...(formData.maturityInstructionId === MATURITY_TRANSFER_TO_SAVINGS
        ? ([[formData.transferToSavingsId, 'transferToSavings']] as [
            unknown,
            FieldLabelKey,
          ][])
        : []),
    ])
  }

  const validateCharges = () => {
    const charge = formData.charges.find(
      charge =>
        isMissing(charge.amount) || (chargeNeedsDate(charge) && !charge.dueDate)
    )
    if (!charge) return null
    return isMissing(charge.amount)
      ? t('fixedDepositApplication.validation.chargeAmount', {
          charge: charge.name,
        })
      : t('fixedDepositApplication.validation.chargeDate', {
          charge: charge.name,
        })
  }

  const handleSubmit = async () => {
    // The stepper validates only the open step, and a user can reach the
    // preview after clearing a field on an earlier step, so every step is
    // checked again before the request is sent
    for (const step of steps) {
      const error = step.validate?.()
      if (error) {
        throw new Error(
          t('fixedDepositApplication.validation.stepInvalid', {
            step: step.title,
            error,
          })
        )
      }
    }
    try {
      // The spec leaves out most of the fields this request takes, so it is
      // built to match the live API instead
      const request = buildFixedDepositAccountRequest(
        formData,
        Number(clientId),
        productTemplate
      ) as unknown as PostFixedDepositAccountsRequest
      await fdApi.submitApplication(request)
      const state: RouteSuccessState = {
        successMessage: t('success.fixedDepositAccountCreated'),
      }
      navigate(clientPath, { state })
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
              t('fixedDepositApplication.errors.createFailed')
      )
    }
  }

  const stepProps = { formData, onChange: setFormData, productTemplate }
  const steps = template
    ? [
        {
          title: t('fixedDepositApplication.steps.details'),
          component: (
            <FixedDepositAccountDetailsStep
              {...stepProps}
              template={template}
              onProductChange={handleProductChange}
              loadingProduct={loadingProduct}
            />
          ),
          validate: validateDetails,
        },
        {
          title: t('fixedDepositApplication.steps.terms'),
          component: <FixedDepositAccountTermsStep {...stepProps} />,
          validate: validateTerms,
        },
        {
          title: t('fixedDepositApplication.steps.settings'),
          component: <FixedDepositAccountSettingsStep {...stepProps} />,
          validate: validateSettings,
        },
        {
          title: t('fixedDepositApplication.steps.interestRateChart'),
          component: (
            <FixedDepositAccountInterestRateChartStep {...stepProps} />
          ),
        },
        {
          title: t('fixedDepositApplication.steps.charges'),
          component: <FixedDepositAccountChargesStep {...stepProps} />,
          validate: validateCharges,
        },
        {
          title: t('fixedDepositApplication.steps.preview'),
          component: (
            <FixedDepositAccountPreviewStep
              {...stepProps}
              template={template}
            />
          ),
        },
      ]
    : []

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: tc('nav.home'), href: '/home' },
            { label: t('title'), href: '/clients' },
            {
              label: template?.clientName || t('client'),
              href: clientPath,
            },
            { label: t('fixedDepositApplication.title'), current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">
          {t('fixedDepositApplication.title')}
        </h1>
        {templateError ? (
          <p role="alert" className="text-sm text-red-600">
            {t('fixedDepositApplication.errors.templateFailed')}
          </p>
        ) : !template ? (
          <p className="text-sm text-muted-foreground">
            {tc('actions.loading')}
          </p>
        ) : (
          <MultiStepForm
            prefix={t('fixedDepositApplication.stepPrefix')}
            steps={steps}
            onSubmit={handleSubmit}
            onCancel={() => navigate(clientPath)}
            submitLabel={tc('actions.submit')}
          />
        )}
      </div>
    </div>
  )
}

export default CreateFixedDepositAccount
