/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faCircle } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { StaffApi, type StaffData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

interface StaffNavigationProps {
  staffId: number
}
const staffApi = new StaffApi(getConfiguration())

const StaffNavigation = ({ staffId }: StaffNavigationProps) => {
  const [staff, setStaff] = useState<StaffData | null>(null)
  const { t, i18n } = useTranslation('common')

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const res = await staffApi.retrieveOne8(staffId)
        setStaff(res.data)
      } catch (err) {
        console.error('Failed to fetch staff details', err)
      }
    }

    if (staffId) fetchStaffDetails()
  }, [staffId])

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString))

  if (!staff)
    return (
      <p className="text-gray-500">{t('navigation.loadingStaffDetails')}</p>
    )

  const dummyCenterCount = 3

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <FontAwesomeIcon
          icon={faUser}
          size="2x"
          className="text-gray-700 dark:text-gray-200"
        />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {staff.displayName}
            <FontAwesomeIcon
              icon={faCircle}
              className={staff.isActive ? 'text-green-500' : 'text-red-500'}
              title={staff.isActive ? 'Active' : 'Inactive'}
            />
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('navigation.associatedOffice')}: {staff.officeName}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="font-medium">{t('navigation.joinedOn')}:</div>
        <div>{formatDate(staff.joiningDate ?? '')}</div>

        <div className="font-medium">{t('navigation.loanOfficer')}:</div>
        <div>{staff.isLoanOfficer ? t('actions.yes') : t('actions.no')}</div>

        <div className="font-medium">{t('navigation.mobileNumber')}:</div>
        <div>{staff.mobileNo}</div>

        <div className="font-medium">{t('navigation.numberOfCenters')}:</div>
        <div>{dummyCenterCount}</div>
      </div>
    </div>
  )
}

export default StaffNavigation
