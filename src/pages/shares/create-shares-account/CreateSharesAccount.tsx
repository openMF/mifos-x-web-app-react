/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import SharesAccountDetailsStep from '../shares-account-stepper/SharesAccountDetailsStep'
import SharesAccountTermsStep from '../shares-account-stepper/SharesAccountTermsStep'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  ShareAccountApi,
  ClientApi,
  type AccountRequest,
  type GetAccountsTypeTemplateResponse,
  type GetClientsSavingsAccounts,
} from '@/fineract-api'
import { useEffect, useState } from 'react'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import { useNavigate, useParams } from 'react-router-dom'

const shareAccountApi = new ShareAccountApi(getConfiguration())
const clientApi = new ClientApi(getConfiguration())

const CreateSharesAccount = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [template, setTemplate] = useState<GetAccountsTypeTemplateResponse>()
  const [savingsAccounts, setSavingsAccounts] = useState<
    GetClientsSavingsAccounts[]
  >([])

  // fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [templateRes, accountsRes] = await Promise.all([
          shareAccountApi.template7('share', Number(id)),
          clientApi.retrieveAssociatedAccounts(Number(id)),
        ])
        setTemplate(templateRes.data)
        setSavingsAccounts(Array.from(accountsRes.data.savingsAccounts ?? []))
      } catch (err) {
        console.log('Failed to fetch initial data: ', err)
      }
    }
    fetchInitialData()
  }, [id])

  const handleSubmit = async () => {
    try {
      await shareAccountApi.createAccount('share', formData)
      navigate(`/clients/${id}/general`)
    } catch (error) {
      console.error('Error while submitting', error)
    }
  }

  //some details are kept maunal, they are broken in OpenApi
  const [formData, setFormData] = useState<AccountRequest>({
    locale: 'en',
    dateFormat: 'yyyy-MM-dd',
    clientId: Number(id),
    submittedDate: new Date().toISOString().split('T')[0],
  })

  if (!template) {
    return (
      <div className="text-center py-10">
        Loading shares account template...
      </div>
    )
  }

  const steps = [
    {
      title: 'DETAILS',
      component: (
        <SharesAccountDetailsStep
          formData={formData}
          onChange={setFormData}
          template={template}
        />
      ),
    },
    {
      title: 'TERMS',
      component: (
        <SharesAccountTermsStep
          formData={formData}
          onChange={setFormData}
          savingsAccounts={savingsAccounts}
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
            { label: 'Clients', href: '/clients' },
            {
              label: template?.clientName || 'Client',
              href: `/clients/${id}/general`,
            },
            { label: 'Create Shares Account', current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Shares Account</h1>
        {/* MultiStep form component */}
        <MultiStepForm
          prefix="Shares Account"
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/clients/${id}/general`)}
        />
      </div>
    </div>
  )
}

export default CreateSharesAccount
