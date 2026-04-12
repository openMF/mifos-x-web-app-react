/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppStepper from '@/components/custom/stepper/AppStepper'
import {
  faPen,
  faDollarSign,
  faSlidersH,
  faCalendarAlt,
  faTag,
  faBook,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
} from '@/fineract-api'
import { useEffect, useState } from 'react'

const loanProductApi = new LoanProductsApi(getConfiguration())

const CreateLoanProducts = () => {
  const [loanProducts, setLoanProducts] =
    useState<GetLoanProductsTemplateResponse>()
  const [_formData, _setFormData] = useState({
    // Reserved for future use
    fund: '', // only fund for now
  })

  useEffect(() => {
    const fetchLoanProductDetails = async () => {
      try {
        const response = await loanProductApi.retrieveTemplate11()
        setLoanProducts(response.data)
      } catch (err) {
        console.error('Failed to fetch Loan Products', err)
      }
    }
    fetchLoanProductDetails()
  }, [])

  if (!loanProducts) {
    return (
      <div className="text-center py-10">Loading loan product template...</div>
    )
  }

  const pages = [
    {
      icon: <FontAwesomeIcon icon={faPen} className="text-base" />,
      label: 'DETAILS',
      component: <LoanProductDetailsStep />,
    },
    {
      icon: <FontAwesomeIcon icon={faDollarSign} className="text-base" />,
      label: 'CURRENCY',
      component: <LoanProductCurrencyStep />,
    },
    {
      icon: <FontAwesomeIcon icon={faSlidersH} className="text-base" />,
      label: 'SETTINGS',
      component: <LoanProductSettingsStep />,
    },
    {
      icon: <FontAwesomeIcon icon={faCalendarAlt} className="text-base" />,
      label: 'TERMS',
      component: <LoanProductTermsStep />,
    },
    {
      icon: <FontAwesomeIcon icon={faTag} className="text-base" />,
      label: 'CHARGES',
      component: <LoanProductChargesStep />,
    },
    {
      icon: <FontAwesomeIcon icon={faBook} className="text-base" />,
      label: 'ACCOUNTING',
      component: <LoanProductAccountingStep />,
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
        <AppStepper steps={pages} />
      </div>
    </div>
  )
}

export default CreateLoanProducts
