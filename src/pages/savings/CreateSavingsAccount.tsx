/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import SavingsAccountDetailsStep from './savings-account-stepper/SavingsAccountDetailsStep'
import SavingsAccountTermsStep from './savings-account-stepper/SavingsAccountTermsStep'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  SavingsAccountApi,
  type GetSavingsAccountsTemplateResponse,
  type PostSavingsAccountsRequest,
} from '@/fineract-api'
import { useEffect, useState } from 'react'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

const savingsAccountApi = new SavingsAccountApi(getConfiguration())

const CreateSavingsAccount = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [template, setTemplate] = useState<GetSavingsAccountsTemplateResponse>()

  const location = useLocation()
  const isGroup = location.pathname.includes(`/groups/${id}/savings-accounts/`)

  // fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await savingsAccountApi.template14(
          isGroup ? undefined : Number(id),
          isGroup ? Number(id) : undefined
        )
        setTemplate(response.data)
      } catch (err) {
        console.log('Failed to fetch initial data: ', err)
      }
    }
    fetchInitialData()
  }, [id, isGroup])

  const handleSubmit = async () => {
    try {
      await savingsAccountApi.submitApplication2(formData)
      navigate(isGroup ? `/groups/${id}/general` : `/clients/${id}/general`)
    } catch (error) {
      console.error('Error while submitting', error)
    }
  }

  //some form details are kept manual because they are broken in OpenApi
  const [formData, setFormData] = useState<PostSavingsAccountsRequest>({
    locale: 'en',
    dateFormat: 'dd MMMM yyyy',
    ...(isGroup ? { groupId: Number(id) } : { clientId: Number(id) }),
    submittedOnDate: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  })

  if (!template) {
    return (
      <div className="text-center py-10">
        Loading savings account template...
      </div>
    )
  }

  const steps = [
    {
      title: 'DETAILS',
      component: (
        <SavingsAccountDetailsStep
          formData={formData}
          onChange={setFormData}
          template={template}
        />
      ),
    },
    {
      title: 'TERMS',
      component: <SavingsAccountTermsStep />,
    },
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: 'Home', href: '/home' },
            {
              label: isGroup ? 'Groups' : 'Clients',
              href: isGroup ? '/groups' : '/clients',
            },
            {
              label: isGroup ? 'Group' : template?.clientName || 'Client',
              href: isGroup
                ? `/groups/${id}/general`
                : `/clients/${id}/general`,
            },
            { label: 'Create Savings Account', current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Savings Account</h1>
        {/* MultiStep form component */}
        <MultiStepForm
          prefix="Savings Account"
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(
              isGroup ? `/groups/${id}/general` : `/clients/${id}/general`
            )
          }
        />
      </div>
    </div>
  )
}

export default CreateSavingsAccount
