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
  CentersApi,
  CodesApi,
  CodeValuesApi,
  GroupsApi,
  type PostCentersCenterIdRequest,
} from '@/fineract-api'
import { todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  type ExtendedCenterResponse,
  type NarrationOption,
  type CenterApiErrorResponse,
  toDateInput,
} from './center-types'

const centersApi = new CentersApi(getConfiguration())
const groupsApi = new GroupsApi(getConfiguration())
const codesApi = new CodesApi(getConfiguration())
const codeValuesApi = new CodeValuesApi(getConfiguration())

/**
 * Closes an active center (POST /centers/{id}?command=close),
 * matching the "Close" action in Mifos X.
 */
const CloseCenters = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const [center, setCenter] = useState<ExtendedCenterResponse>()
  const [reasons, setReasons] = useState<NarrationOption[]>([])
  const [loadingReasons, setLoadingReasons] = useState(true)
  const [reasonsError, setReasonsError] = useState<string | null>(null)
  const [closureDate, setClosureDate] = useState(todayInputValue())
  const [closureReasonId, setClosureReasonId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const res = await centersApi.retrieveOne14(Number(id))
        setCenter(res.data as ExtendedCenterResponse)
      } catch (err) {
        console.error('Failed to fetch center', err)
        setError(t('errors.failedFetchCenter'))
      }
    }
    if (id) {
      fetchCenter()
    }
  }, [id, t])

  // Guard: only active centers can be closed. Redirect if center is not active or already closed.
  useEffect(() => {
    if (center) {
      const isActive =
        Boolean(center.active) ||
        center.status?.code === 'groupingStatusType.active' ||
        center.status?.description === 'Active'
      const isClosed =
        center.status?.code === 'groupingStatusType.closed' ||
        center.status?.description === 'Closed'
      if (!isActive || isClosed) {
        navigate(`/centers/${id}/general`, { replace: true })
      }
    }
  }, [center, id, navigate])

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        setLoadingReasons(true)
        setReasonsError(null)
        let reasonList: NarrationOption[] = []

        // 1. Try centers template
        try {
          const res = await centersApi.retrieveTemplate6(
            'close',
            undefined,
            undefined,
            {
              params: { commandParam: 'close' },
            }
          )
          const data = res.data as {
            closureReasons?: NarrationOption[]
            narrations?: NarrationOption[]
          }
          if (data?.closureReasons?.length) reasonList = data.closureReasons
          else if (data?.narrations?.length) reasonList = data.narrations
        } catch (e) {
          console.debug('Centers template closure reasons not available', e)
        }

        // 2. Try groups template (Fineract grouping domain)
        if (reasonList.length === 0) {
          try {
            const res = await groupsApi.retrieveTemplate7(
              undefined,
              true,
              Number(id),
              'close',
              undefined,
              { params: { commandParam: 'close' } }
            )
            const data = res.data as {
              closureReasons?: NarrationOption[]
              narrations?: NarrationOption[]
            }
            if (data?.closureReasons?.length) reasonList = data.closureReasons
            else if (data?.narrations?.length) reasonList = data.narrations
          } catch (e) {
            console.debug('Groups template closure reasons not available', e)
          }
        }

        // 3. Fallback to System Codes: CenterClosureReason -> GroupClosureReason -> CustomerClosureReasons
        if (reasonList.length === 0) {
          try {
            const codesRes = await codesApi.retrieveCodes()
            const allCodes = codesRes.data || []
            const targetCode =
              allCodes.find(c => c.name === 'CenterClosureReason') ||
              allCodes.find(c => c.name === 'GroupClosureReason') ||
              allCodes.find(c => c.name === 'CustomerClosureReasons')
            if (targetCode?.id) {
              const cvRes = await codeValuesApi.retrieveAllCodeValues(
                targetCode.id
              )
              if (cvRes.data && cvRes.data.length > 0) {
                reasonList = cvRes.data
                  .filter(cv => cv.id != null)
                  .map(cv => ({
                    id: cv.id!,
                    name: cv.name || cv.description || `Reason ${cv.id}`,
                    value: cv.name || cv.description,
                  }))
              }
            }
          } catch (e) {
            console.error('Failed to fetch codes API closure reasons', e)
            setReasonsError(t('close.errors.failedFetchReasons'))
          }
        }

        setReasons(reasonList)
      } catch (err) {
        console.error('Failed to fetch closure reasons', err)
        setReasonsError(t('close.errors.failedFetchReasons'))
      } finally {
        setLoadingReasons(false)
      }
    }
    fetchReasons()
  }, [id, t])

  const today = todayInputValue()
  // Fineract rejects a closure date before the center's activation/submission date
  const activatedOnDate =
    toDateInput(center?.timeline?.activatedOnDate) ||
    toDateInput(center?.activationDate)
  const submittedOnDate = toDateInput(center?.timeline?.submittedOnDate)
  const minDate = activatedOnDate || submittedOnDate

  const backToCenter = () => navigate(`/centers/${id}/general`)

  const validate = (): string | null => {
    if (!closureDate) return t('close.errors.dateRequired')
    if (closureDate > today) return t('close.errors.dateInFuture')
    if (minDate && closureDate < minDate) {
      return t('close.errors.dateBeforeActivated')
    }
    if (reasons.length > 0 && !closureReasonId) {
      return t('close.errors.reasonRequired')
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
      const payload: PostCentersCenterIdRequest = {
        closureDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      if (closureReasonId) {
        payload.closureReasonId = Number(closureReasonId)
      }
      await centersApi.activate2(Number(id), payload, 'close')
      const state: RouteSuccessState = {
        successMessage: t('success.centerClosed'),
      }
      navigate(`/centers/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<CenterApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedCloseCenter')
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
          { label: t('title'), href: '/centers' },
          {
            label: center?.name ?? '',
            href: `/centers/${id}/general`,
          },
          { label: t('close.breadcrumb'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('close.heading')}</h2>

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
                {reasons.length > 0
                  ? t('close.labelClosureReason')
                  : t('close.labelClosureReasonOptional')}
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
                      {reason.name || reason.value || reason.description}
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
                onClick={backToCenter}
                disabled={submitting}
              >
                {t('close.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={onSubmit}
                disabled={
                  !center ||
                  !closureDate ||
                  (reasons.length > 0 && !closureReasonId) ||
                  submitting ||
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

export default CloseCenters
