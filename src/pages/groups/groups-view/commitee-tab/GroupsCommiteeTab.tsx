/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const GroupsCommitteeTab = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('groups')

  // Navigate to "add-role" sub-route when button clicked
  const handleClick = () => {
    navigate('add-role')
  }

  return (
    <div className="text-black dark:text-white px-6 py-4 space-y-4">
      {/* Header section with title and Add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t('committee.heading')}</h2>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          onClick={handleClick}
        >
          {t('committee.addButton')}
        </Button>
      </div>

      {/* Divider */}
      <hr className="border-gray-400 dark:border-white" />

      <div className="space-y-4"></div>
    </div>
  )
}

export default GroupsCommitteeTab
