/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ClientsDocumentsTab = () => {
  const { groupId, loanId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')

  return (
    <div className="bg-transparent">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {t('documents.heading')}
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={() =>
            navigate(
              `/groups/${groupId}/loans-accounts/${loanId}/loan-collateral/add`
            )
          }
        >
          <Plus /> {t('documents.addButton')}
        </Button>
      </div>
    </div>
  )
}

export default ClientsDocumentsTab
