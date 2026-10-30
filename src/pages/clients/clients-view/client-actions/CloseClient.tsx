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
import {
  ClientApi,
  type GetClientsClientIdResponse,
  type PostClientsClientIdRequest,
} from '@/fineract-api'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type NarrationOption = {
  id: number
  name?: string
  value?: string
  description?: string
}

/**
 * Closes an active client (POST /clients/{id}?command=close), matching the
 * "Close" action of the Angular web app.
 */
const CloseClient = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [reasons, setReasons] = useState<NarrationOption[]>([])
  const [loadingReasons, setLoadingReasons] = useState(true)
  const [reasonsError, setReasonsError] = useState<string | null>(null)
  const [closureDate, setClosureDate] = useState(todayInputValue())
  const [closureReasonId, setClosureReasonId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await clientApi.retrieveOne11(Number(id))
        setClient(res.data)
      } catch (err) {
        console.error('Failed to fetch client', err)
        setError(t('errors.failedFetchClient'))
      }
    }
    if (id) {
      fetchClient()
    }
  }, [id, t])

  // Guard: only active clients (status 300) can be closed. Redirect if opened directly.
  useEffect(() => {
    if (client && client.status?.id !== 300) {
      navigate(`/clients/${id}/general`, { replace: true })
    }
  }, [client, id, navigate])

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        setLoadingReasons(true)
        setReasonsError(null)
        const res = await clientApi.retrieveTemplate5(undefined, 'close')
        const templateData = res.data as { narrations?: NarrationOption[] }
        if (templateData?.narrations) {
          setReasons(templateData.narrations)
        }
      } catch (err) {
        console.error('Failed to fetch closure reasons', err)
        setReasonsError(t('close.errors.failedFetchReasons'))
      } finally {
        setLoadingReasons(false)
      }
    }
    fetchReasons()
  }, [t])

  const today = todayInputValue()
  // Fineract rejects a closure date before the client's activation/submission date
  const activatedOnDate = dateArrayToInputValue(
    client?.timeline?.activatedOnDate as number[] | undefined
  )
  const submittedOnDate = dateArrayToInputValue(
    client?.timeline?.submittedOnDate as number[] | undefined
  )
  const minDate = activatedOnDate || submittedOnDate

  const backToClient = () => navigate(`/clients/${id}/general`)

  const validate = (): string | null => {
    if (!closureDate) return t('close.errors.dateRequired')
    if (closureDate > today) return t('close.errors.dateInFuture')
    if (minDate && closureDate < minDate) {
      return t('close.errors.dateBeforeActivated')
    }
    if (!closureReasonId) return t('close.errors.reasonRequired')
    return null
  }

  const onSubmit = async () => {
    if (!client || client.status?.id !== 300) {
      return
    }
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await clientApi.activate1(
        Number(id),
        {
          closureDate,
          closureReasonId: Number(closureReasonId),
          dateFormat: 'yyyy-MM-dd',
          locale: 'en',
        } as PostClientsClientIdRequest,
        'close'
      )
      const state: RouteSuccessState = {
        successMessage: t('success.clientClosed'),
      }
      navigate(`/clients/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedCloseClient')
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
          { label: t('view.menu.close'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('close.title')}</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="closureDate" className="text-sm font-medium">
                {t('close.labelClosedOnDate')}
              </Label>
              <Input
                id="closureDate"
                type="date"
                required
                min={minDate || undefined}
                max={today}
                value={closureDate}
                onChange={e => {
                  setClosureDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closureReason" className="text-sm font-medium">
                {t('close.labelClosureReason')}
              </Label>
              <Select
                value={closureReasonId}
                disabled={
                  (!loadingReasons && reasons.length === 0) ||
                  Boolean(reasonsError)
                }
                onValueChange={val => {
                  setClosureReasonId(val)
                  setError(null)
                }}
              >
                <SelectTrigger id="closureReason" className="w-full">
                  <SelectValue
                    placeholder={
                      !loadingReasons && !reasonsError && reasons.length === 0
                        ? t('close.noReasonsFound')
                        : t('close.selectClosureReason')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map(reason => (
                    <SelectItem key={reason.id} value={String(reason.id)}>
                      {reason.name || reason.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingReasons && !reasonsError && reasons.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('close.noReasonsAvailable')}
                </p>
              )}
            </div>

            {(error || reasonsError) && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error || reasonsError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToClient}
                disabled={submitting}
              >
                {t('close.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={onSubmit}
                disabled={
                  !client ||
                  client.status?.id !== 300 ||
                  !closureDate ||
                  !closureReasonId ||
                  submitting ||
                  reasons.length === 0 ||
                  Boolean(reasonsError)
                }
              >
                {t('close.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CloseClient
