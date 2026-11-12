/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  JournalEntriesApi,
  type JournalEntryTransactionItem,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const journalEntryApi = new JournalEntriesApi(getConfiguration())
const TRANSACTION_REQUEST_TIMEOUT_MS = 30_000

const formatDate = (value: unknown, includeTime = false) => {
  if (!value) return '—'

  let date: Date
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hours = 0, minutes = 0, seconds = 0] =
      value.map(Number)
    if (![year, month, day, hours, minutes, seconds].every(Number.isFinite)) {
      return '—'
    }
    date = new Date(year, month - 1, day, hours, minutes, seconds)
  } else if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string') {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    date = dateOnly
      ? new Date(
          Number(dateOnly[1]),
          Number(dateOnly[2]) - 1,
          Number(dateOnly[3])
        )
      : new Date(value)
  } else {
    return '—'
  }

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
      : {}),
  }).format(date)
}

const formatAmount = (amount: number, decimalPlaces?: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces ?? 2,
    maximumFractionDigits: decimalPlaces ?? 2,
  }).format(amount)

const accountTypeClass = (type?: string) => {
  const normalized = type?.toUpperCase() ?? ''
  if (normalized.includes('LIAB'))
    return 'border-orange-200 bg-orange-50 text-orange-700'
  if (normalized.includes('EQUITY'))
    return 'border-purple-200 bg-purple-50 text-purple-700'
  if (normalized.includes('INCOME') || normalized.includes('REVENUE'))
    return 'border-red-200 bg-red-50 text-red-700'
  if (normalized.includes('EXPENSE'))
    return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

const ViewJournalEntryTransaction = () => {
  const navigate = useNavigate()
  const { transactionId } = useParams()
  const [entries, setEntries] = useState<JournalEntryTransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [retryCount, setRetryCount] = useState(0)
  const [selectedEntry, setSelectedEntry] =
    useState<JournalEntryTransactionItem | null>(null)

  useEffect(() => {
    let active = true

    const fetchTransaction = async () => {
      if (!transactionId) {
        setError('A transaction ID was not provided.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(undefined)

      try {
        // The generated client takes filters positionally; pass transactionId and request its details.
        const response = await journalEntryApi.retrieveAll1(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          transactionId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          true,
          { timeout: TRANSACTION_REQUEST_TIMEOUT_MS }
        )

        if (!active) return

        const transactionEntries = response.data.pageItems ?? []
        if (transactionEntries.length === 0) {
          setEntries([])
          setError(
            `No journal entries were found for transaction ${transactionId}.`
          )
          return
        }

        setEntries(transactionEntries)
      } catch (fetchError) {
        console.error('Failed to fetch journal entry transaction', fetchError)
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load this journal entry transaction.'
          )
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void fetchTransaction()

    return () => {
      active = false
    }
  }, [transactionId, retryCount])

  const firstEntry = entries[0]
  const totals = useMemo(() => {
    const debit = entries.reduce(
      (total, entry) =>
        entry.entryType?.value === 'DEBIT'
          ? total + (Number(entry.amount) || 0)
          : total,
      0
    )
    const credit = entries.reduce(
      (total, entry) =>
        entry.entryType?.value === 'CREDIT'
          ? total + (Number(entry.amount) || 0)
          : total,
      0
    )

    return { debit, credit, netBalance: Math.abs(debit - credit) }
  }, [entries])
  const isBalanced = totals.netBalance < 0.005
  const currencySymbol =
    firstEntry?.currency?.displaySymbol ?? firstEntry?.currency?.code ?? ''
  const decimalPlaces = firstEntry?.currency?.decimalPlaces

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          {
            label: 'Journal Entries',
            href: '/accounting/journal-entries',
          },
          { label: 'Transactions', current: true },
          { label: transactionId ?? 'Transaction', current: true },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            aria-label="Back to journal entries"
            onClick={() => navigate('/accounting/journal-entries')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Institution</p>
            <h1 className="text-2xl font-semibold">
              {transactionId ?? 'Journal Entry'}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div
            className="flex min-h-56 items-center justify-center gap-3 rounded-lg border bg-white text-muted-foreground dark:bg-zinc-800"
            role="status"
          >
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading transaction details…
          </div>
        ) : error ? (
          <div
            className="space-y-4 rounded-lg border border-red-200 bg-white p-8 text-center dark:bg-zinc-800"
            role="alert"
          >
            <p className="font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => navigate('/accounting/journal-entries')}
              >
                Back to Journal Entries
              </Button>
              <Button
                className="cursor-pointer"
                onClick={() => setRetryCount(count => count + 1)}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : firstEntry ? (
          <>
            <section
              className={`rounded-lg border border-blue-100 border-t-4 p-5 shadow-sm dark:bg-zinc-800 ${
                firstEntry.reversed
                  ? 'border-t-red-500 bg-red-50/60'
                  : 'border-t-blue-600 bg-blue-50/70'
              }`}
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded border bg-white px-3 py-1 font-mono text-sm dark:bg-zinc-900">
                  #{transactionId}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {firstEntry.manualEntry ? 'Manual Journal Entry' : 'System'}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    firstEntry.reversed
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {firstEntry.reversed
                    ? 'Reversed'
                    : isBalanced
                      ? 'Balanced'
                      : 'Unbalanced'}
                </span>
              </div>

              <div className="grid gap-4 rounded-md border bg-white p-4 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
                <Metadata label="Office" value={firstEntry.officeName} />
                <Metadata
                  label="Transaction Date"
                  value={formatDate(firstEntry.transactionDate)}
                />
                <Metadata
                  label="Created By"
                  value={firstEntry.createdByUserName}
                />
                <Metadata
                  label="Submitted On"
                  value={formatDate(firstEntry.submittedOnDate, true)}
                />
              </div>
            </section>

            <section className="grid overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-800 md:grid-cols-3">
              <TotalCard
                label="Total Debits"
                amount={totals.debit}
                currencySymbol={currencySymbol}
                decimalPlaces={decimalPlaces}
                valueClass="text-blue-700 dark:text-blue-400"
              />
              <TotalCard
                label="Total Credits"
                amount={totals.credit}
                currencySymbol={currencySymbol}
                decimalPlaces={decimalPlaces}
                valueClass="text-green-700 dark:text-green-400"
              />
              <div className="border-t p-5 md:border-l md:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Balance
                </p>
                <p className="mt-2 font-mono text-xl font-semibold">
                  {currencySymbol}{' '}
                  {formatAmount(totals.netBalance, decimalPlaces)}
                </p>
                {isBalanced && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    In Balance
                  </p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between border-b border-blue-100 bg-[#eaf2fb] px-6 py-4 dark:bg-zinc-700">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#2878c8] dark:text-blue-300">
                  Journal Entries
                </h2>
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-blue-100 bg-white px-2 text-xs font-medium text-slate-500 dark:bg-zinc-800">
                  {entries.length}
                </span>
              </div>

              <Table>
                <TableHeader className="bg-[#eaf2fb] dark:bg-zinc-700">
                  <TableRow className="border-b-2 border-b-blue-500 hover:bg-transparent">
                    <TableHead className="h-12 px-6 text-xs font-bold uppercase text-slate-500">
                      Entry ID
                    </TableHead>
                    <TableHead className="h-12 px-4 text-xs font-bold uppercase text-slate-500">
                      Type
                    </TableHead>
                    <TableHead className="h-12 px-4 text-xs font-bold uppercase text-slate-500">
                      Account Code
                    </TableHead>
                    <TableHead className="h-12 px-4 text-xs font-bold uppercase text-slate-500">
                      Account Name
                    </TableHead>
                    <TableHead className="h-12 px-6 text-right text-xs font-bold uppercase text-slate-500">
                      Debit
                    </TableHead>
                    <TableHead className="h-12 px-6 text-right text-xs font-bold uppercase text-slate-500">
                      Credit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const entryType = entry.glAccountType?.value ?? '—'
                    const isDebit = entry.entryType?.value === 'DEBIT'
                    const isCredit = entry.entryType?.value === 'CREDIT'

                    return (
                      <TableRow
                        key={entry.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedEntry(entry)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedEntry(entry)
                          }
                        }}
                        className={`cursor-pointer border-b border-slate-200 border-l-[3px] transition-colors hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-700 ${
                          isDebit ? 'border-l-blue-600' : 'border-l-green-600'
                        } ${index % 2 === 1 ? 'bg-[#f1f1f1] dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'}`}
                      >
                        <TableCell className="px-6 py-4 font-mono text-sm text-blue-700 dark:text-blue-300">
                          #{entry.id}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${accountTypeClass(entry.glAccountType?.value)}`}
                          >
                            {entryType}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-mono text-sm">
                          {entry.glAccountCode ?? entry.glAccountId ?? '—'}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-semibold">
                          {entry.glAccountName ?? '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-mono text-blue-700 dark:text-blue-300">
                          {isDebit
                            ? `${currencySymbol} ${formatAmount(Number(entry.amount) || 0, decimalPlaces)}`
                            : '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-mono text-green-700 dark:text-green-300">
                          {isCredit
                            ? `${currencySymbol} ${formatAmount(Number(entry.amount) || 0, decimalPlaces)}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </section>

            <Dialog
              open={selectedEntry !== null}
              onOpenChange={open => {
                if (!open) setSelectedEntry(null)
              }}
            >
              {selectedEntry && (
                <JournalEntryDialog
                  entry={selectedEntry}
                  onClose={() => setSelectedEntry(null)}
                />
              )}
            </Dialog>
          </>
        ) : null}
      </div>
    </div>
  )
}

const Metadata = ({ label, value }: { label: string; value?: string }) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 break-words font-medium">{value || '—'}</p>
  </div>
)

const TotalCard = ({
  label,
  amount,
  currencySymbol,
  decimalPlaces,
  valueClass,
}: {
  label: string
  amount: number
  currencySymbol: string
  decimalPlaces?: number
  valueClass: string
}) => (
  <div className="p-5">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className={`mt-2 font-mono text-xl font-semibold ${valueClass}`}>
      {currencySymbol} {formatAmount(amount, decimalPlaces)}
    </p>
  </div>
)

const JournalEntryDialog = ({
  entry,
  onClose,
}: {
  entry: JournalEntryTransactionItem
  onClose: () => void
}) => {
  const isCredit = entry.entryType?.value === 'CREDIT'
  const paymentDetails = entry.transactionDetails?.paymentDetails
  const paymentFields: Array<[string, string | undefined]> = []
  if (paymentDetails) {
    const availablePaymentFields: Array<[string, string | undefined]> = [
      ['Payment Type', paymentDetails.paymentType?.name],
      ['Account Number', paymentDetails.accountNumber],
      ['Cheque Number', paymentDetails.checkNumber],
      ['Routing Code', paymentDetails.routingCode],
      ['Receipt Number', paymentDetails.receiptNumber],
      ['Bank Number', paymentDetails.bankNumber],
    ]
    paymentFields.push(
      ...availablePaymentFields.filter(([, value]) => Boolean(value))
    )
  }

  return (
    <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
      <DialogHeader className="bg-white px-6 pb-5 pt-6 text-left dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          View Journal Entry
        </p>
        <DialogTitle className="text-xl">
          {entry.glAccountName ?? 'Journal Entry'}{' '}
          <span className="ml-2 font-mono text-sm font-normal text-blue-600">
            #{entry.id}
          </span>
        </DialogTitle>
        <div
          className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-4 ${
            isCredit
              ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30'
              : 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30'
          }`}
        >
          <span className="text-sm font-bold uppercase">
            {isCredit ? 'Credit' : 'Debit'}
          </span>
          <span className="font-mono text-xl font-bold">
            {entry.currency?.displaySymbol ?? entry.currency?.code ?? ''}{' '}
            {formatAmount(
              Number(entry.amount) || 0,
              entry.currency?.decimalPlaces
            )}
          </span>
        </div>
      </DialogHeader>

      <div className="space-y-6 bg-white px-6 pb-6 dark:bg-zinc-900">
        <DialogFieldSection title="Identification">
          <DialogField label="Office" value={entry.officeName} />
          <DialogField label="Entry ID" value={entry.id} mono />
          <DialogField
            label="Transaction ID"
            value={entry.transactionId}
            mono
          />
          <DialogField
            label="Transaction Date"
            value={formatDate(entry.transactionDate)}
            mono
          />
        </DialogFieldSection>

        <DialogFieldSection title="Account Details">
          <div className="flex items-center justify-between gap-4 border-b border-dashed py-3">
            <span className="text-sm font-semibold text-slate-400">Type</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${accountTypeClass(entry.glAccountType?.value)}`}
            >
              {entry.glAccountType?.value ?? '—'}
            </span>
          </div>
          <DialogField
            label="Account Code"
            value={entry.glAccountCode ?? entry.glAccountId}
            mono
          />
          <DialogField label="Account Name" value={entry.glAccountName} />
          <DialogField
            label="Currency"
            value={[
              entry.currency?.displaySymbol,
              entry.currency?.code,
              entry.currency?.name,
            ]
              .filter(Boolean)
              .join('  ')}
          />
        </DialogFieldSection>

        {paymentFields.length > 0 && (
          <DialogFieldSection title="Payment Details">
            {paymentFields.map(([label, value]) => (
              <DialogField
                key={label}
                label={label}
                value={value}
                mono={label !== 'Payment Type'}
              />
            ))}
          </DialogFieldSection>
        )}

        {(entry.referenceNumber || entry.comments) && (
          <DialogFieldSection title="Notes">
            <DialogField
              label="Reference Number"
              value={entry.referenceNumber}
              mono
            />
            <DialogField label="Comments" value={entry.comments} />
          </DialogFieldSection>
        )}
      </div>

      <DialogFooter className="items-center justify-between border-t bg-slate-50 px-6 py-4 dark:bg-zinc-800 sm:flex-row">
        <p className="text-xs text-slate-500">
          Created By <strong>{entry.createdByUserName ?? '—'}</strong>
          <span className="mx-1">·</span>
          Submitted on{' '}
          <strong>{formatDate(entry.submittedOnDate, true)}</strong>
        </p>
        <Button className="cursor-pointer" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

const DialogFieldSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section>
    <h3 className="mb-1 border-l-[3px] border-blue-600 pl-2 text-xs font-bold uppercase tracking-wider text-blue-600">
      {title}
    </h3>
    <div>{children}</div>
  </section>
)

const DialogField = ({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string | number
  mono?: boolean
}) => (
  <div className="flex min-h-10 items-center justify-between gap-4 border-b border-dashed py-2">
    <span className="shrink-0 text-sm font-semibold text-slate-400">
      {label}
    </span>
    <span
      className={`text-right text-sm font-medium ${mono ? 'font-mono' : ''}`}
    >
      {value ?? '—'}
    </span>
  </div>
)

export default ViewJournalEntryTransaction
