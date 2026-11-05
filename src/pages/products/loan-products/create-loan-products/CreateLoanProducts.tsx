/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import LoanProductDetailsStep from './create-loan-products-stepper/LoanProductDetailsStep'
import LoanProductCurrencyStep from './create-loan-products-stepper/LoanProductCurrencyStep'
import LoanProductSettingsStep from './create-loan-products-stepper/LoanProductSettingsStep'
import LoanProductTermsStep from './create-loan-products-stepper/LoanProductTermsStep'
import LoanProductChargesStep from './create-loan-products-stepper/LoanProductChargesStep'
import LoanProductAccountingStep from './create-loan-products-stepper/LoanProductAccountingStep'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  LoanProductsApi,
  type GetLoanProductsTemplateResponse,
  type PostLoanProductsRequest,
} from '@/fineract-api'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import { useNavigate } from 'react-router-dom'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { incompleteMappings, missingAccounts } from '../loanProductAccounting'

const loanProductApi = new LoanProductsApi(getConfiguration())

const CreateLoanProducts = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('products')
  const [loanProducts, setLoanProducts] =
    useState<GetLoanProductsTemplateResponse>()

  //fetch inital data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await loanProductApi.retrieveTemplate11()
        setLoanProducts(response.data)
      } catch (err) {
        console.log('Failed to fetch initial data: ', err)
      }
    }
    fetchInitialData()
  }, [])

  const handleSubmit = async () => {
    try {
      await loanProductApi.createLoanProduct(formData)
      navigate(`/products/loan-products`)
    } catch (error) {
      console.error('Error while submitting', error)
      // MultiStepForm shows a thrown error; without it a refused product looked like nothing happened
      throw new Error(
        datatableErrorMessage(error) ?? t('loanProductAccounting.saveFailed')
      )
    }
  }

  //some form details are kept manually because they are broken in OpenApi
  const [formData, setFormData] = useState<PostLoanProductsRequest>({
    locale: 'en',
    dateFormat: 'dd MMMM yyyy',
    isInterestRecalculationEnabled: false,
    accountingRule: 1,
    interestRateVariationsForBorrowerCycle: [],
    numberOfRepaymentVariationsForBorrowerCycle: [],
    principalVariationsForBorrowerCycle: [],
  })

  if (!loanProducts) {
    return (
      <div className="text-center py-10">Loading loan product template...</div>
    )
  }

  const steps = [
    {
      title: 'DETAILS',
      component: (
        <LoanProductDetailsStep formData={formData} onChange={setFormData} />
      ),
    },
    {
      title: 'CURRENCY',
      component: (
        <LoanProductCurrencyStep
          formData={formData}
          onChange={setFormData}
          template={loanProducts}
        />
      ),
    },
    {
      title: 'SETTINGS',
      component: (
        <LoanProductSettingsStep
          formData={formData}
          onChange={setFormData}
          template={loanProducts}
        />
      ),
    },
    {
      title: 'TERMS',
      component: (
        <LoanProductTermsStep
          formData={formData}
          onChange={setFormData}
          template={loanProducts}
        />
      ),
    },
    {
      title: 'CHARGES',
      component: (
        <LoanProductChargesStep
          formData={formData}
          onChange={setFormData}
          template={loanProducts}
        />
      ),
    },
    {
      title: 'ACCOUNTING',
      component: (
        <LoanProductAccountingStep
          formData={formData}
          onChange={setFormData}
          template={loanProducts}
        />
      ),
      validate: () => {
        const missing = missingAccounts(
          formData.accountingRule,
          formData as Record<string, unknown>
        )
        if (missing.length)
          return t('loanProductAccounting.missingAccounts', {
            accounts: missing
              .map(f => t(`loanProductAccounting.fields.${f.label}`))
              .join(', '),
          })
        const incomplete = incompleteMappings(
          formData as Record<string, unknown>
        )
        return incomplete.length
          ? t('loanProductAccounting.advanced.incompleteRows', {
              tables: incomplete
                .map(m => t(`loanProductAccounting.advanced.${m.label}.title`))
                .join(', '),
            })
          : null
      },
    },
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: 'Home', href: '/home' },
            { label: 'Products', href: '/products' },
            { label: 'Loan Products', href: '/products/loan-products' },
            { label: 'Create', current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Loan Product</h1>
        {/* MultiStep form component */}
        <MultiStepForm
          prefix="Loan Product"
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/products/loan-products')}
        />
      </div>
    </div>
  )
}

export default CreateLoanProducts
