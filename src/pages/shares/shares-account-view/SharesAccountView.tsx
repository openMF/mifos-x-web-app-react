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
  ShareAccountApi,
  type GetAccountsTypeAccountIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { faCircle, faMoneyBill } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from 'lucide-react'

const shareApi = new ShareAccountApi(getConfiguration())

type MenuItem = {
  label: string
  path?: string
  disabled?: boolean
  children?: MenuItem[]
}

/** Build dropdown menu items for shares account actions.
 *  Rules depend on account status:
 *   - Active: Apply Additional Shares, Redeem Shares, More → Close
 *   - Approved: Undo Approval, Activate
 *   - Pending: Modify Application, Approve, More → Reject, Delete
 *   - Others: No actions
 */
function buildSharesMenu(
  statusValue: string,
  clientId?: string,
  accountId?: string
): MenuItem[] {
  const base = `clients/${clientId}/shares-accounts/${accountId}/actions`
  const link = (name: string) => `${base}/${name.replace(/\s+/g, '')}`
  const s = statusValue.toLowerCase()

  if (s === 'active') {
    return [
      {
        label: 'Apply Additional Shares',
        path: link('Apply Additional Shares'),
      },
      { label: 'Redeem Shares', path: link('Redeem Shares') },
      { label: 'More', children: [{ label: 'Close', path: link('Close') }] },
    ]
  }

  if (s === 'approved') {
    return [
      { label: 'Undo Approval', path: link('Undo Approval') },
      { label: 'Activate', path: link('Activate') },
    ]
  }

  if (s.includes('pending')) {
    return [
      { label: 'Modify Application', path: link('Modify Application') },
      { label: 'Approve', path: link('Approve') },
      {
        label: 'More',
        children: [
          { label: 'Reject', path: link('Reject') },
          { label: 'Delete', path: link('Delete') },
        ],
      },
    ]
  }

  return [{ label: 'No actions', disabled: true }]
}

const SharesAccountView = () => {
  const { clientId, sharesAccountId } = useParams()
  const [acct, setAcct] = useState<GetAccountsTypeAccountIdResponse | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  // load shares account details by ID
  useEffect(() => {
    if (!sharesAccountId) return
    ;(async () => {
      try {
        const res = await shareApi.retrieveAccount(
          Number(sharesAccountId),
          'share',
          { params: { template: false } }
        )
        setAcct(res.data)
      } catch (e) {
        console.error('Failed to load share account', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [sharesAccountId])

  // determine status color for header indicator
  const statusObj = acct?.status as Record<string, unknown> | undefined
  const statusValue = String(statusObj?.value ?? '').toLowerCase()
  const statusColor = statusValue.includes('pending')
    ? 'text-orange-400'
    : statusValue === 'approved'
      ? 'text-blue-500'
      : statusValue === 'active'
        ? 'text-green-400'
        : 'text-zinc-400'

  // basic account info
  const productName = acct?.productName ?? '—'
  const accountNo = acct?.accountNo ?? '—'
  const holderName = acct?.clientName ?? '—'
  const currentMarketPrice = acct?.currentMarketPrice ?? '—'

  // sub-tabs inside Shares account view
  const base = `clients/${clientId}/shares-accounts/${sharesAccountId}`
  const tabs = [
    { label: 'General', href: `${base}/general` },
    { label: 'Transactions', href: `${base}/transactions` },
    { label: 'Charges', href: `${base}/charges` },
    { label: 'Dividends', href: `${base}/dividends` },
  ]

  // dynamic actions dropdown, based on account status
  const actions = buildSharesMenu(
    statusValue,
    clientId,
    String(sharesAccountId)
  )

  return (
    <div className="min-h-screen px-6 py-10">
      {/* breadcrumbs for navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Clients', href: '/clients' },
          {
            label: holderName,
            href: clientId ? `/clients/${clientId}` : '/clients',
          },
          {
            label: 'Shares',
            href: clientId ? `/clients/${clientId}/shares` : '/clients',
          },
        ]}
      />

      {/* main card with header, dropdown actions, and tabs */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden max-w-7xl mx-auto mt-6">
        {/* top header with account info */}
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
              <span>Shares Account</span>
            </div>

            <div className="font-medium">
              <span className="mr-1">Share Product :</span>
              <span className="mr-2">{productName}</span>
              <span>{accountNo}</span>
            </div>

            <div>
              <span className="mr-2">Client Name :</span>
              <span>{holderName}</span>
            </div>

            {/* current market price and lock-in period table */}
            <div className="mt-2">
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="pr-3">Current Market Price :</td>
                    <td>{currentMarketPrice}</td>
                  </tr>
                  {acct?.lockinPeriod ? (
                    <tr>
                      <td className="pr-3">Lockin Period :</td>
                      <td>
                        {acct.lockinPeriod}{' '}
                        {String(
                          (
                            acct?.lockPeriodTypeEnum as
                              | Record<string, unknown>
                              | undefined
                          )?.value ?? ''
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* actions dropdown */}
          <div className="flex flex-col">
            <Dropdown
              name={
                <span className="flex items-center gap-2">
                  <Menu />
                </span>
              }
              options={actions}
            />
          </div>
        </div>

        {/* sub-tabs*/}
        <AppTabs tabs={tabs} />

        {/* child routes render here */}
        <div className="p-6">{loading ? <div>Loading…</div> : <Outlet />}</div>
      </div>
    </div>
  )
}

export default SharesAccountView
