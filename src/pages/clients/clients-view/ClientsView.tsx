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

// WEB-812: Import useAppSelector to check permissions
import { useAppSelector } from '@/app/hook'

const clientsApi = new ClientApi(getConfiguration())

const ClientsView = () => {
  const { id } = useParams()
  const [client, setClient] = useState<GetClientsClientIdResponse>()

  // WEB-812: Fetch user permissions from Redux
  const { user } = useAppSelector((state) => state.login)
  const permissions = user?.permissions || []
  const hasAllFunctions = permissions.includes('ALL_FUNCTIONS')

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

  // WEB-812: Define dropdown options with permission requirements
  const dropdownOptions = [
    { 
      label: 'Edit', 
      path: `clients/${client?.id}/edit`, 
      requiredPermission: 'UPDATE_CLIENT' 
    },
    {
      label: 'Applications',
      children: [
        { label: 'New Loan Account', path: 'signature', disabled: true, requiredPermission: 'CREATE_LOAN' },
        { label: 'New Savings Account', path: 'signature', disabled: true, requiredPermission: 'CREATE_SAVINGSACCOUNT' },
        { label: 'New Share Account', path: 'signature', disabled: true },
        { label: 'New Recurring Deposit Account', path: 'signature', disabled: true },
        { label: 'New Fixed Deposit Account', path: 'signature', disabled: true },
      ],
    },
    {
      label: 'Actions',
      children: [
        { label: 'Close', path: 'signature', disabled: true, requiredPermission: 'CLOSE_CLIENT' },
        { label: 'Transfer Clients', path: 'signature', disabled: true, requiredPermission: 'TRANSFERCLIENT_CLIENT' },
      ],
    },
    { 
      label: 'Unassign Staff', 
      path: `clients/${client?.id}/edit`, 
      requiredPermission: 'UNASSIGNSTAFF_CLIENT' 
    },
    {
      label: 'More',
      children: [
        { label: 'Add Charge', path: 'signature', disabled: true, requiredPermission: 'CREATE_CLIENTCHARGE' },
        { label: 'Create Collateral', path: 'signature', disabled: true },
        { label: 'Survey', path: 'signature', disabled: true },
        { label: 'Upload Default Savings', path: 'signature', disabled: true },
        { label: 'Upload Signature', path: 'signature', disabled: true, requiredPermission: 'CREATE_CLIENTIMAGE' },
        { label: 'Delete Signature', path: 'signature', disabled: true, requiredPermission: 'DELETE_CLIENTIMAGE' },
        { label: 'Client Screen Reports', path: 'signature', disabled: true },
        { label: 'Create Standing Instructions', path: 'signature', disabled: true, requiredPermission: 'CREATE_STANDINGINSTRUCTION' },
        { label: 'View Standing Instructions', path: 'signature', disabled: true, requiredPermission: 'READ_STANDINGINSTRUCTION' },
      ],
    },
  ].filter(option => 
    !option.requiredPermission || 
    permissions.includes(option.requiredPermission) || 
    hasAllFunctions
  )

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Clients', href: '/clients' },
          { label: String(client?.displayName), href: `/clients/${id}` },
          { label: 'General', current: true },
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
            <span>Client Name : {client?.displayName ?? '—'}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-2 mt-4">
            <div>
              <div className="font-semibold">Office</div>
              <div>{client?.officeName ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">Member Of</div>
              <div>{'Missing in OpenAPI'}</div>
            </div>
            <div>
              <div className="font-semibold">Client</div>
              <div>{client?.accountNo ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">Mobile Number</div>
              <div>{'Missing in OpenAPI'}</div>
            </div>
            <div>
              <div className="font-semibold">External Id</div>
              <div>{client?.externalId ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">Email</div>
              <div>{client?.emailAddress ?? '—'}</div>
            </div>
            <div>
              <div className="font-semibold">Activation Date</div>
              <div>
                {Array.isArray(client?.activationDate)
                  ? new Date(
                      client.activationDate[0],
                      (client.activationDate[1] || 1) - 1,
                      client.activationDate[2] || 1
                    ).toLocaleDateString()
                  : (client?.activationDate ?? '—')}
              </div>
            </div>
            <div>
              <div className="font-semibold">Staff</div>
              <div>{'Missing in OpenAPI'}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-end">
            {/* WEB-812: Pass filtered options to Dropdown */}
            <Dropdown
              name={
                <span className="flex items-center gap-2">
                  <Menu />
                </span>
              }
              options={dropdownOptions}
            />
          </div>

          <div className="mt-30 bg-[#0662a3] px-4 py-2 rounded-md text-sm font-medium text-white">
            <div>Status: {client?.status?.code ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AppTabs
        tabs={[
          { label: 'General', href: `clients/${client?.id}/general` },
          { label: 'Address', href: `clients/${client?.id}/address` },
          {
            label: 'Family Members',
            href: `clients/${client?.id}/family-members`,
          },
          { label: 'Identities', href: `clients/${client?.id}/identities` },
          { label: 'Documents', href: `clients/${client?.id}/documents` },
          { label: 'Notes', href: `clients/${client?.id}/notes` },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default ClientsView