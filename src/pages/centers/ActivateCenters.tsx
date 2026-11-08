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
import { CentersApi, type PostCentersCenterIdRequest } from '@/fineract-api'
import { todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  type ExtendedCenterResponse,
  type CenterApiErrorResponse,
  toDateInput,
} from './center-types'

const centersApi = new CentersApi(getConfiguration())

/**
 * Activates a pending center (POST /centers/{id}?command=activate),
 * matching the "Activate" action in Mifos X.
 */
const ActivateCenters = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const [center, setCenter] = useState<ExtendedCenterResponse>()
  const [activationDate, setActivationDate] = useState(todayInputValue())
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

  // Guard: if center is already active or closed, redirect to general view
  useEffect(() => {
    if (center) {
      const isActive =
        Boolean(center.active) ||
        center.status?.code === 'groupingStatusType.active' ||
        center.status?.description === 'Active'
      const isClosed =
        center.status?.code === 'groupingStatusType.closed' ||
        center.status?.description === 'Closed'
      if (isActive || isClosed) {
        navigate(`/centers/${id}/general`, { replace: true })
      }
    }
  }, [center, id, navigate])

  const today = todayInputValue()
  // Fineract rejects an activation date before the submitted on date
  const submittedOnDate = toDateInput(center?.timeline?.submittedOnDate)

  const backToCenter = () => navigate(`/centers/${id}/general`)

  const validate = (): string | null => {
    if (!activationDate) return t('activate.errors.dateRequired')
    if (activationDate > today) return t('activate.errors.dateInFuture')
    if (submittedOnDate && activationDate < submittedOnDate) {
      return t('activate.errors.dateBeforeSubmitted')
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
        activationDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      await centersApi.activate2(Number(id), payload, 'activate')
      const state: RouteSuccessState = {
        successMessage: t('success.centerActivated'),
      }
      navigate(`/centers/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<CenterApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedActivateCenter')
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
          { label: t('activate.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('activate.title')}</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="activationDate" className="text-sm font-medium">
                {t('activate.labelActivationDate')}
              </Label>
              <Input
                id="activationDate"
                type="date"
                required
                min={submittedOnDate || undefined}
                max={today}
                value={activationDate}
                onChange={e => {
                  setActivationDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToCenter}
                disabled={submitting}
              >
                {t('activate.cancel')}
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={!activationDate || submitting}
              >
                {t('activate.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivateCenters
