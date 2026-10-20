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
import { ProductsApi, type PostProductsTypeRequest } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import ShareProductDetailsStep from './create-share-product-stepper/ShareProductDetailsStep'
import ShareProductCurrencyStep from './create-share-product-stepper/ShareProductCurrencyStep'
import ShareProductTermsStep from './create-share-product-stepper/ShareProductTermsStep'
import ShareProductSettingsStep from './create-share-product-stepper/ShareProductSettingsStep'
import ShareProductMarketPriceStep from './create-share-product-stepper/ShareProductMarketPriceStep'
import ShareProductChargesStep from './create-share-product-stepper/ShareProductChargesStep'
import ShareProductAccountingStep from './create-share-product-stepper/ShareProductAccountingStep'
import {
  buildShareProductPayload,
  getRequiredGlMappings,
  initialShareProductForm,
  type ShareProductForm,
  type ShareProductTemplate,
} from './share-product-form'

const productsApi = new ProductsApi(getConfiguration())

const PRODUCT_TYPE = 'share'
const LIST_PATH = '/products/share-products'

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

const isPositiveInteger = (value?: number) =>
  value !== undefined && Number.isInteger(value) && value > 0

/** Fineract leaves these fields optional, so they are checked only if entered */
const isOptionalPositiveInteger = (value?: number) =>
  value === undefined || isPositiveInteger(value)

const CreateShareProduct = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('products')

  const [template, setTemplate] = useState<ShareProductTemplate>()
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [form, setForm] = useState<ShareProductForm>(initialShareProductForm)

  const update = (patch: Partial<ShareProductForm>) =>
    setForm(prev => ({ ...prev, ...patch }))

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await productsApi.retrieveTemplate13(PRODUCT_TYPE)
        const data = res.data as unknown as ShareProductTemplate
        setTemplate(data)
        // Start from the first currency and period type, as the Angular app does
        const currency = data.currencyOptions?.[0]
        setForm(prev => ({
          ...prev,
          currencyCode: prev.currencyCode ?? currency?.code,
          digitsAfterDecimal:
            prev.digitsAfterDecimal ?? currency?.decimalPlaces,
          inMultiplesOf: prev.inMultiplesOf ?? currency?.inMultiplesOf,
          minimumactiveperiodFrequencyType:
            prev.minimumactiveperiodFrequencyType ??
            data.minimumActivePeriodFrequencyTypeOptions?.[0]?.id,
        }))
      } catch (err) {
        console.error('Failed to fetch share product template', err)
        setTemplateError(t('createShareProduct.templateFailed'))
      }
    }
    fetchTemplate()
  }, [t])

  const validateDetails = () => {
    if (isBlank(form.name))
      return t('createShareProduct.validation.nameRequired')
    if (isBlank(form.shortName))
      return t('createShareProduct.validation.shortNameRequired')
    if (isBlank(form.description))
      return t('createShareProduct.validation.descriptionRequired')
    return null
  }

  const validateCurrency = () => {
    if (!form.currencyCode)
      return t('createShareProduct.validation.currencyRequired')
    if (form.digitsAfterDecimal === undefined || form.digitsAfterDecimal < 0)
      return t('createShareProduct.validation.decimalPlacesRequired')
    if (!isPositiveInteger(form.inMultiplesOf))
      return t('createShareProduct.validation.inMultiplesOfInvalid')
    return null
  }

  const validateTerms = () => {
    if (!isPositiveInteger(form.totalShares))
      return t('createShareProduct.validation.totalSharesRequired')
    if (!isOptionalPositiveInteger(form.sharesIssued))
      return t('createShareProduct.validation.sharesIssuedInvalid')
    if (
      form.sharesIssued !== undefined &&
      form.sharesIssued > form.totalShares!
    )
      return t('createShareProduct.validation.sharesIssuedTooHigh')
    if (form.unitPrice === undefined || form.unitPrice <= 0)
      return t('createShareProduct.validation.unitPriceRequired')
    return null
  }

  const validateSettings = () => {
    const { minimumShares, nominalShares, maximumShares } = form
    if (!isPositiveInteger(nominalShares))
      return t('createShareProduct.validation.nominalSharesRequired')
    if (
      !isOptionalPositiveInteger(minimumShares) ||
      !isOptionalPositiveInteger(maximumShares)
    )
      return t('createShareProduct.validation.sharesPerClientInvalid')
    if (
      (minimumShares !== undefined && minimumShares > nominalShares!) ||
      (maximumShares !== undefined && nominalShares! > maximumShares)
    )
      return t('createShareProduct.validation.sharesPerClientOrder')
    if (
      form.minimumActivePeriodForDividends !== undefined &&
      (!isPositiveInteger(form.minimumActivePeriodForDividends) ||
        form.minimumactiveperiodFrequencyType === undefined)
    )
      return t('createShareProduct.validation.minimumActivePeriodInvalid')
    if (
      (form.lockinPeriodFrequency === undefined) !==
      (form.lockinPeriodFrequencyType === undefined)
    )
      return t('createShareProduct.validation.lockinPeriodIncomplete')
    if (
      form.lockinPeriodFrequency !== undefined &&
      !isPositiveInteger(form.lockinPeriodFrequency)
    )
      return t('createShareProduct.validation.lockinPeriodInvalid')
    return null
  }

  const validateAccounting = () => {
    const missing = getRequiredGlMappings(form.accountingRule).some(
      ({ key }) => form.glMappings[key] === undefined
    )
    return missing
      ? t('createShareProduct.validation.glMappingsRequired')
      : null
  }

  const steps = [
    {
      title: t('createShareProduct.steps.details'),
      validate: validateDetails,
      component: <ShareProductDetailsStep form={form} update={update} />,
    },
    {
      title: t('createShareProduct.steps.currency'),
      validate: validateCurrency,
      component: (
        <ShareProductCurrencyStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createShareProduct.steps.terms'),
      validate: validateTerms,
      component: <ShareProductTermsStep form={form} update={update} />,
    },
    {
      title: t('createShareProduct.steps.settings'),
      validate: validateSettings,
      component: (
        <ShareProductSettingsStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createShareProduct.steps.marketPrice'),
      component: <ShareProductMarketPriceStep form={form} update={update} />,
    },
    {
      title: t('createShareProduct.steps.charges'),
      component: (
        <ShareProductChargesStep
          form={form}
          update={update}
          template={template}
        />
      ),
    },
    {
      title: t('createShareProduct.steps.accounting'),
      validate: validateAccounting,
      component: (
        <ShareProductAccountingStep
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

    // The generated request type has no share capital or GL mapping fields,
    // and types the market prices and charges as a Set, which axios would
    // send as an empty object
    const payload = buildShareProductPayload(
      form
    ) as unknown as PostProductsTypeRequest

    try {
      await productsApi.createProduct(PRODUCT_TYPE, payload)
    } catch (err) {
      console.error('Failed to create share product', err)
      throw new Error(
        getApiErrorMessage(err) ?? t('createShareProduct.createFailed')
      )
    }

    alert(t('createShareProduct.created'))
    navigate(LIST_PATH)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: 'Home', href: '/home' },
            { label: t('title'), href: '/products' },
            { label: t('shareProducts'), href: LIST_PATH },
            { label: t('createShareProduct.breadcrumb'), current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">
          {t('createShareProduct.heading')}
        </h1>

        {templateError && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {templateError}
          </div>
        )}

        <MultiStepForm
          prefix={t('createShareProduct.prefix')}
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate(LIST_PATH)}
          submitLabel={t('createShareProduct.submit')}
        />
      </div>
    </div>
  )
}

export default CreateShareProduct
