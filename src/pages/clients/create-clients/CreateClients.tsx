/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import ClientGeneralStep from './create-clients-stepper/ClientGeneralStep'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  ClientApi,
  type GetClientsTemplateResponse,
  type PostClientsRequest,
} from '@/fineract-api'
import { useEffect, useState } from 'react'
import MultiStepForm from '@/components/custom/multi-step-form/MultiStepForm'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'

const clientApi = new ClientApi(getConfiguration())

const CreateClients = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const [clientTemplate, setClientTemplate] =
    useState<GetClientsTemplateResponse>()

  // fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await clientApi.retrieveTemplate5()
        setClientTemplate(response.data)
      } catch (err) {
        console.log('Failed to fetch initial data: ', err)
      }
    }
    fetchInitialData()
  }, [])

  const handleSubmit = async () => {
    try {
      const response = await clientApi.create6(formData)
      // Land on the new client rather than the list, which hides a pending
      // client, and carry a message so the create is confirmed either way
      const clientId = response.data?.clientId ?? response.data?.resourceId
      const state: RouteSuccessState = {
        successMessage: t('success.clientCreated'),
      }
      navigate(clientId ? `/clients/${clientId}` : '/clients', { state })
    } catch (error) {
      console.error('Error while submitting', error)
    }
  }

  const [formData, setFormData] = useState<PostClientsRequest>({
    locale: 'en',
    dateFormat: 'yyyy-MM-dd',
    legalFormId: 1,
    active: false,
  })

  if (!clientTemplate) {
    return <div className="text-center py-10">Loading client template...</div>
  }

  //stepper forms
  const steps = [
    {
      title: 'GENERAL',
      component: (
        <ClientGeneralStep
          formData={formData}
          onChange={setFormData}
          template={clientTemplate}
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
            { label: 'Create Client', current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Client</h1>
        <MultiStepForm
          prefix="Client"
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/clients')}
        />
      </div>
    </div>
  )
}

export default CreateClients
