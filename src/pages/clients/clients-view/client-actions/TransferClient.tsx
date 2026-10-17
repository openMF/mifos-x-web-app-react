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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ClientApi,
  OfficesApi,
  type GetClientsClientIdResponse,
  type GetOfficesResponse,
  type PostClientsClientIdRequest,
} from '@/fineract-api'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())

/**
 * OpenAPI schema defines PostClientsClientIdRequest with only activation fields.
 * Fineract's proposeTransfer command requires destinationOfficeId and transferDate.
 */
interface PostClientsClientIdTransferRequest extends PostClientsClientIdRequest {
  destinationOfficeId: number
  transferDate: string
  note?: string
}

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * Transfers an active client to another office (POST /clients/{id}?command=proposeTransfer),
 * matching the shared client actions style and components.
 */
const TransferClient = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const clientId = Number(id)
  const isValidId = !Number.isNaN(clientId) && clientId > 0

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [loadingClient, setLoadingClient] = useState(true)
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [loadingOffices, setLoadingOffices] = useState(true)
  const [officesFetchSuccess, setOfficesFetchSuccess] = useState(false)
  const [destinationOfficeId, setDestinationOfficeId] = useState<string>('')
  // Date is not set by default; user chooses manually
  const [transferDate, setTransferDate] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClient = async () => {
      if (!isValidId) {
        setError(t('errors.failedFetchClient'))
        setLoadingClient(false)
        return
      }
      try {
        setLoadingClient(true)
        const res = await clientApi.retrieveOne11(clientId)
        setClient(res.data)
      } catch (err) {
        console.error('Failed to fetch client', err)
        setError(t('errors.failedFetchClient'))
      } finally {
        setLoadingClient(false)
      }
    }
    fetchClient()
  }, [clientId, isValidId, t])

  // Guard: only active clients (status 300) can be transferred. Redirect if opened directly.
  useEffect(() => {
    if (client && client.status?.id !== 300) {
      navigate(`/clients/${id}/general`, { replace: true })
    }
  }, [client, id, navigate])

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        setLoadingOffices(true)
        const res = await officesApi.retrieveOffices()
        setOffices(res.data || [])
        setOfficesFetchSuccess(true)
      } catch (err) {
        console.error('Failed to fetch offices', err)
        setError(t('transfer.errors.failedFetchOffices'))
        setOfficesFetchSuccess(false)
      } finally {
        setLoadingOffices(false)
      }
    }
    fetchOffices()
  }, [t])

  const today = todayInputValue()
  const activatedOnDate = dateArrayToInputValue(
    client?.timeline?.activatedOnDate as number[] | undefined
  )
  const submittedOnDate = dateArrayToInputValue(
    client?.timeline?.submittedOnDate as number[] | undefined
  )
  const minDate = activatedOnDate || submittedOnDate

  // Filter out the client's current office from destination choices
  const availableOffices = client?.officeId
    ? offices.filter(o => o.id !== client.officeId)
    : offices

  const backToClient = () => navigate(`/clients/${id}/general`)

  const validate = (): string | null => {
    if (!isValidId || !client) return t('errors.failedFetchClient')
    if (!destinationOfficeId) return t('transfer.errors.officeRequired')
    if (client?.officeId && Number(destinationOfficeId) === client.officeId) {
      return t('transfer.errors.destinationSameAsCurrent')
    }
    if (!transferDate) return t('transfer.errors.dateRequired')
    if (transferDate > today) return t('transfer.errors.dateInFuture')
    if (minDate && transferDate < minDate) {
      return t('transfer.errors.dateBeforeActivated')
    }
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
      const payload: PostClientsClientIdTransferRequest = {
        destinationOfficeId: Number(destinationOfficeId),
        transferDate,
        note: note.trim() || undefined,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      await clientApi.activate1(
        clientId,
        payload as PostClientsClientIdRequest,
        'proposeTransfer'
      )
      const state: RouteSuccessState = {
        successMessage: t('success.clientTransferProposed'),
      }
      navigate(`/clients/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedTransferClient')
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
            label: client?.displayName ?? '',
            href: `/clients/${id}/general`,
          },
          { label: t('transfer.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('transfer.title')}</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="destinationOffice"
                className="text-sm font-medium"
              >
                {t('transfer.office')}
              </Label>
              <Select
                value={destinationOfficeId}
                disabled={
                  loadingOffices ||
                  !officesFetchSuccess ||
                  availableOffices.length === 0
                }
                onValueChange={val => {
                  setDestinationOfficeId(val)
                  setError(null)
                }}
              >
                <SelectTrigger id="destinationOffice" className="w-full">
                  <SelectValue
                    placeholder={
                      !loadingOffices &&
                      officesFetchSuccess &&
                      availableOffices.length === 0
                        ? t('transfer.noOfficesFound')
                        : t('transfer.selectOffice')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableOffices.map(office => (
                    <SelectItem key={office.id} value={String(office.id)}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingOffices &&
                officesFetchSuccess &&
                availableOffices.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {t('transfer.noOfficesAvailable')}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferDate" className="text-sm font-medium">
                {t('transfer.transferDate')}
              </Label>
              <Input
                id="transferDate"
                type="date"
                required
                min={minDate || undefined}
                max={today}
                value={transferDate}
                onChange={e => {
                  setTransferDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium">
                {t('transfer.note')}
              </Label>
              <Textarea
                id="note"
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={backToClient}
                disabled={submitting}
              >
                {t('transfer.cancel')}
              </Button>
              <Button
                type="button"
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={
                  loadingClient ||
                  !isValidId ||
                  !client ||
                  !destinationOfficeId ||
                  !transferDate ||
                  submitting ||
                  availableOffices.length === 0
                }
              >
                {t('transfer.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferClient
