/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { Building2, Menu } from 'lucide-react'

import { ClientApi, type GetClientsClientIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppTabs from '@/components/custom/tabs/AppTabs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date-utils'

const clientsApi = new ClientApi(getConfiguration())

const ClientsView = () => {
  const { id } = useParams()
  const [client, setClient] = useState<GetClientsClientIdResponse>()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await clientsApi.retrieveOne11(Number(id))
        setClient(res.data)
        console.log('res is:', res.data)
      } catch (err) {
        console.error('Failed to fetch client', err)
      }
    }
    fetchClient()
  }, [id])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          { label: String(client?.displayName), href: `/clients/${id}` },
          { label: t('view.tabs.general'), current: true },
        ]}
      />

      {/* Header */}
      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          <Building2 className="text-black w-10 h-10" />
          <div className="text-xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircle}
              className={`${client?.status?.id === 300 ? 'text-green-400' : 'text-yellow-400'} w-3 h-3`}
            />
            <span>{t('clientName')} {client?.displayName ?? '—'}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-2 mt-4">
            <div>
              <div className="font-semibold">{t('view.office')}</div>
              <div>{client?.officeName ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.memberOf')}</div>
              <div>{t('view.missingInOpenAPI')}</div>
            </div>
            <div>
              <div className="font-semibold">{t('client')}</div>
              <div>{client?.accountNo ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.mobileNumber')}</div>
              <div>{t('view.missingInOpenAPI')}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.externalId')}</div>
              <div>{client?.externalId ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.email')}</div>
              <div>{client?.emailAddress ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.activationDate')}</div>
              <div>{formatDate(client?.activationDate as number[] | undefined)}</div>
            </div>
            <div>
              <div className="font-semibold">{t('view.staff')}</div>
              <div>{t('view.missingInOpenAPI')}</div>
            </div>
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
              options={[
                { label: t('view.menu.edit'), path: `clients/${client?.id}/edit` },
                {
                  label: t('view.menu.applications'),
                  children: [
                    {
                      label: t('view.menu.newLoanAccount'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.newSavingsAccount'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.newShareAccount'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.newRecurringDepositAccount'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.newFixedDepositAccount'),
                      path: 'signature',
                      disabled: true,
                    },
                  ],
                },
                {
                  label: t('view.menu.actions'),
                  children: [
                    { label: t('view.menu.close'), path: 'signature', disabled: true },
                    {
                      label: t('view.menu.transferClients'),
                      path: 'signature',
                      disabled: true,
                    },
                  ],
                },
                { label: t('view.menu.unassignStaff'), path: `clients/${client?.id}/edit` },
                {
                  label: t('view.menu.more'),
                  children: [
                    { label: t('view.menu.addCharge'), path: 'signature', disabled: true },
                    {
                      label: t('view.menu.createCollateral'),
                      path: 'signature',
                      disabled: true,
                    },
                    { label: t('view.menu.survey'), path: 'signature', disabled: true },
                    {
                      label: t('view.menu.uploadDefaultSavings'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.uploadSignature'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.deleteSignature'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.clientScreenReports'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.createStandingInstructions'),
                      path: 'signature',
                      disabled: true,
                    },
                    {
                      label: t('view.menu.viewStandingInstructions'),
                      path: 'signature',
                      disabled: true,
                    },
                  ],
                },
              ]}
            />
          </div>

          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>{t('view.status')} {client?.status?.code ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AppTabs
        tabs={[
          { label: t('view.tabs.general'), href: `clients/${client?.id}/general` },
          { label: t('view.tabs.address'), href: `clients/${client?.id}/address` },
          {
            label: t('view.tabs.familyMembers'),
            href: `clients/${client?.id}/family-members`,
          },
          { label: t('view.tabs.identities'), href: `clients/${client?.id}/identities` },
          { label: t('view.tabs.documents'), href: `clients/${client?.id}/documents` },
          { label: t('view.tabs.notes'), href: `clients/${client?.id}/notes` },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default ClientsView
