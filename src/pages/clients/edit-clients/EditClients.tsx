/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  ClientApi,
  type GetClientsClientIdResponse,
  type PutClientsClientIdRequest,
} from '@/fineract-api'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const clientApi = new ClientApi(getConfiguration())

const StaticField = ({
  label,
  value,
  missing = false,
}: {
  label: string
  value?: string | number
  missing?: boolean
}) => {
  const { t } = useTranslation('clients')

  return (
    <div className="w-full md:w-[48%] space-y-2">
      <Label>{label}</Label>
      <div
        className={`w-full rounded-md border border-input px-3 py-2 text-sm bg-muted/40 ${
          missing
            ? 'italic text-muted-foreground'
            : 'text-zinc-700 dark:text-zinc-300'
        }`}
      >
        {missing ? t('view.missingInOpenAPI') : (value ?? '—')}
      </div>
    </div>
  )
}

const EditClients = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const clientId = Number(id)

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [formData, setFormData] = useState<PutClientsClientIdRequest>({})

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await clientApi.retrieveOne11(clientId)
        setClient(response.data)
        setFormData({ externalId: response.data.externalId })
      } catch (err) {
        console.log('Failed to fetch client: ', err)
      }
    }
    fetchClient()
  }, [clientId])

  const handleSubmit = async () => {
    try {
      await clientApi.update10(clientId, formData)
      navigate(`/clients/${clientId}`)
    } catch (error) {
      console.error('Error while submitting', error)
    }
  }

  if (!client) {
    return <div className="text-center py-10">{t('form.loadingClient')}</div>
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: tc('nav.home'), href: '/home' },
            { label: t('title'), href: '/clients' },
            {
              label: client.displayName ?? t('client'),
              href: `/clients/${clientId}`,
            },
            { label: tc('actions.edit'), current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">{t('form.editTitle')}</h1>

        <div className="flex flex-col gap-8">
          {/*Office, Legal Form, Account No, External Id */}
          <div className="flex flex-wrap gap-6">
            <StaticField
              label={`${t('form.labelOffice')}*`}
              value={client.officeName}
            />
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelLegalForm')} missing />
            <StaticField
              label={t('form.labelAccountNo')}
              value={client.accountNo}
            />
            <div className="w-full md:w-[48%] space-y-2">
              <Label htmlFor="externalId">{t('form.labelExternalId')}</Label>
              <Input
                id="externalId"
                value={formData.externalId ?? ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    externalId: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>

          {/* First, Middle, Last Name */}
          <div className="flex flex-wrap gap-6">
            <StaticField
              label={`${t('form.labelFirstName')}*`}
              value={client.firstname}
            />
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelMiddleName')} missing />
            <StaticField
              label={`${t('form.labelLastName')}*`}
              value={client.lastname}
            />
          </div>

          {/* Date of Birth, Gender */}
          <div className="flex flex-wrap gap-6">
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelDateOfBirth')} missing />
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelGender')} missing />
          </div>

          {/* Staff, Is staff? */}
          <div className="flex flex-wrap gap-6 items-end">
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelStaff')} missing />
            <div className="w-full md:w-[48%] flex items-center gap-2">
              <Checkbox id="isStaff" disabled />
              <Label
                htmlFor="isStaff"
                className="text-muted-foreground font-normal"
              >
                {t('form.labelIsStaff')}
              </Label>
            </div>
          </div>

          {/*Mobile No, Email Address */}
          <div className="flex flex-wrap gap-6">
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelMobileNo')} missing />
            <StaticField
              label={t('form.labelEmailAddress')}
              value={client.emailAddress}
            />
          </div>

          {/*Client Type, Client Classification */}
          <div className="flex flex-wrap gap-6">
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelClientType')} missing />
            {/* Missing in OpenAPI */}
            <StaticField label={t('form.labelClientClassification')} missing />
          </div>

          {/* Submitted On, Activated On */}
          <div className="flex flex-wrap gap-6">
            {/* Missing in OpenAPI */}
            <StaticField label={`${t('form.labelSubmittedOn')}*`} missing />
            <StaticField
              label={t('form.labelActivatedOn')}
              value={client.activationDate}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <Button
            variant="outline"
            onClick={() => navigate(`/clients/${clientId}`)}
          >
            {tc('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{tc('actions.submit')}</Button>
        </div>
      </div>
    </div>
  )
}

export default EditClients
