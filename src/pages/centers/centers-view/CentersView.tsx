/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

import { CentersApi, type GetCentersCenterIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

/**
 * Extended interface to include fields returned by the Fineract API
 * but missing from the OpenAPI-generated GetCentersCenterIdResponse type.
 * See: ISSUES.md → Institution Centers → /centers/{id}/general
 */
interface ExtendedCenterResponse extends GetCentersCenterIdResponse {
  accountNo?: string
  externalId?: string
  activationDate?: number[]
}
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Building2, Menu } from 'lucide-react'
import AppTabs from '@/components/custom/tabs/AppTabs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date-utils'

// API instance
const centersApi = new CentersApi(getConfiguration())

// Permission checker (stub — replace with real implementation later)
const can = (_perm: string) => true

const CentersView = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  // State to hold center details
  const [center, setCenter] = useState<ExtendedCenterResponse>()
  const [fetchError, setFetchError] = useState(false)

  // Fetch center details on mount
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const res = await centersApi.retrieveOne14(Number(id))
        setCenter(res.data as ExtendedCenterResponse)
      } catch (err) {
        console.error('Failed to fetch center', err)
        setFetchError(true)
      }
    }
    fetchCenter()
  }, [id])

  // Handle delete action
  const handleDelete = async () => {
    try {
      await centersApi.delete10(Number(id))
      navigate('/centers')
    } catch (err) {
      console.log('Failed to delete center', err)
    }
  }

  // Loading / error states
  if (fetchError)
    return <div className="p-6 text-red-500">{t('failedToLoad')}</div>
  if (!center) return <div className="p-6">{tc('actions.loading')}</div>

  // Map backend status codes to Tailwind colors
  const statusVal = center.status?.code
  const statusColorMap: Record<string, string> = {
    'groupingStatusType.active': 'text-green-400',
    'groupingStatusType.pending': 'text-yellow-400',
    'groupingStatusType.inactive': 'text-orange-400',
    'groupingStatusType.closed': 'text-zinc-400',
  }
  const statusClass = statusColorMap[statusVal ?? ''] ?? 'text-zinc-400'

  // Derived flags
  const isActive = statusVal === 'Active'
  const isClosed = statusVal === 'Closed'
  const hasCal = !!(center as any)?.collectionMeetingCalendar // calendar check
  const hasStaff = !!(center as any)?.staffId // staff check

  // Dropdown menu options
  const menuOptions = [
    // Activate if not active
    ...(!isActive
      ? [
          {
            label: t('view.menu.activate'),
            onClick: () => alert(t('view.activateTodo')),
          },
        ]
      : []),

    // Edit allowed by permission
    ...(can('UPDATE_CENTER')
      ? [{ label: t('view.menu.edit'), path: `centers/${center.id}/edit` }]
      : []),

    // Group-related actions
    { label: t('view.menu.addGroup'), path: 'groups', disabled: true },
    { label: t('view.menu.manageGroups'), path: 'centers' },
    {
      label: t('view.menu.centersSavingApplication'),
      path: 'accounting',
      disabled: true,
    },

    // Nested "More" options
    {
      label: t('view.menu.more'),
      children: [
        // Attendance only if a calendar exists
        ...(hasCal ? [{ label: t('view.menu.attendance'), path: 'pdf' }] : []),

        // Assign/unassign staff
        ...(!hasStaff
          ? [{ label: t('view.menu.assignStaff'), path: 'email' }]
          : [{ label: t('view.menu.unassignStaff'), path: 'email' }]),

        // Delete only if active
        ...(isActive
          ? [
              {
                label: t('view.menu.delete'),
                onClick: () => {
                  if (confirm(t('view.confirmDelete'))) {
                    handleDelete()
                  }
                },
              },
            ]
          : []),

        // Always allow closing
        {
          label: t('view.menu.close'),
          path: `centers/${center.id}/actions/close`,
        },

        // Attach meeting only if active and no calendar yet
        ...(isActive && !hasCal
          ? [{ label: t('view.menu.attachMeeting'), path: 'meeting' }]
          : []),

        // Disabled history option
        {
          label: t('view.menu.staffAssignmentHistory'),
          path: 'email',
          disabled: true,
        },
      ],
    },
  ]

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/centers' },
          { label: String(center.name), href: `/centers/${id}` },
          { label: t('view.tabs.general'), current: true },
        ]}
      />

      {/* Header card with blue background */}
      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          {/* Icon */}
          <Building2 className="text-white w-10 h-10" />

          {/* Name + Status */}
          <div className="text-xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircle}
              title={statusVal || tc('status.unknown')}
              className={`${statusClass} w-3 h-3`}
            />
            <span>
              {t('view.centerName')} {center.name}
            </span>
          </div>

          {/* Info fields */}
          <div>
            {t('view.accountNo')} {center.accountNo ?? '—'}
          </div>
          <div>
            {t('view.office')} {center.officeName}
          </div>
          <div>
            {t('view.externalId')} {center.externalId ?? '—'}
          </div>
          <div>
            {t('view.activationDate')}{' '}
            {formatDate(center.activationDate, i18n.language)}
          </div>
        </div>

        <div className="flex flex-col h-full">
          {/* Dropdown only if not closed */}
          <div className="flex justify-end">
            {!isClosed && (
              <Dropdown
                name={
                  <span className="flex items-center gap-2">
                    <Menu />
                  </span>
                }
                options={menuOptions}
              />
            )}
          </div>

          {/* Meeting info */}
          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>
              {t('view.nextMeetingOn')} {t('view.missingInOpenAPI')}
            </div>
            <div>
              {t('view.meetingFrequency')} {t('view.missingInOpenAPI')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AppTabs
        tabs={[
          {
            label: t('view.tabs.general'),
            href: `centers/${center.id}/general`,
          },
          { label: t('view.tabs.notes'), href: `centers/${center.id}/notes` },
        ]}
      />

      {/* Content outlet */}
      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default CentersView
