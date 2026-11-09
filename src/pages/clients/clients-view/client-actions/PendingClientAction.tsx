/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
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

type PendingClientPayload = PostClientsClientIdRequest & {
  rejectionDate?: string
  rejectionReasonId?: number
  withdrawalDate?: string
  withdrawalReasonId?: number
}

interface PendingClientActionProps {
  command: 'reject' | 'withdraw'
  dateField: 'rejectionDate' | 'withdrawalDate'
  reasonField: 'rejectionReasonId' | 'withdrawalReasonId'
  title: string
  dateLabel: string
  reasonLabel: string
  selectReasonPlaceholder: string
  noReasonsFound: string
  noReasonsAvailable: string
  dateRequiredError: string
  dateInFutureError: string
  dateBeforeSubmittedError: string
  reasonRequiredError: string
  failedFetchReasonsError: string
  cancelLabel: string
  confirmLabel: string
  failedSubmitError: string
  successMessage: string
}

/**
 * Shared component for pending client lifecycle actions (reject, withdraw).
 */
const PendingClientAction = ({
  command,
  dateField,
  reasonField,
  title,
  dateLabel,
  reasonLabel,
  selectReasonPlaceholder,
  noReasonsFound,
  noReasonsAvailable,
  dateRequiredError,
  dateInFutureError,
  dateBeforeSubmittedError,
  reasonRequiredError,
  failedFetchReasonsError,
  cancelLabel,
  confirmLabel,
  failedSubmitError,
  successMessage,
}: PendingClientActionProps) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [reasons, setReasons] = useState<NarrationOption[]>([])
  const [loadingReasons, setLoadingReasons] = useState(true)
  const [reasonsError, setReasonsError] = useState<string | null>(null)
  const [actionDate, setActionDate] = useState(todayInputValue())
  const [reasonId, setReasonId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isCurrentRef = useRef(true)

  useEffect(() => {
    isCurrentRef.current = true
    return () => {
      isCurrentRef.current = false
    }
  }, [id])

  useEffect(() => {
    let stale = false
    setClient(undefined)
    setError(null)
    setActionDate(todayInputValue())
    setReasonId('')
    setSubmitting(false)

    const fetchClient = async () => {
      try {
        const res = await clientApi.retrieveOne11(Number(id))
        if (!stale) {
          setClient(res.data)
        }
      } catch (err) {
        if (!stale) {
          console.error('Failed to fetch client', err)
          setError(t('errors.failedFetchClient'))
        }
      }
    }
    if (id) {
      fetchClient()
    }

    return () => {
      stale = true
    }
  }, [id, t])

  // Guard: only pending clients (status 100) can be rejected or withdrawn. Redirect if opened directly.
  useEffect(() => {
    if (client && client.id === Number(id) && client.status?.id !== 100) {
      navigate(`/clients/${id}/general`, { replace: true })
    }
  }, [client, id, navigate])

  useEffect(() => {
    let stale = false

    const fetchReasons = async () => {
      try {
        setLoadingReasons(true)
        setReasonsError(null)
        const res = await clientApi.retrieveTemplate5(undefined, command)
        const templateData = res.data as { narrations?: NarrationOption[] }
        if (!stale) {
          setReasons(templateData.narrations ?? [])
        }
      } catch (err) {
        if (!stale) {
          console.error(`Failed to fetch ${command} reasons`, err)
          setReasons([])
          setReasonsError(failedFetchReasonsError)
        }
      } finally {
        if (!stale) {
          setLoadingReasons(false)
        }
      }
    }
    fetchReasons()

    return () => {
      stale = true
    }
  }, [command, failedFetchReasonsError])

  const today = todayInputValue()
  // Fineract rejects an action date before the client's submitted date
  const submittedOnDate = dateArrayToInputValue(
    client?.timeline?.submittedOnDate as number[] | undefined
  )
  const minDate = submittedOnDate

  const backToClient = () => navigate(`/clients/${id}/general`)

  const validate = (): string | null => {
    if (!actionDate) return dateRequiredError
    if (actionDate > today) return dateInFutureError
    if (minDate && actionDate < minDate) {
      return dateBeforeSubmittedError
    }
    if (!reasonId) return reasonRequiredError
    return null
  }

  const onSubmit = async () => {
    if (!client || client.id !== Number(id) || client.status?.id !== 100) {
      return
    }
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setSubmitting(true)
    setError(null)
    const targetId = id
    try {
      const payload: PendingClientPayload = {
        [dateField]: actionDate,
        [reasonField]: Number(reasonId),
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      await clientApi.activate1(Number(targetId), payload, command)
      if (!isCurrentRef.current || targetId !== id) {
        return
      }
      const state: RouteSuccessState = {
        successMessage,
      }
      navigate(`/clients/${targetId}/general`, { state })
    } catch (err) {
      if (!isCurrentRef.current || targetId !== id) {
        return
      }
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          failedSubmitError
      )
    } finally {
      if (isCurrentRef.current && targetId === id) {
        setSubmitting(false)
      }
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
          { label: title, current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{title}</h2>

          <form
            className="space-y-6"
            onSubmit={e => {
              e.preventDefault()
              onSubmit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={dateField} className="text-sm font-medium">
                {dateLabel}
              </Label>
              <Input
                id={dateField}
                type="date"
                required
                min={minDate || undefined}
                max={today}
                value={actionDate}
                onChange={e => {
                  setActionDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonField} className="text-sm font-medium">
                {reasonLabel}
              </Label>
              <Select
                value={reasonId}
                disabled={
                  (!loadingReasons && reasons.length === 0) ||
                  Boolean(reasonsError)
                }
                onValueChange={val => {
                  setReasonId(val)
                  setError(null)
                }}
              >
                <SelectTrigger id={reasonField} className="w-full">
                  <SelectValue
                    placeholder={
                      !loadingReasons && !reasonsError && reasons.length === 0
                        ? noReasonsFound
                        : selectReasonPlaceholder
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
                  {noReasonsAvailable}
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
                type="button"
                variant="outline"
                onClick={backToClient}
                disabled={submitting}
              >
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  !client ||
                  client.id !== Number(id) ||
                  client.status?.id !== 100 ||
                  !actionDate ||
                  !reasonId ||
                  submitting ||
                  reasons.length === 0 ||
                  Boolean(reasonsError)
                }
              >
                {confirmLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PendingClientAction
