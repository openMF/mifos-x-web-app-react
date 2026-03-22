/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faCircle } from '@fortawesome/free-solid-svg-icons'
import { ClientApi, type ClientData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

interface ClientNavigationProps {
  clientId: number
}

const clientApi = new ClientApi(getConfiguration())

const ClientNavigation = ({ clientId }: ClientNavigationProps) => {
  const [client, setClient] = useState<ClientData | undefined>()
  const { t } = useTranslation('common')

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await clientApi.retrieveAll21(clientId)
        setClient(res.data as ClientData)
      } catch (err) {
        console.error('Failed to fetch client details', err)
      }
    }
    fetchClient()
  }, [clientId])

  if (!client)
    return <p className="text-gray-500">{t('navigation.loadingClientInfo')}</p>

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <FontAwesomeIcon
          icon={faUser}
          size="2x"
          className="text-gray-700 dark:text-gray-200"
        />
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {client.displayName}
            <FontAwesomeIcon
              icon={faCircle}
              className="text-green-500"
              title={t('status.active')}
            />
          </h2>
          <p className="text-gray-500">
            {t('fields.accountNo')}:{' '}
            <span className="font-medium">{client.accountNo}</span> |{' '}
            {t('fields.externalId')}:{' '}
            <span className="font-medium">
              {(typeof client.externalId === 'string'
                ? client.externalId
                : client.externalId?.value) || t('actions.na')}
            </span>
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-2 gap-y-3">
          <div className="font-medium">{t('fields.firstName')}:</div>
          <div>{client.firstname || '-'}</div>

          <div className="font-medium">{t('navigation.middleName')}:</div>
          <div>{client.middlename || '-'}</div>

          <div className="font-medium">{t('fields.lastName')}:</div>
          <div>{client.lastname || '-'}</div>

          <div className="font-medium">{t('navigation.dateOfBirth')}:</div>
          <div>{client.dateOfBirth || '-'}</div>

          <div className="font-medium">{t('navigation.mobileNumber')}:</div>
          <div>{client.mobileNo || '-'}</div>

          <div className="font-medium">{t('navigation.activationDate')}:</div>
          <div>{client.activationDate || '-'}</div>

          <div className="font-medium">{t('navigation.associatedOffice')}:</div>
          <div>{client.officeName || '-'}</div>

          <div className="font-medium">{t('navigation.associatedStaff')}:</div>
          <div>{client.staffName || '-'}</div>
        </div>

        {/* Tabs for Accounts & Groups */}
        <div className="pt-8">
          <h3 className="text-lg font-semibold mb-3">
            {t('navigation.loanAccounts')}
          </h3>
          <p className="text-gray-500">[Loan account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">
            {t('navigation.savingsAccounts')}
          </h3>
          <p className="text-gray-500">[Savings account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">
            {t('navigation.shareAccounts')}
          </h3>
          <p className="text-gray-500">[Share account table goes here]</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">
            {t('navigation.groupMemberships')}
          </h3>
          <p className="text-gray-500">[Group membership info goes here]</p>
        </div>
      </div>
    </div>
  )
}

export default ClientNavigation
