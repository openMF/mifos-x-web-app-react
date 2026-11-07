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

/** Fineract sends the client's staff; the generated type leaves it out (see ISSUES.md) */
type ClientWithStaff = GetClientsClientIdResponse & {
  staffId?: number | null
  staffName?: string | null
}

/**
 * Removes the staff member assigned to a client (POST /clients/{id}?command=unassignStaff),
 * matching the "Unassign Staff" action of the Angular web app.
 */
const ClientUnassignStaff = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const clientId = Number(id)
  const isValidId = !Number.isNaN(clientId) && clientId > 0

  const [client, setClient] = useState<ClientWithStaff>()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // The client id this page is showing; null once the user has left the page
  const activeClientIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Drop the previous client when the route id changes, and ignore a
    // response that arrives after the id has changed again
    let cancelled = false
    activeClientIdRef.current = clientId
    setClient(undefined)
    setError(null)

    const fetchClient = async () => {
      if (!isValidId) {
        setError(t('unassignStaff.errors.failedFetchClient'))
        return
      }

      try {
        const res = await clientApi.retrieveOne11(clientId)
        if (!cancelled) setClient(res.data as ClientWithStaff)
      } catch (err) {
        console.error('Failed to fetch client', err)
        if (!cancelled) setError(t('unassignStaff.errors.failedFetchClient'))
      }
    }

    fetchClient()
    return () => {
      cancelled = true
      activeClientIdRef.current = null
    }
  }, [clientId, isValidId, t])

  // Only the client loaded for the current route id can be submitted
  const loadedClient = client?.id === clientId ? client : undefined

  // Guard: a client with no staff has nothing to unassign. Redirect if opened directly.
  useEffect(() => {
    if (loadedClient && loadedClient.staffId == null) {
      navigate(`/clients/${id}/general`, { replace: true })
    }
  }, [loadedClient, id, navigate])

  const backToClient = () => navigate(`/clients/${id}/general`)

  const onSubmit = async () => {
    if (!loadedClient || loadedClient.staffId == null) {
      setError(t('unassignStaff.errors.failedFetchClient'))
      return
    }

    // Ignore the result if the user has left this client's page by then
    const submittedClientId = clientId
    const stillOnPage = () => activeClientIdRef.current === submittedClientId

    setSubmitting(true)
    setError(null)
    try {
      await clientApi.activate1(
        submittedClientId,
        { staffId: loadedClient.staffId } as PostClientsClientIdRequest,
        'unassignStaff'
      )
      if (!stillOnPage()) return
      const state: RouteSuccessState = {
        successMessage: t('success.staffUnassigned'),
      }
      navigate(`/clients/${submittedClientId}/general`, { state })
    } catch (err) {
      if (!stillOnPage()) return
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('unassignStaff.errors.failedUnassignStaff')
      )
    } finally {
      if (stillOnPage()) setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          {
            label: loadedClient?.displayName || '...',
            href: `/clients/${id}/general`,
          },
          { label: t('unassignStaff.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            {t('unassignStaff.title')}
          </h2>

          <div className="space-y-6">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {t('unassignStaff.confirmMessage', {
                staff: loadedClient?.staffName || '—',
              })}
            </p>

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
                variant="destructive"
                onClick={onSubmit}
                disabled={
                  !loadedClient || loadedClient.staffId == null || submitting
                }
              >
                {t('unassignStaff.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientUnassignStaff
