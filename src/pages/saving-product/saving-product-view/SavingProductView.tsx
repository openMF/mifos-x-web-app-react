/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
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

const savingsApi = new SavingsAccountApi(getConfiguration())

// Define a reusable menu item type
type MenuItem = {
  label: string
  path?: string
  disabled?: boolean
  children?: MenuItem[]
}

// Helper function to build action menu items based on account status
function buildSavingsMenu(
  status: {
    pendingApproval?: boolean
    submittedAndPendingApproval?: boolean
    approved?: boolean
    active?: boolean
    value?: string
  },
  groupId?: string,
  accountId?: string
): MenuItem[] {
  // Normalize booleans and status code for easier checks
  const isPending = !!(
    status.pendingApproval ||
    status.submittedAndPendingApproval ||
    String(status.value || '')
      .toLowerCase()
      .includes('pending')
  )
  const isApproved = !!(
    (status.approved && !status.active) ||
    String(status.value || '').toLowerCase() === 'approved'
  )
  const isActive = !!status.active

  // Build base path for action links
  const base = `groups/${groupId}/savings-accounts/${accountId}/actions`
  const link = (name: string) => `${base}/${name.replace(/\s+/g, '')}`

  // Return different menu options depending on account status
  if (isPending) {
    return [
      { label: 'Modify Application', path: link('Modify Application') },
      { label: 'Approve', path: link('Approve') },
      {
        label: 'More',
        children: [
          { label: 'Reject', path: link('Reject') },
          { label: 'Withdrawn by Client', path: link('Withdrawn by Client') },
          { label: 'Add Charge', path: link('Add Charge') },
          { label: 'Delete', path: link('Delete') },
          { label: 'Assign Staff', path: link('Assign Staff') },
        ],
      },
    ]
  }

  if (isApproved) {
    return [
      { label: 'Undo Approval', path: link('Undo Approval') },
      { label: 'Activate', path: link('Activate') },
      { label: 'Add Charge', path: link('Add Charge') },
      {
        label: 'More',
        children: [{ label: 'Assign Staff', path: link('Assign Staff') }],
      },
    ]
  }

  if (isActive) {
    return [
      { label: 'Deposit', path: link('Deposit') },
      { label: 'Block Deposit', path: link('Block Deposit') },
      { label: 'Withdrawal', path: link('Withdrawal') },
      { label: 'Block Withdrawal', path: link('Block Withdrawal') },
      { label: 'Block Account', path: link('Block Account') },
      { label: 'Hold Amount', path: link('Hold Amount') },
      { label: 'Calculate Interest', path: link('Calculate Interest') },
      { label: 'Post Interest As On', path: link('Post Interest As On') },
      {
        label: 'More',
        children: [
          { label: 'Post Interest', path: link('Post Interest') },
          { label: 'Add Charge', path: link('Add Charge') },
          { label: 'Close', path: link('Close') },
          { label: 'Assign Staff', path: link('Assign Staff') },
        ],
      },
    ]
  }

  // Default (when no known status matches)
  return [
    {
      label: 'More',
      children: [{ label: 'Assign Staff', path: link('Assign Staff') }],
    },
  ]
}

const SavingsAccountView = () => {
  const { groupId, accountId } = useParams()
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

  // Build action menu items
  const actions = buildSavingsMenu(s || {}, groupId, accountId)

  // Tab navigation for sub-sections
  const base = `groups/${groupId}/savings-accounts/${accountId}`
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
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: holderName, href: `/groups/${groupId}/general` },
          { label: 'Savings', href: `/groups/${groupId}/savings` },
        ]}
      />

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
                  : [{ label: 'No actions', disabled: true }]
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
