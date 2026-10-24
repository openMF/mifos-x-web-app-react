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
import { GroupsApi } from '@/fineract-api'
import type {
  ActivateGroupRequest,
  ExtendedGroupResponse,
} from '@/pages/groups/types'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const groupsApi = new GroupsApi(getConfiguration())

type GroupApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * Parses a submittedOnDate that may be returned by Fineract as either a
 * date array [year, month, day] or an ISO/date string.
 */
const parseSubmittedOnDate = (date?: string | number[] | null): string => {
  if (!date) return ''
  if (Array.isArray(date)) return dateArrayToInputValue(date)
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  return ''
}

/**
 * Activates a pending group (POST /groups/{id}?command=activate), the
 * "Activate" action of the Mifos web app.
 */
const ActivateGroup = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  const groupId = Number(id)
  const isValidId = !Number.isNaN(groupId) && groupId > 0

  const [group, setGroup] = useState<ExtendedGroupResponse>()
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activationDate, setActivationDate] = useState(todayInputValue())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchGroup = async () => {
      setGroup(undefined)
      if (!isValidId) {
        setFetchError(t('errors.failedFetchGroup'))
        setLoadingGroup(false)
        return
      }
      try {
        setLoadingGroup(true)
        setFetchError(null)
        const res = await groupsApi.retrieveOne15(groupId)
        setGroup(res.data as ExtendedGroupResponse)
      } catch (err) {
        console.error('Failed to fetch group', err)
        setFetchError(t('errors.failedFetchGroup'))
      } finally {
        setLoadingGroup(false)
      }
    }
    fetchGroup()
  }, [groupId, isValidId, t])

  // Guard: activation is only valid for Pending groups. Redirect if already active/closed.
  useEffect(() => {
    if (group && group.status?.value && group.status.value !== 'Pending') {
      navigate(`/groups/${id}/general`, { replace: true })
    }
  }, [group, id, navigate])

  const today = todayInputValue()
  // Fineract rejects an activation date before the submitted on date
  const submittedOnDate = parseSubmittedOnDate(group?.timeline?.submittedOnDate)

  const backToGroup = () => {
    if (isValidId) {
      navigate(`/groups/${id}/general`)
    } else {
      navigate('/groups')
    }
  }

  const validate = (): string | null => {
    if (fetchError || !group) return t('errors.failedFetchGroup')
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
      const payload: ActivateGroupRequest = {
        activationDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      await groupsApi.activateOrGenerateCollectionSheet(
        groupId,
        payload,
        'activate'
      )
      const state: RouteSuccessState = {
        successMessage: t('success.groupActivated'),
      }
      navigate(`/groups/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<GroupApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('errors.failedActivateGroup')
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
          { label: t('title'), href: '/groups' },
          {
            label: group?.name ?? '',
            href: `/groups/${id}/general`,
          },
          { label: t('activate.title'), current: true },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('activate.title')}</h2>

          {loadingGroup ? (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {tc('actions.loading')}
            </div>
          ) : fetchError ? (
            <div className="space-y-6">
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {fetchError}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={backToGroup}>
                  {t('activate.cancel')}
                </Button>
              </div>
            </div>
          ) : (
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

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={backToGroup}
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
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivateGroup
