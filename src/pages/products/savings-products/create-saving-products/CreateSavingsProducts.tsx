/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import SavingsProductDetailsStep from './create-saving-products-stepper/SavingsProductDetailsStep'
import SavingsProductCurrencyStep from './create-saving-products-stepper/SavingsProductCurrencyStep'
import SavingsProductTermsStep from './create-saving-products-stepper/SavingsProductTermsStep'
import SavingsProductSettingsStep from './create-saving-products-stepper/SavingsProductSettingsStep'
import SavingsProductChargesStep from './create-saving-products-stepper/SavingsProductChargesStep'
import SavingsProductAccountingStep from './create-saving-products-stepper/SavingsProductAccountingStep'
import {
  SavingsProductApi,
  type GetSavingsProductsTemplateResponse,
  type PostSavingsProductsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const savingsProductApi = new SavingsProductApi(getConfiguration())

const CreateSavingsProducts = () => {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<GetSavingsProductsTemplateResponse>()
  const [isLoading, setIsLoading] = useState(false)

  //form req for submitting savings product
  const [formData, setFormData] = useState<PostSavingsProductsRequest>({
    locale: 'en',
    accountingRule: 1,
  })

  //fetch initial data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await savingsProductApi.retrieveTemplate20()
        setTemplate(response.data)
      } catch (err) {
        console.error('Failed to fetch Savings Product template', err)
      }
    }
    fetchTemplate()
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await savingsProductApi.create13(formData)
      navigate('/products/saving-products')
    } catch (err) {
      console.error('Failed to create Savings Product', err)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      title: 'Details',
      prefix: 'SAVINGS PRODUCT',
      component: (
        <SavingsProductDetailsStep
          formData={formData}
          onChange={data => setFormData(data)}
        />
      ),
    },
    {
      title: 'Currency',
      prefix: 'SAVINGS PRODUCT',
      component: (
        <SavingsProductCurrencyStep
          formData={formData}
          onChange={data => setFormData(data)}
          template={template}
        />
      ),
    },
    {
      title: 'Terms',
      prefix: 'SAVINGS PRODUCT',
      component: (
        <SavingsProductTermsStep
          formData={formData}
          onChange={data => setFormData(data)}
          template={template}
        />
      ),
    },
    {
      title: 'Settings',
      prefix: 'SAVINGS PRODUCT',
      component: <SavingsProductSettingsStep />,
    },
    {
      title: 'Charges',
      prefix: 'SAVINGS PRODUCT',
      component: (
        <SavingsProductChargesStep
          formData={formData}
          onChange={data => setFormData(data)}
          template={template}
        />
      ),
    },
    {
      title: 'Accounting',
      prefix: 'SAVINGS PRODUCT',
      component: (
        <SavingsProductAccountingStep
          formData={formData}
          onChange={data => setFormData(data)}
          template={template}
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
        {/* Multistep form component */}
        <MultiStepForm
          prefix="SAVINGS PRODUCT"
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/products/saving-products')}
          isLoading={isLoading}
          submitLabel="Submit"
        />
      </div>
    </div>
  )
}

export default CreateSavingsProducts
