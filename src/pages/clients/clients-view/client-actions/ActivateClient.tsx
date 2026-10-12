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
import { ClientApi, type GetClientsClientIdResponse } from '@/fineract-api'
import { dateArrayToInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientApi = new ClientApi(getConfiguration())

/** Today as yyyy-MM-dd in local time, the form's dateFormat */
const todayInputValue = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * Activates a pending client (POST /clients/{id}?command=activate), the
 * "Activate" action of the Angular web app.
 */
const ActivateClient = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const [activationDate, setActivationDate] = useState(todayInputValue())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await clientApi.retrieveOne11(Number(id))
        setClient(res.data)
      } catch (err) {
        console.error('Failed to fetch client', err)
      }
    }
    fetchClient()
  }, [id])

  const today = todayInputValue()
  // Fineract rejects an activation date before the submitted on date
  const submittedOnDate = dateArrayToInputValue(
    client?.timeline?.submittedOnDate as number[] | undefined
  )

  const backToClient = () => navigate(`/clients/${id}/general`)

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
      await clientApi.activate1(
        Number(id),
        { activationDate, dateFormat: 'yyyy-MM-dd', locale: 'en' },
        'activate'
      )
      const state: RouteSuccessState = {
        successMessage: t('success.clientActivated'),
      }
      navigate(`/clients/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedActivateClient')
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
              <Button variant="outline" onClick={backToClient}>
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

export default ActivateClient
