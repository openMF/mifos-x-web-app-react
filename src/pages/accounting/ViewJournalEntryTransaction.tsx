/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import fineract from '@/lib/axios'
import { formatDate } from '@/lib/date-utils'

interface JournalEntry {
  id?: number
  amount?: number
  createdByUserName?: string
  currency?: { code?: string; displaySymbol?: string }
  entryType?: { value?: string }
  glAccountCode?: string
  glAccountName?: string
  glAccountType?: { value?: string }
  manualEntry?: boolean
  officeName?: string
  reversed?: boolean
  submittedOnDate?: string
  transactionDate?: string
  transactionId?: string
}

interface JournalEntriesResponse {
  pageItems?: JournalEntry[]
}

const ViewJournalEntryTransaction = () => {
  const navigate = useNavigate()
  const { id: transactionId } = useParams()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadTransaction = async () => {
      if (!transactionId) {
        setError('Transaction ID is missing.')
        setLoading(false)
        return
      }

      try {
        const response = await fineract.get<JournalEntriesResponse>(
          'v1/journalentries',
          {
            params: {
              transactionId,
              transactionDetails: true,
            },
          }
        )
        if (active) setEntries(response.data.pageItems ?? [])
      } catch (loadError) {
        console.error('Failed to load journal entry transaction', loadError)
        if (active) setError('Unable to load this journal entry transaction.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadTransaction()
    return () => {
      active = false
    }
  }, [transactionId])

  const firstEntry = entries[0]
  const totals = useMemo(
    () =>
      entries.reduce(
        (result, entry) => {
          const amount = Number(entry.amount) || 0
          if (entry.entryType?.value === 'DEBIT') result.debit += amount
          if (entry.entryType?.value === 'CREDIT') result.credit += amount
          return result
        },
        { debit: 0, credit: 0 }
      ),
    [entries]
  )
  const currency = firstEntry?.currency
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.005
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          {
            label: 'Journal Entries',
            href: '/accounting/journal-entries',
          },
          { label: 'View Transaction', current: true },
        ]}
      />

      {loading ? (
        <p role="status">Loading journal entry transaction…</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-white p-6 text-red-700 shadow-sm dark:border-red-900 dark:bg-zinc-800 dark:text-red-300">
          <p role="alert">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <p>No data found for transaction {transactionId}.</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">
                  #{firstEntry?.transactionId ?? transactionId}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-700">
                    {firstEntry?.manualEntry
                      ? 'Manual Journal Entry'
                      : 'System'}
                  </span>
                  {firstEntry?.reversed ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-300">
                      Reversed
                    </span>
                  ) : isBalanced ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-950 dark:text-green-300">
                      Balanced
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-500">Office</dt>
                <dd className="mt-1 font-medium">
                  {firstEntry?.officeName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Transaction Date</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(firstEntry?.transactionDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Created By</dt>
                <dd className="mt-1 font-medium">
                  {firstEntry?.createdByUserName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Submitted On</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(firstEntry?.submittedOnDate)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="grid gap-4 border-b border-zinc-200 pb-5 sm:grid-cols-3 dark:border-zinc-700">
              <div>
                <p className="text-sm text-zinc-500">Total Debits</p>
                <p className="mt-1 text-xl font-semibold">
                  {currency?.displaySymbol ?? currency?.code}{' '}
                  {formatAmount(totals.debit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Total Credits</p>
                <p className="mt-1 text-xl font-semibold">
                  {currency?.displaySymbol ?? currency?.code}{' '}
                  {formatAmount(totals.credit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Net Balance</p>
                <p className="mt-1 text-xl font-semibold">
                  {currency?.displaySymbol ?? currency?.code}{' '}
                  {formatAmount(Math.abs(totals.debit - totals.credit))}
                </p>
              </div>
            </div>

            <h2 className="my-5 text-lg font-semibold">Journal Entries</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700">
                  <tr>
                    <th className="px-3 py-3">Entry ID</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Account Code</th>
                    <th className="px-3 py-3">Account Name</th>
                    <th className="px-3 py-3 text-right">Debit</th>
                    <th className="px-3 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr
                      key={entry.id}
                      className="border-b border-zinc-100 dark:border-zinc-700"
                    >
                      <td className="px-3 py-3">#{entry.id ?? '—'}</td>
                      <td className="px-3 py-3">
                        {entry.glAccountType?.value ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        {entry.glAccountCode ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        {entry.glAccountName ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {entry.entryType?.value === 'DEBIT'
                          ? `${currency?.displaySymbol ?? currency?.code ?? ''} ${formatAmount(Number(entry.amount) || 0)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {entry.entryType?.value === 'CREDIT'
                          ? `${currency?.displaySymbol ?? currency?.code ?? ''} ${formatAmount(Number(entry.amount) || 0)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="mt-6" onClick={() => navigate(-1)}>
              Back
            </Button>
          </section>
        </>
      )}
    </div>
  )
}

export default ViewJournalEntryTransaction
