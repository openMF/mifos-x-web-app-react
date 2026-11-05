/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppTabs from '@/components/custom/tabs/AppTabs'
import { FixedDepositAccountApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { faCircle, faPiggyBank } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  type FixedDepositAccount,
  type FixedDepositOutletContext,
  formatMoney,
  hasTransactions,
  isPendingOrRejected,
} from './fixed-deposit-account'

const fixedDepositApi = new FixedDepositAccountApi(getConfiguration())

const statusColor = (status: FixedDepositAccount['status']) => {
  if (status?.active) return 'text-green-400'
  if (status?.submittedAndPendingApproval) return 'text-yellow-400'
  if (status?.approved) return 'text-sky-300'
  if (status?.rejected) return 'text-red-400'
  return 'text-zinc-400'
}

/**
 * A client's fixed deposit account, with its tabs rendered in the outlet. The
 * account is loaded once here and handed to the tabs, which all read from the
 * same GET /fixeddepositaccounts/{id}?associations=all response.
 */
const FixedDepositAccountView = () => {
  const { clientId, accountId } = useParams()
  const { t, i18n } = useTranslation('clients')

  const [account, setAccount] = useState<FixedDepositAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Ignore a reply that arrives after the user has moved to another account
    let cancelled = false
    setLoading(true)
    setFailed(false)
    fixedDepositApi
      // retrieveOne19 has no associations parameter, but the endpoint reads it
      .retrieveOne19(Number(accountId), undefined, undefined, {
        params: { associations: 'all' },
      })
      .then(res => {
        if (!cancelled) setAccount(res.data as unknown as FixedDepositAccount)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Failed to fetch fixed deposit account', err)
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  const breadcrumbs = useAccountBreadcrumbs({
    ownerLabel: account?.clientName,
    accountLabel: account?.accountNo,
  })

  const base = `clients/${clientId}/fixed-deposits-accounts/${accountId}`
  const tabs = [
    { label: t('fixedDepositAccount.tabs.general'), href: `${base}/general` },
    {
      label: t('fixedDepositAccount.tabs.interestRateChart'),
      href: `${base}/interest-rate-chart`,
    },
    ...(account && hasTransactions(account)
      ? [
          {
            label: t('fixedDepositAccount.tabs.transactions'),
            href: `${base}/transactions`,
          },
        ]
      : []),
    { label: t('fixedDepositAccount.tabs.charges'), href: `${base}/charges` },
    {
      label: t('fixedDepositAccount.tabs.standingInstructions'),
      href: `${base}/standing-instructions`,
    },
  ]

  const money = (value?: number) =>
    formatMoney(value, account?.currency, i18n.language)

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs items={breadcrumbs} />

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden max-w-7xl mx-auto mt-6">
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">
            {t('fixedDepositAccount.loading')}
          </p>
        ) : failed || !account ? (
          <p className="p-6 text-sm text-red-600">
            {t('fixedDepositAccount.failedLoad')}
          </p>
        ) : (
          <>
            <div className="bg-[#0e77b7] text-white p-6 flex flex-col gap-6 md:flex-row md:justify-between">
              <div className="space-y-2">
                <FontAwesomeIcon
                  icon={faPiggyBank}
                  className="text-black w-10 h-10"
                />
                <div className="text-xl font-semibold flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className={`${statusColor(account.status)} w-3 h-3`}
                    title={account.status?.value}
                  />
                  <span>
                    {t('fixedDepositAccount.product')}:{' '}
                    {account.depositProductName ?? '—'}
                  </span>
                </div>
                <div>
                  {t('fixedDepositAccount.accountNo')}:{' '}
                  {account.accountNo ?? '—'}
                </div>
                <div>
                  {t('fixedDepositAccount.client')}: {account.clientName ?? '—'}
                </div>
                <div>
                  {t('fixedDepositAccount.status')}:{' '}
                  {account.status?.value ?? '—'}
                </div>
              </div>

              {!isPendingOrRejected(account) && (
                <div className="md:w-72">
                  <div className="font-semibold mb-2">
                    {t('fixedDepositAccount.accountOverview')}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <div>{t('fixedDepositAccount.currentBalance')}</div>
                    <div className="text-right tabular-nums">
                      {money(account.summary?.accountBalance)}
                    </div>
                    <div>{t('fixedDepositAccount.depositAmount')}</div>
                    <div className="text-right tabular-nums">
                      {money(account.depositAmount)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <AppTabs tabs={tabs} />

            <div className="p-6">
              <Outlet
                context={{ account } satisfies FixedDepositOutletContext}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FixedDepositAccountView
