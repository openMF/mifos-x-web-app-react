/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faCircle } from '@fortawesome/free-solid-svg-icons'
import { GroupsApi, type GetGroupsGroupIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

const groupApi = new GroupsApi(getConfiguration())

interface GroupNavigationProps {
  groupId: number
}

const GroupNavigation = ({ groupId }: GroupNavigationProps) => {
  const [groupDetails, setGroupDetails] =
    useState<GetGroupsGroupIdResponse | null>(null)
  const { t, i18n } = useTranslation('common')

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await groupApi.retrieveOne15(groupId)
        setGroupDetails(res.data)
      } catch (err) {
        console.error('Error fetching group data:', err)
      }
    }

    fetchGroup()
  }, [groupId])

  if (!groupDetails) {
    return (
      <p className="text-gray-500">{t('navigation.loadingGroupDetails')}</p>
    )
  }

  const extra = groupDetails as any

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <FontAwesomeIcon
          icon={faUsers}
          size="2x"
          className="text-gray-700 dark:text-gray-200"
        />
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {groupDetails.name}
            <FontAwesomeIcon
              icon={faCircle}
              className={
                extra.status?.code === 'groupingStatusType.active'
                  ? 'text-green-500'
                  : 'text-gray-400'
              }
              title={extra.status?.description}
            />
          </h2>
          <p className="text-gray-500">
            {t('fields.accountNo')}:{' '}
            <span className="font-medium">
              {extra.accountNo || t('actions.na')}
            </span>{' '}
            |{t('fields.externalId')}:{' '}
            <span className="font-medium">
              {extra.externalId || t('actions.na')}
            </span>
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-y-3">
        <div className="font-medium">{t('navigation.activationDate')}:</div>
        <div>{formatDate(extra.activationDate, i18n.language)}</div>

        <div className="font-medium">{t('navigation.associatedOfficer')}:</div>
        <div>{extra.staffName || t('actions.na')}</div>

        <div className="font-medium">{t('navigation.associatedCenter')}:</div>
        <div>{extra.centerName || t('actions.na')}</div>

        <div className="font-medium">{t('navigation.nextMeetingDate')}:</div>
        <div>{formatDate(extra.nextMeetingDate, i18n.language)}</div>

        <div className="font-medium">{t('navigation.meetingFrequency')}:</div>
        <div>{extra.meetingFrequency || t('actions.na')}</div>

        <div className="font-medium">{t('navigation.numberOfClients')}:</div>
        <div>{extra.clientMembers?.length ?? t('actions.na')}</div>
      </div>
    </div>
  )
}

export default GroupNavigation

function formatDate(date?: string, locale: string = 'en-GB') {
  if (!date) return 'N/A'
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return 'Invalid Date'
  }
}
