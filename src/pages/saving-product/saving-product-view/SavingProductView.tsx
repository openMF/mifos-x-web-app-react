/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import AppTabs from '@/components/custom/tabs/AppTabs'

import {
  SavingsAccountApi,
  type SavingsAccountData,
  type SavingsAccountStatusEnumData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { faCircle, faMoneyBill } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from 'lucide-react'

import {
  buildSavingsMenu,
  savingsAccountBasePath,
  type SavingsAccountSubStatus,
} from '../saving-account-actions/savings-account-menu'

const savingsApi = new SavingsAccountApi(getConfiguration())

const SavingsAccountView = () => {
  const { groupId, accountId } = useParams()
  const { pathname } = useLocation()
  const { t } = useTranslation('savings')
  const [acct, setAcct] = useState<SavingsAccountData | null>(null)

  // Fetch savings account details on mount / when accountId changes
  useEffect(() => {
    if (!accountId) return
    ;(async () => {
      try {
        const res = await savingsApi.retrieveOne25(
          Number(accountId),
          undefined,
          undefined,
          'all'
        )
        setAcct(res.data)
      } catch (err) {
        console.error('Failed to fetch savings account', err)
      }
    })()
  }, [accountId])

  // Extract status info safely
  const s: SavingsAccountStatusEnumData = acct?.status || {}
  const statusVal = String(s.value ?? '').toLowerCase()

  const inArrears = Boolean((acct as Record<string, unknown> | null)?.inArrears)
  const isActive = Boolean(s.active || statusVal === 'active')
  const isApproved = Boolean(
    (s.approved && !s.active) || statusVal === 'approved'
  )
  const isPending = Boolean(
    s.submittedAndPendingApproval || statusVal.includes('pending')
  )

  // Pick status color for dot indicator
  const statusColor = inArrears
    ? 'text-yellow-400'
    : isActive
      ? 'text-green-400'
      : isApproved
        ? 'text-blue-500'
        : isPending
          ? 'text-orange-400'
          : 'text-zinc-400'

  // Basic info fields
  const productName = acct?.savingsProductName ?? '—'
  const accountNo = acct?.accountNo ?? '—'
  const holderName = acct?.groupName ?? acct?.clientName ?? '—'
  const breadcrumbs = useAccountBreadcrumbs({
    ownerLabel: acct?.groupName ?? acct?.clientName,
    accountLabel: acct?.accountNo,
  })

  // Links stay under the client or group that owns the account
  const base =
    savingsAccountBasePath(pathname) ??
    `groups/${groupId}/savings-accounts/${accountId}`

  // Build action menu items
  const subStatus = ((acct as { subStatus?: SavingsAccountSubStatus } | null)
    ?.subStatus ?? {}) as SavingsAccountSubStatus
  const actions = buildSavingsMenu(s, subStatus, base, key => t(`menu.${key}`))

  // Tab navigation for sub-sections
  const tabs = [
    { label: 'General', href: `${base}/general` },
    { label: 'Transactions', href: `${base}/transactions` },
    { label: 'Charges', href: `${base}/charges` },
    { label: 'Documents', href: `${base}/documents` },
    { label: 'Notes', href: `${base}/notes` },
  ]

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumb navigation at the top */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* Outer card container with blue header and tabs */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden max-w-7xl mx-auto mt-6">
        {/* Blue header section with icon, status dot, and account info */}
        <div className="bg-[#0e77b7] text-white p-6 flex justify-between items-start">
          <div className="space-y-2">
            <FontAwesomeIcon
              icon={faMoneyBill}
              className="text-black w-10 h-10"
            />
            <div className="text-xl font-semibold flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCircle}
                className={`${statusColor} w-3 h-3`}
              />
              <span>Savings Account</span>
            </div>
            <div>Product: {productName}</div>
            <div>Account No: {accountNo}</div>
            <div>Holder: {holderName}</div>

            {/* Show balances only if not rejected/pending */}
            {!(s.rejected || s.submittedAndPendingApproval) && (
              <div className="mt-3 grid max-w-md grid-cols-2 text-sm">
                <div>Current Balance</div>
                <div className="text-right">
                  {acct?.summary?.accountBalance}
                </div>
                <div>Available Balance</div>
                <div className="text-right">
                  {acct?.summary?.availableBalance}
                </div>
              </div>
            )}
          </div>

          {/* Actions dropdown */}
          <div className="flex flex-col">
            <Dropdown
              name={
                <span className="flex items-center gap-2">
                  <Menu />
                </span>
              }
              options={
                actions.length
                  ? actions
                  : [{ label: t('menu.noActions'), disabled: true }]
              }
            />
          </div>
        </div>

        {/* Tabs for sub-sections */}
        <AppTabs tabs={tabs} />

        {/* Nested routes rendered here */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SavingsAccountView
