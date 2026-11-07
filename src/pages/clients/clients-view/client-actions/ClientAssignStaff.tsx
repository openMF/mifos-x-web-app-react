/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClientApi,
  type GetClientsClientIdResponse,
  type PostClientsClientIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type StaffOption = {
  id: number
  displayName: string
}

type ClientWithStaffTemplate = GetClientsClientIdResponse & {
  staffId?: number | null
  staffOptions?: Array<{
    id?: number
    displayName?: string
    firstname?: string
    lastname?: string
  }>
}

/**
 * Assigns a staff member to an existing client (POST /clients/{id}?command=assignStaff),
 * matching the "Assign Staff" action of the Angular web app.
 */
const ClientAssignStaff = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const clientId = Number(id)
  const isValidId = !Number.isNaN(clientId) && clientId > 0

  const [client, setClient] = useState<ClientWithStaffTemplate>()
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffId, setStaffId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClientAndStaff = async () => {
      if (!isValidId) {
        setError(t('assignStaff.errors.failedFetchClient'))
        setLoadingStaff(false)
        return
      }

      try {
        setLoadingStaff(true)
        const res = await clientApi.retrieveOne11(clientId, true, {
          params: { template: 'true' },
        })
        const data = res.data as ClientWithStaffTemplate
        setClient(data)

        const rawOptions = data?.staffOptions || []
        const normalized: StaffOption[] = rawOptions
          .filter(
            (opt): opt is { id: number; displayName: string } =>
              opt.id != null && Boolean(opt.displayName)
          )
          .map(opt => ({
            id: opt.id,
            displayName: opt.displayName,
          }))
        setStaffOptions(normalized)
      } catch (err) {
        console.error('Failed to fetch client and staff options', err)
        setError(t('assignStaff.errors.failedFetchClient'))
      } finally {
        setLoadingStaff(false)
      }
    }

    fetchClientAndStaff()
  }, [clientId, isValidId, t])

  const backToClient = () => navigate(`/clients/${id}/general`)

  const validate = (): string | null => {
    if (!isValidId || !client) return t('assignStaff.errors.failedFetchClient')
    if (!staffId) return t('assignStaff.errors.staffRequired')
    return null
  }

  const onSubmit = async () => {
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await clientApi.activate1(
        clientId,
        { staffId: Number(staffId) } as PostClientsClientIdRequest,
        'assignStaff'
      )
      const state: RouteSuccessState = {
        successMessage: t('success.staffAssigned'),
      }
      navigate(`/clients/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('assignStaff.errors.failedAssignStaff')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          {
            label: client?.displayName || '...',
            href: `/clients/${id}/general`,
          },
          { label: t('assignStaff.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            {t('assignStaff.title')}
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-sm font-medium">
                {t('assignStaff.labelStaff')}
              </Label>
              <Select
                value={staffId}
                disabled={loadingStaff || staffOptions.length === 0}
                onValueChange={val => {
                  setStaffId(val)
                  setError(null)
                }}
              >
                <SelectTrigger id="staff" className="w-full">
                  <SelectValue
                    placeholder={
                      loadingStaff
                        ? t('assignStaff.loadingStaff')
                        : staffOptions.length === 0
                          ? t('assignStaff.noStaffFound')
                          : t('assignStaff.selectStaff')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map(staff => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingStaff && staffOptions.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('assignStaff.noStaffAvailable')}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToClient}
                disabled={submitting}
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={!staffId || submitting || staffOptions.length === 0}
              >
                {t('assignStaff.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientAssignStaff
