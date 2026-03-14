/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import AppTabs from '@/components/custom/tabs/AppTabs'
import { GroupsApi, type GetGroupsGroupIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { faCircle, faPeopleGroup } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const groupsApi = new GroupsApi(getConfiguration())

// TODO: wire this to your real auth/perm source
const granted = new Set<string>([
  'UPDATE_GROUP',
  'ASSOCIATECLIENTS_GROUP',
  'TRANSFERCLIENTS_GROUP',
  'CREATE_LOAN',
  'CREATE_SAVINGSACCOUNT',
  'CREATE_GSIMACCOUNT',
  'SAVEORUPDATEATTENDANCE_MEETING',
  'ASSIGNSTAFF_GROUP',
  'UNASSIGNSTAFF_GROUP',
  'CREATE_MEETING',
  'CLOSE_GROUP',
  'DELETE_GROUP',
])
const hasPerm = (p: string) => granted.has(p)

// status color helper
const statusColor = (v?: string) =>
  (
    ({
      Active: 'text-green-400',
      Pending: 'text-yellow-400',
      Inactive: 'text-orange-400',
      Closed: 'text-zinc-400',
    }) as const
  )[v ?? ''] ?? 'text-zinc-400'

const GroupsView = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation('groups')
  const { t: tc } = useTranslation('common')
  const [group, setGroup] = useState<GetGroupsGroupIdResponse>()

  useEffect(() => {
    ;(async () => {
      try {
        // bring all associations so we can gate menu items
        const res = await groupsApi.retrieveOne15(
          Number(id),
          undefined,
          undefined,
          {
            params: { associations: 'all' },
          }
        )
        setGroup(res.data)
      } catch (err) {
        console.error('Failed to fetch group', err)
      }
    })()
  }, [id])

  const isActive =
    (group as any)?.status?.value === 'Active' ||
    Boolean((group as any)?.active)
  const hasMembers =
    Array.isArray((group as any)?.clientMembers) &&
    (group as any).clientMembers.length > 0
  const hasCalendar = Boolean((group as any)?.collectionMeetingCalendar)
  const hasStaff = Boolean((group as any)?.staffId)
  const inCenter = Boolean((group as any)?.centerId)

  const menuOptions = useMemo(() => {
    const opts: any[] = []

    if (!isActive && hasPerm('UPDATE_GROUP')) {
      opts.push({
        label: t('view.menu.activate'),
        path: `groups/${group?.id}/actions/activate`,
      })
    }
    if (hasPerm('UPDATE_GROUP')) {
      opts.push({ label: t('view.menu.edit'), path: `groups/${group?.id}/edit` })
    }
    if (hasPerm('ASSOCIATECLIENTS_GROUP')) {
      opts.push({
        label: t('view.menu.transferClients'),
        path: `groups/${group?.id}/actions/transfer-clients`,
      })
    }
    if (hasPerm('TRANSFERCLIENTS_GROUP')) {
      opts.push({
        label: t('view.menu.manageMembers'),
        path: `groups/${group?.id}/actions/manage-members`,
      })
    }

    if (isActive) {
      const apps: any[] = []
      if (hasMembers && hasPerm('CREATE_LOAN')) {
        apps.push({
          label: t('view.menu.bulkJlgLoanApplication'),
          path: `groups/${group?.id}/loans-accounts/jlg-bulk-create`,
        })
      }
      if (hasPerm('CREATE_SAVINGSACCOUNT')) {
        apps.push({
          label: t('view.menu.groupSavingApplication'),
          path: `groups/${group?.id}/savings-accounts/create`,
        })
      }
      if (hasPerm('CREATE_LOAN')) {
        apps.push({
          label: t('view.menu.groupLoanApplication'),
          path: `groups/${group?.id}/loans-accounts/create`,
        })
      }
      if (hasMembers && hasPerm('CREATE_LOAN')) {
        apps.push({
          label: t('view.menu.glimApplication'),
          path: `groups/${group?.id}/loans-accounts/glim-account/create`,
        })
      }
      if (hasMembers && hasPerm('CREATE_GSIMACCOUNT')) {
        apps.push({
          label: t('view.menu.gsimApplication'),
          path: `groups/${group?.id}/savings-accounts/gsim-account/create`,
        })
      }
      if (apps.length) {
        opts.push({ label: t('view.menu.applications'), children: apps })
      }
    }

    const more: any[] = []
    if (hasCalendar && hasPerm('SAVEORUPDATEATTENDANCE_MEETING')) {
      more.push({
        label: t('view.menu.attendance'),
        path: `groups/${group?.id}/actions/attendance`,
      })
    }
    if (!hasStaff && hasPerm('ASSIGNSTAFF_GROUP')) {
      more.push({
        label: t('view.menu.assignStaff'),
        path: `groups/${group?.id}/actions/assign-staff`,
      })
    }
    if (hasStaff && hasPerm('UNASSIGNSTAFF_GROUP')) {
      more.push({
        label: t('view.menu.unassignStaff'),
        path: `groups/${group?.id}/actions/unassign-staff`,
      })
    }
    if (!inCenter && !hasCalendar && isActive && hasPerm('CREATE_MEETING')) {
      more.push({
        label: t('view.menu.attachMeeting'),
        path: `groups/${group?.id}/actions/attach-meeting`,
      })
    }
    if (hasPerm('CLOSE_GROUP')) {
      more.push({ label: t('view.menu.close'), path: `groups/${group?.id}/actions/close` })
    }
    if (hasPerm('DELETE_GROUP')) {
      more.push({
        label: t('view.menu.delete'),
        onClick: () => {
          if (confirm(t('view.confirmDelete'))) {
            // wire your delete call here
          }
        },
      })
    }
    if (more.length) {
      opts.push({ label: t('view.menu.more'), children: more })
    }

    return opts
  }, [group, isActive, hasMembers, hasCalendar, hasStaff, inCenter])

  // status value for tooltip + color
  const statusVal = (group as any)?.status?.value as string | undefined

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/groups' },
          {
            label: `${group?.name ?? ''}`,
            href: `/groups/${group?.id}/general`,
          },
          { label: t('view.tabs.general'), current: true },
        ]}
      />

      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          {/* ICON COLOR: white on blue header */}
          <FontAwesomeIcon
            icon={faPeopleGroup}
            className="text-white w-10 h-10"
          />

          <div className="text-xl font-semibold flex items-center gap-2">
            {/* STATUS DOT: dynamic color + tooltip */}
            <FontAwesomeIcon
              icon={faCircle}
              title={statusVal || tc('status.unknown')}
              className={`w-3 h-3 ${statusColor(statusVal)}`}
            />
            <span>{t('view.groupName')}</span>
          </div>
          <div>{t('view.missingInOpenAPI')}</div>
          <div>{t('view.centerName')} {group?.name}</div>
          <div>{t('view.staff')} {(group as any)?.staffName ?? t('view.missingInOpenAPI')}</div>
          <div>
            {t('view.activationDate')}{' '}
            {formatDate((group as any)?.timeline?.activationDate, i18n.language) || t('view.missingInOpenAPI')}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-end">
            <Dropdown
              name={
                <span className="flex items-center gap-2">
                  <Menu />
                </span>
              }
              options={menuOptions}
            />
          </div>

          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>{t('view.nextMeetingOn')} </div>
            <div>{t('view.meetingFrequency')} </div>
          </div>
        </div>
      </div>

      <AppTabs
        tabs={[
          { label: t('view.tabs.general'), href: `groups/${group?.id}/general` },
          { label: t('view.tabs.notes'), href: `groups/${group?.id}/notes` },
          { label: t('view.tabs.committee'), href: `groups/${group?.id}/committee` },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default GroupsView
