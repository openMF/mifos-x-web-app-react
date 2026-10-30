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
  RecurringDepositAccountApi,
  type PostRecurringDepositAccountsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useBusinessDateState } from '@/lib/business-date'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import RecurringDepositAccountDetailsStep from './recurring-deposit-account-stepper/RecurringDepositAccountDetailsStep'
import RecurringDepositAccountTermsStep from './recurring-deposit-account-stepper/RecurringDepositAccountTermsStep'
import RecurringDepositAccountSettingsStep from './recurring-deposit-account-stepper/RecurringDepositAccountSettingsStep'
import RecurringDepositAccountInterestRateChartStep from './recurring-deposit-account-stepper/RecurringDepositAccountInterestRateChartStep'
import RecurringDepositAccountChargesStep from './recurring-deposit-account-stepper/RecurringDepositAccountChargesStep'
import RecurringDepositAccountPreviewStep from './recurring-deposit-account-stepper/RecurringDepositAccountPreviewStep'
import {
  applyProductTemplate,
  buildRecurringDepositAccountRequest,
  chargeNeedsDate,
  createInitialForm,
  type FieldLabelKey,
  type RecurringDepositAccountForm,
  type RecurringDepositAccountTemplate,
} from './recurring-deposit-account-form'

const rdApi = new RecurringDepositAccountApi(getConfiguration())

type FineractErrorResponse = {
  defaultUserMessage?: string
  errors?: { defaultUserMessage?: string }[]
}

const isMissing = (value: unknown) =>
  value === undefined || value === null || value === ''

