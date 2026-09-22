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
import type { AxiosError } from 'axios'

const clientApi = new ClientApi(getConfiguration())

/** Fineract legal form ids, from the clientLegalFormOptions template */
const LEGAL_FORM_ENTITY = 2

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
}

const getClientErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ClientApiErrorResponse>
  const responseData = axiosError.response?.data

  return (
    responseData?.errors?.[0]?.defaultUserMessage ||
    responseData?.errors?.[0]?.developerMessage ||
    responseData?.defaultUserMessage ||
    responseData?.developerMessage ||
    axiosError.message ||
    'Failed to create client'
  )
}

/**
 * Fineract stores an entity's name in fullname and a person's in
 * firstname/middlename/lastname, and rejects a request that carries both. The
 * form collects a first and last name either way, so join them for an entity.
 */
const buildClientRequest = (
  formData: PostClientsRequest
): PostClientsRequest => {
  if (formData.legalFormId !== LEGAL_FORM_ENTITY) {
    return formData
  }

  const { firstname, middlename: _middlename, lastname, ...rest } = formData
  return {
    ...rest,
    fullname: [firstname, lastname].filter(Boolean).join(' ') || undefined,
  }
}

const CreateClients = () => {
  const navigate = useNavigate()
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
      await clientApi.create6(buildClientRequest(formData))
      navigate(`/clients`)
    } catch (error) {
      // Surfaced by the stepper, which shows the message above the buttons
      throw new Error(getClientErrorMessage(error))
    }
  }

  // Fineract rejects these outright, so catch them before the request goes out
  const validateGeneral = (): string | null => {
    if (!formData.officeId) {
      return 'Please select an office.'
    }
    if (!formData.firstname || !formData.lastname) {
      return 'Please enter a first name and a last name.'
    }
    if (formData.active && !formData.activationDate) {
      return 'Please enter an activation date, or uncheck Active.'
    }
    return null
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
      validate: validateGeneral,
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