const CreateRecurringDepositAccount = () => {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const [template, setTemplate] = useState<RecurringDepositAccountTemplate>()
  const [templateError, setTemplateError] = useState(false)
  const [productTemplate, setProductTemplate] =
    useState<RecurringDepositAccountTemplate>()
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [businessDate] = useBusinessDateState()
  const [formData, setFormData] = useState<RecurringDepositAccountForm>(() =>
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
        const response = await rdApi.template13(Number(clientId))
        if (!stale) {
          setTemplate(
            response.data as unknown as RecurringDepositAccountTemplate
          )
        }
      } catch (err) {
        console.error('Failed to fetch Recurring Deposit Account template', err)
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
      const response = await rdApi.template13(
        Number(clientId),
        undefined,
        productId
      )
      if (requestedProduct.current !== productId) return
      const data = response.data as unknown as RecurringDepositAccountTemplate
      setProductTemplate(data)
      setFormData(form => applyProductTemplate(form, data))
    } catch (err) {
      console.error('Failed to fetch Recurring Deposit product template', err)
      if (requestedProduct.current === productId) {
        setProductError(t('recurringDepositApplication.errors.productFailed'))
      }
    } finally {
      if (requestedProduct.current === productId) setLoadingProduct(false)
    }
  }

  const field = (name: FieldLabelKey) =>
    t(`recurringDepositApplication.fields.${name}`)
  const required = (name: FieldLabelKey) =>
    t('recurringDepositApplication.validation.required', { field: field(name) })

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
    if (!productTemplate) return t('recurringDepositApplication.loadingProduct')
    if (formData.submittedOnDate > todayInputValue()) {
      return t('recurringDepositApplication.validation.submittedInFuture')
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
      return t('recurringDepositApplication.validation.outsideChart')
    }
    return null
  }

  const validateTerms = () => {
    const missing = firstMissing([
      [formData.mandatoryRecommendedDepositAmount, 'depositAmount'],
      [formData.depositPeriod, 'depositPeriod'],
      [formData.depositPeriodFrequencyId, 'depositPeriodType'],
      // Fineract takes the frequency from the group meeting when inherited
      ...(formData.isCalendarInherited
        ? []
        : ([
            [formData.recurringFrequency, 'depositFrequency'],
            [formData.recurringFrequencyType, 'depositFrequencyType'],
          ] as [unknown, FieldLabelKey][])),
      [formData.interestCompoundingPeriodType, 'interestCompoundingPeriod'],
      [formData.interestPostingPeriodType, 'interestPostingPeriod'],
      [formData.interestCalculationType, 'interestCalculatedUsing'],
      [formData.interestCalculationDaysInYearType, 'daysInYear'],
    ])
    if (missing) return missing
    if ((formData.mandatoryRecommendedDepositAmount ?? 0) <= 0) {
      return t('recurringDepositApplication.validation.positive', {
        field: field('depositAmount'),
      })
    }
    if (
      !formData.isCalendarInherited &&
      (formData.recurringFrequency ?? 0) <= 0
    ) {
      return t('recurringDepositApplication.validation.positive', {
        field: field('depositFrequency'),
      })
    }
    if (
      !formData.isCalendarInherited &&
      formData.expectedFirstDepositOnDate &&
      formData.expectedFirstDepositOnDate < formData.submittedOnDate
    ) {
      return t('recurringDepositApplication.validation.startBeforeSubmitted')
    }
    // The product's term limits only compare directly in the same unit
    const period = formData.depositPeriod ?? 0
    const { minDepositTerm, minDepositTermType, maxDepositTerm } =
      productTemplate ?? {}
    const maxDepositTermType = productTemplate?.maxDepositTermType
    if (
      minDepositTerm !== undefined &&
      minDepositTermType?.id === formData.depositPeriodFrequencyId &&
      period < minDepositTerm
    ) {
      return t('recurringDepositApplication.validation.periodBelowMin', {
        min: `${minDepositTerm} ${minDepositTermType?.value ?? ''}`.trim(),
      })
    }
    if (
      maxDepositTerm !== undefined &&
      maxDepositTermType?.id === formData.depositPeriodFrequencyId &&
      period > maxDepositTerm
    ) {
      return t('recurringDepositApplication.validation.periodAboveMax', {
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
    return null
  }

  const validateCharges = () => {
    const charge = formData.charges.find(
      charge =>
        isMissing(charge.amount) || (chargeNeedsDate(charge) && !charge.dueDate)
    )
    if (!charge) return null
    return isMissing(charge.amount)
      ? t('recurringDepositApplication.validation.chargeAmount', {
          charge: charge.name,
        })
      : t('recurringDepositApplication.validation.chargeDate', {
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
          t('recurringDepositApplication.validation.stepInvalid', {
            step: step.title,
            error,
          })
        )
      }
    }
    try {
      // The spec leaves out most of the fields this request takes, so it is
      // built to match the live API instead
      const request = buildRecurringDepositAccountRequest(
        formData,
        Number(clientId),
        productTemplate
      ) as unknown as PostRecurringDepositAccountsRequest
      await rdApi.submitApplication1(request)
      const state: RouteSuccessState = {
        successMessage: t('success.recurringDepositAccountCreated'),
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
              t('recurringDepositApplication.errors.createFailed')
      )
    }
  }

  const stepProps = { formData, onChange: setFormData, productTemplate }
  const steps = template
    ? [
        {
          title: t('recurringDepositApplication.steps.details'),
          component: (
            <RecurringDepositAccountDetailsStep
              {...stepProps}
              template={template}
              onProductChange={handleProductChange}
              loadingProduct={loadingProduct}
            />
          ),
          validate: validateDetails,
        },
        {
          title: t('recurringDepositApplication.steps.terms'),
          component: <RecurringDepositAccountTermsStep {...stepProps} />,
          validate: validateTerms,
        },
        {
          title: t('recurringDepositApplication.steps.settings'),
          component: <RecurringDepositAccountSettingsStep {...stepProps} />,
          validate: validateSettings,
        },
        {
          title: t('recurringDepositApplication.steps.interestRateChart'),
          component: (
            <RecurringDepositAccountInterestRateChartStep {...stepProps} />
          ),
        },
        {
          title: t('recurringDepositApplication.steps.charges'),
          component: <RecurringDepositAccountChargesStep {...stepProps} />,
          validate: validateCharges,
        },
        {
          title: t('recurringDepositApplication.steps.preview'),
          component: (
            <RecurringDepositAccountPreviewStep
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
            { label: t('recurringDepositApplication.title'), current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">
          {t('recurringDepositApplication.title')}
        </h1>
        {templateError ? (
          <p role="alert" className="text-sm text-red-600">
            {t('recurringDepositApplication.errors.templateFailed')}
          </p>
        ) : !template ? (
          <p className="text-sm text-muted-foreground">
            {tc('actions.loading')}
          </p>
        ) : (
          <MultiStepForm
            prefix={t('recurringDepositApplication.stepPrefix')}
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

export default CreateRecurringDepositAccount
