/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import {
  ClientApi,
  ClientChargesApi,
  RunReportsApi,
  type GetClientsChargesPageItems,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { useTranslation } from 'react-i18next'

import {
  DollarSign,
  Flag,
  Check,
  Undo2,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
} from 'lucide-react'

const accountsApi = new ClientApi(getConfiguration())
const chargesApi = new ClientChargesApi(getConfiguration())
const reportsApi = new RunReportsApi(getConfiguration())

interface AccountStatus {
  active?: boolean
  submittedAndPendingApproval?: boolean
  pendingApproval?: boolean
  closed?: boolean
  overpaid?: boolean
  value?: string
  code?: string
}

interface AccountTimeline {
  closedOnDate?: unknown
  // share accounts name their close date differently
  closedDate?: unknown
  activatedOnDate?: unknown
  submittedOnDate?: unknown
  actualDisbursementDate?: unknown
}

interface AccountCurrency {
  code?: string
  decimalPlaces?: number
}

interface AccountRecord {
  [key: string]: unknown
  id?: number | string
  status?: AccountStatus
  timeline?: AccountTimeline
  currency?: AccountCurrency
  accountNo?: string
  productName?: string
  loanBalance?: number
  originalLoan?: number
  inArrears?: boolean
  depositType?: { code?: string }
  loanType?: { code?: string }
  name?: string
  dueDate?: unknown
  amount?: number
  amountPaid?: number
  amountWaived?: number
  amountOutstanding?: number
  totalApprovedShares?: number
  totalPendingForApprovalShares?: number
  lastActiveTransactionDate?: unknown
  closedOnDate?: unknown
  code?: string
  accountBalance?: number
  availableBalance?: number
}

/**
 * The /clients/{id}/accounts response. The generated type leaves out
 * shareAccounts, which Fineract does send, so the response is read as this.
 */
interface ClientAccounts {
  loanAccounts?: AccountRecord[]
  savingsAccounts?: AccountRecord[]
  shareAccounts?: AccountRecord[]
}

// Fineract returns fixed and recurring deposits inside savingsAccounts
const FIXED_DEPOSIT = 'depositAccountType.fixedDeposit'
const RECURRING_DEPOSIT = 'depositAccountType.recurringDeposit'

/** A Fineract date, sent as [y, m, d] or as a string, as a timestamp for sorting. */
const dateTime = (value: unknown) => {
  if (Array.isArray(value))
    return new Date(value[0], value[1] - 1, value[2]).getTime()
  if (typeof value === 'string') return new Date(value).getTime() || 0
  return 0
}

/**
 * The loan whose amount the "Last Loan Amount" card shows: the most recently
 * disbursed one. The accounts list only carries an amount (originalLoan) once
 * a loan is disbursed.
 */
const lastDisbursedLoan = (loans: AccountRecord[]) => {
  const disbursedOn = (loan: AccountRecord) =>
    dateTime(
      loan.timeline?.actualDisbursementDate ?? loan.timeline?.submittedOnDate
    )
  return loans
    .filter(loan => loan.originalLoan !== undefined)
    .reduce<
      AccountRecord | undefined
    >((latest, loan) => (!latest || disbursedOn(loan) > disbursedOn(latest) ? loan : latest), undefined)
}

/** One figure in the Performance History section. */
const StatCard = ({
  label,
  value,
  sub,
  accent = 'border-l-[#0e77b7]',
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) => (
  <div
    className={`rounded-md border border-l-4 border-y-zinc-200 border-r-zinc-200 bg-white p-4 dark:border-y-zinc-700 dark:border-r-zinc-700 dark:bg-zinc-800 ${accent}`}
  >
    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </div>
    <div className="mt-2 whitespace-pre-line text-2xl font-semibold tabular-nums">
      {value}
    </div>
    {sub && (
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>
    )}
  </div>
)

// small dot for status
const StatusDot = ({ acc }: { acc: AccountRecord }) => {
  const { t: tc } = useTranslation('common')
  const s: AccountStatus = acc?.status || {}
  const cls = acc.inArrears
    ? 'bg-red-500'
    : s.active
      ? 'bg-green-500'
      : s.submittedAndPendingApproval || s.pendingApproval
        ? 'bg-yellow-500'
        : s.closed
          ? 'bg-zinc-400'
          : 'bg-sky-500'
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${cls}`}
      title={
        acc.inArrears
          ? tc('status.inArrears')
          : s?.value || tc('status.unknown')
      }
    />
  )
}

/** A Fineract date, sent as [y, m, d] or as a string, for display. */
const shownDate = (value: unknown) =>
  Array.isArray(value) ? formatDate(value) : String(value ?? '—')

/**
 * The client's fixed or recurring deposit accounts. Rows open the account when
 * `accountPath` is given; fixed deposits have no account view yet.
 */
const DepositAccounts = ({
  title,
  accounts,
  money,
  accountPath,
}: {
  title: string
  accounts: AccountRecord[]
  money: (value: unknown, currency?: AccountCurrency) => string
  accountPath?: (acc: AccountRecord) => string
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const [showClosed, setShowClosed] = useState(false)
  const shown = accounts.filter(a => !!a.status?.closed === showClosed)

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          size="sm"
          onClick={() => setShowClosed(!showClosed)}
        >
          {showClosed
            ? t('general.viewActiveAccounts')
            : t('general.viewClosedAccounts')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('general.savingTableAccountNo')}</TableHead>
              <TableHead>{t('general.depositTableProduct')}</TableHead>
              <TableHead>
                {showClosed
                  ? t('general.savingTableClosedDate')
                  : t('general.savingTableBalance')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map(acc => (
              <TableRow
                key={String(acc.id ?? '')}
                {...(accountPath && {
                  onClick: () => navigate(accountPath(acc)),
                  className:
                    'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700',
                })}
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  {accountPath ? (
                    <Link
                      to={accountPath(acc)}
                      onClick={e => e.stopPropagation()}
                      className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#1074b9]"
                    >
                      {acc.accountNo ?? '—'}
                    </Link>
                  ) : (
                    <span>{acc.accountNo ?? '—'}</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {showClosed
                    ? shownDate(acc.timeline?.closedOnDate)
                    : money(acc.accountBalance, acc.currency)}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noDepositAccounts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

const ClientsGeneralTab = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation('clients')

  // data
  const [loanAccounts, setLoanAccounts] = useState<AccountRecord[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<AccountRecord[]>([])
  const [shareAccounts, setShareAccounts] = useState<AccountRecord[]>([])
  const [collaterals, setCollaterals] = useState<Record<string, unknown>[]>([])
  const [upcomingCharges, setUpcomingCharges] = useState<AccountRecord[]>([])

  // toggles (grey rows are closed)
  const [showClosedLoans, setShowClosedLoans] = useState(false)
  const [showClosedSavings, setShowClosedSavings] = useState(false)
  const [showClosedShares, setShowClosedShares] = useState(false)

  // Performance History is worked out from the accounts, so it waits for them.
  const [accountsLoaded, setAccountsLoaded] = useState(false)

  useEffect(() => {
    if (!id) return
    // set when the client changes, so a slow reply for the old one is dropped
    let stale = false
    setAccountsLoaded(false)
    ;(async () => {
      // accounts
      try {
        const res = await accountsApi.retrieveAssociatedAccounts(Number(id))
        if (stale) return
        const d = (res.data ?? {}) as ClientAccounts
        setLoanAccounts(d.loanAccounts ? Array.from(d.loanAccounts) : [])
        setSavingsAccounts(
          d.savingsAccounts ? Array.from(d.savingsAccounts) : []
        )
        setShareAccounts(d.shareAccounts ? Array.from(d.shareAccounts) : [])
        setAccountsLoaded(true)
      } catch {
        if (stale) return
        setLoanAccounts([])
        setSavingsAccounts([])
        setShareAccounts([])
      }

      // charges
      try {
        const chargesRes = await chargesApi.retrieveAllClientCharges(Number(id))
        const chargeItems: GetClientsChargesPageItems[] = chargesRes.data
          ?.pageItems
          ? Array.from(chargesRes.data.pageItems)
          : []
        if (stale) return
        setUpcomingCharges(
          chargeItems.map(ch => ({
            id: ch.id,
            name: ch.name,
            dueDate: ch.dueDate,
            amount: ch.amount,
            amountPaid: ch.amountPaid,
            amountWaived: ch.amountWaived,
            amountOutstanding: ch.amountOutstanding,
            currency: ch.currency,
          }))
        )
      } catch {
        if (stale) return
        setUpcomingCharges([])
      }

      // collateral rows (report). we won't re-shape; print what we get.
      try {
        const rr = await reportsApi.runReport('ClientCollateral', false, {
          params: { R_clientId: Number(id), genericResultSet: false },
        })
        const rows: Record<string, unknown>[] = Array.isArray(rr?.data?.data)
          ? (rr.data.data as unknown as Record<string, unknown>[])
          : []
        if (stale) return
        setCollaterals(rows)
      } catch {
        if (stale) return
        setCollaterals([])
      }
    })()
    return () => {
      stale = true
    }
  }, [id])

  const depositType = (a: AccountRecord) => a.depositType?.code
  const plainSavings = savingsAccounts.filter(
    a =>
      depositType(a) !== FIXED_DEPOSIT && depositType(a) !== RECURRING_DEPOSIT
  )
  const fixedDeposits = savingsAccounts.filter(
    a => depositType(a) === FIXED_DEPOSIT
  )
  const recurringDeposits = savingsAccounts.filter(
    a => depositType(a) === RECURRING_DEPOSIT
  )

  // open vs closed
  const openLoans = loanAccounts.filter(a => !a?.status?.closed)
  const closedLoans = loanAccounts.filter(a => a?.status?.closed)
  const openSavings = plainSavings.filter(a => !a?.status?.closed)
  const closedSavings = plainSavings.filter(a => a?.status?.closed)
  const openShares = shareAccounts.filter(a => !a?.status?.closed)
  const closedShares = shareAccounts.filter(a => a?.status?.closed)

  /** An amount in its account's currency, e.g. ₹34,557.20, or "—". */
  const money = (value: unknown, currency?: AccountCurrency) => {
    if (typeof value !== 'number') return '—'
    const digits = currency?.decimalPlaces ?? 2
    const options = {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }
    try {
      return new Intl.NumberFormat(i18n.language, {
        ...options,
        style: 'currency',
        currency: currency?.code,
      }).format(value)
    } catch {
      // no currency, or a code Intl does not know
      return new Intl.NumberFormat(i18n.language, options).format(value)
    }
  }

  // Calculated from the accounts, as the Angular web app does: Fineract has no
  // ClientSummaryCounts report, and its ClientSummary report fails to run.
  const performance = useMemo(() => {
    const isActive = (a: AccountRecord) => !!a.status?.active
    const isDeposit = (a: AccountRecord) =>
      a.depositType?.code === FIXED_DEPOSIT ||
      a.depositType?.code === RECURRING_DEPOSIT
    // balances in different currencies cannot be added, so keep one total each
    const savingsByCurrency = new Map<
      string,
      { total: number; currency?: AccountCurrency }
    >()
    for (const a of savingsAccounts) {
      // Fineract before 1.15 sends no availableBalance. A deposit's
      // accountBalance is locked away, so it does not count as available.
      const balance =
        a.availableBalance ?? (isDeposit(a) ? 0 : (a.accountBalance ?? 0))
      const code = a.currency?.code ?? ''
      const entry = savingsByCurrency.get(code)
      if (entry) entry.total += balance
      else savingsByCurrency.set(code, { total: balance, currency: a.currency })
    }
    return {
      // only disbursed loans carry an originalLoan, and only they are cycles
      loanCycles: loanAccounts.filter(loan => loan.originalLoan !== undefined)
        .length,
      activeLoans: loanAccounts.filter(isActive).length,
      lastLoan: lastDisbursedLoan(loanAccounts),
      activeSavings: savingsAccounts.filter(isActive).length,
      availableSavings: Array.from(savingsByCurrency.values()),
    }
  }, [loanAccounts, savingsAccounts])

  const shown = (value: string) => (accountsLoaded ? value : '—')

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Performance History */}
      <div>
        <h3 className="text-lg font-semibold">
          {t('general.performanceHistory')}
        </h3>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('general.noOfLoanCycles')}
            value={shown(String(performance.loanCycles))}
            sub={
              accountsLoaded
                ? t('general.activeCount', { count: performance.activeLoans })
                : undefined
            }
          />
          <StatCard
            label={t('general.noOfActiveLoans')}
            value={shown(String(performance.activeLoans))}
          />
          <StatCard
            label={t('general.lastLoanAmount')}
            value={shown(
              money(
                performance.lastLoan?.originalLoan ?? 0,
                performance.lastLoan?.currency
              )
            )}
          />
          <StatCard
            label={t('general.availableSavings')}
            value={shown(
              performance.availableSavings.length
                ? performance.availableSavings
                    .map(s => money(s.total, s.currency))
                    .join('\n')
                : money(0)
            )}
            sub={
              accountsLoaded
                ? t('general.activeSavingsCount', {
                    count: performance.activeSavings,
                  })
                : undefined
            }
            accent="border-l-green-600"
          />
        </div>
      </div>

      {/* Upcoming Charges */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('general.upcomingCharges')}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('charges/overview')}
          disabled
        >
          {t('general.chargesOverview')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableName')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableDueAsOf')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableDue')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTablePaid')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableWaived')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableOutstanding')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('general.chargeTableActions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingCharges.map(ch => (
              <TableRow
                key={String(ch?.id ?? '')}
                onClick={() => navigate(`/clients/${id}/charges/${ch?.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="px-6 py-4">
                  {String(ch?.name ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {Array.isArray(ch?.dueDate)
                    ? formatDate(ch.dueDate)
                    : String(ch?.dueDate ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(ch.amount, ch.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(ch.amountPaid, ch.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(ch.amountWaived, ch.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(ch.amountOutstanding, ch.currency)}
                </TableCell>
                <TableCell
                  className="px-6 py-4 space-x-2"
                  onClick={e => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    className="bg-[#1074b9] hover:bg-[#0662a3]"
                    onClick={() => navigate(`charges/${ch?.id}/pay`)}
                  >
                    <DollarSign className="w-4 h-4 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    className="bg-[#1074b9] hover:bg-[#0662a3]"
                    onClick={() => navigate(`charges/${ch?.id}/waive`)}
                  >
                    <Flag className="w-4 h-4 text-white" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {upcomingCharges.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noUpcomingCharges')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Loan Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('general.loanAccounts')}</h2>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          size="sm"
          onClick={() => setShowClosedLoans(!showClosedLoans)}
        >
          {showClosedLoans
            ? t('general.viewActiveAccounts')
            : t('general.viewClosedAccounts')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('general.loanTableAccountNo')}</TableHead>
              <TableHead>{t('general.loanTableLoanProduct')}</TableHead>
              <TableHead>{t('general.loanTableOriginalLoan')}</TableHead>
              <TableHead>{t('general.loanTableLoanBalance')}</TableHead>
              <TableHead>{t('general.loanTableAmountPaid')}</TableHead>
              <TableHead>{t('general.loanTableType')}</TableHead>
              {showClosedLoans && (
                <TableHead>{t('general.loanTableClosedDate')}</TableHead>
              )}
              <TableHead>{t('general.loanTableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedLoans ? closedLoans : openLoans).map(acc => (
              <TableRow
                key={String(acc?.id ?? '')}
                onClick={() =>
                  navigate(`/clients/${id}/loans-accounts/${acc.id}/general`)
                }
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? '—'}</span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(acc.originalLoan, acc.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(acc.loanBalance, acc.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {money(acc.amountPaid, acc.currency)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.loanType?.code ?? '—'}
                </TableCell>
                {showClosedLoans && (
                  <TableCell className="px-6 py-4">
                    {Array.isArray(acc?.timeline?.closedOnDate)
                      ? formatDate(acc.timeline!.closedOnDate as number[])
                      : String(acc?.timeline?.closedOnDate ?? '—')}
                  </TableCell>
                )}
                <TableCell
                  className="px-6 py-4 space-x-2"
                  onClick={e => e.stopPropagation()}
                >
                  {acc?.status?.active && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() =>
                        navigate(
                          `/clients/${id}/loans-accounts/${acc.id}/actions/Make Repayment`
                        )
                      }
                    >
                      <DollarSign className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {acc?.status?.pendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() =>
                        navigate(
                          `/clients/${id}/loans-accounts/${acc.id}/actions/Approve`
                        )
                      }
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.pendingApproval &&
                    !acc?.status?.active &&
                    !acc?.status?.overpaid && (
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() =>
                          navigate(
                            `/clients/${id}/loans-accounts/${acc.id}/actions/Disburse`
                          )
                        }
                      >
                        <Flag className="w-4 h-4 text-white" />
                      </Button>
                    )}
                  {!acc?.status?.pendingApproval &&
                    !acc?.status?.active &&
                    acc?.status?.overpaid && (
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-white" />
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedLoans ? closedLoans : openLoans).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showClosedLoans ? 8 : 7}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noLoanAccounts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Saving Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('general.savingAccounts')}</h2>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          size="sm"
          onClick={() => setShowClosedSavings(!showClosedSavings)}
        >
          {showClosedSavings
            ? t('general.viewActiveAccounts')
            : t('general.viewClosedAccounts')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('general.savingTableAccountNo')}</TableHead>
              <TableHead>{t('general.savingTableSavingsProduct')}</TableHead>
              <TableHead>
                {showClosedSavings
                  ? t('general.savingTableClosedDate')
                  : t('general.savingTableLastActive')}
              </TableHead>
              {!showClosedSavings && (
                <TableHead>{t('general.savingTableBalance')}</TableHead>
              )}
              <TableHead>{t('general.savingTableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedSavings ? closedSavings : openSavings).map(acc => (
              <TableRow
                key={String(acc?.id ?? '')}
                onClick={() =>
                  navigate(`/clients/${id}/savings-accounts/${acc.id}/general`)
                }
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? '—'}</span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {showClosedSavings
                    ? Array.isArray(acc?.timeline?.closedOnDate)
                      ? formatDate(acc.timeline!.closedOnDate as number[])
                      : String(acc?.timeline?.closedOnDate ?? '—')
                    : Array.isArray(acc?.lastActiveTransactionDate)
                      ? formatDate(acc.lastActiveTransactionDate as number[])
                      : Array.isArray(acc?.timeline?.activatedOnDate)
                        ? formatDate(acc.timeline!.activatedOnDate as number[])
                        : String(
                            acc?.lastActiveTransactionDate ??
                              acc?.timeline?.activatedOnDate ??
                              '—'
                          )}
                </TableCell>
                {!showClosedSavings && (
                  <TableCell className="px-6 py-4">
                    {money(acc.accountBalance, acc.currency)}
                  </TableCell>
                )}
                <TableCell
                  className="px-6 py-4 space-x-2"
                  onClick={e => e.stopPropagation()}
                >
                  {acc?.status?.active && (
                    <>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() =>
                          navigate(
                            `/clients/${id}/savings-accounts/${acc.id}/actions/Deposit`
                          )
                        }
                      >
                        <ArrowUp className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[#1074b9] hover:bg-[#0662a3]"
                        onClick={() =>
                          navigate(
                            `/clients/${id}/savings-accounts/${acc.id}/actions/Withdrawal`
                          )
                        }
                      >
                        <ArrowDown className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  )}
                  {acc?.status?.submittedAndPendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() =>
                        navigate(
                          `/clients/${id}/savings-accounts/${acc.id}/actions/Approve`
                        )
                      }
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.submittedAndPendingApproval &&
                    !acc?.status?.active && (
                      <>
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                          onClick={() =>
                            navigate(
                              `/clients/${id}/savings-accounts/${acc.id}/actions/Undo Approval`
                            )
                          }
                        >
                          <Undo2 className="w-4 h-4 text-white" />
                        </Button>
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                          onClick={() =>
                            navigate(
                              `/clients/${id}/savings-accounts/${acc.id}/actions/Activate`
                            )
                          }
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </Button>
                      </>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedSavings ? closedSavings : openSavings).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showClosedSavings ? 4 : 5}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noSavingAccounts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {fixedDeposits.length > 0 && (
        <DepositAccounts
          title={t('general.fixedDepositAccounts')}
          accounts={fixedDeposits}
          money={money}
        />
      )}
      {recurringDeposits.length > 0 && (
        <DepositAccounts
          title={t('general.recurringDepositAccounts')}
          accounts={recurringDeposits}
          money={money}
          accountPath={acc =>
            `/clients/${id}/recurring-deposits-accounts/${acc.id}/general`
          }
        />
      )}

      {/* Shares Accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('general.sharesAccounts')}</h2>
        {shareAccounts.length > 0 && (
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            size="sm"
            onClick={() => setShowClosedShares(!showClosedShares)}
          >
            {showClosedShares
              ? t('general.viewActiveAccounts')
              : t('general.viewClosedAccounts')}
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('general.sharesTableAccountNo')}</TableHead>
              <TableHead>{t('general.sharesTableShareProduct')}</TableHead>
              <TableHead>{t('general.sharesTableApprovedShares')}</TableHead>
              <TableHead>{t('general.sharesTablePendingShares')}</TableHead>
              {showClosedShares && (
                <TableHead>{t('general.sharesTableClosedDate')}</TableHead>
              )}
              <TableHead>{t('general.sharesTableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(showClosedShares ? closedShares : openShares).map(acc => (
              <TableRow
                key={String(acc?.id ?? '')}
                onClick={() =>
                  navigate(`/clients/${id}/shares-accounts/${acc.id}/general`)
                }
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 flex items-center gap-2">
                  <StatusDot acc={acc} />
                  <span>{acc?.accountNo ?? '—'}</span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.totalApprovedShares ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.totalPendingForApprovalShares ?? '—'}
                </TableCell>
                {showClosedShares && (
                  <TableCell className="px-6 py-4">
                    {shownDate(
                      acc.timeline?.closedDate ?? acc.timeline?.closedOnDate
                    )}
                  </TableCell>
                )}
                <TableCell
                  className="px-6 py-4 space-x-2"
                  onClick={e => e.stopPropagation()}
                >
                  {acc?.status?.submittedAndPendingApproval && (
                    <Button
                      size="icon"
                      className="bg-[#1074b9] hover:bg-[#0662a3]"
                      onClick={() =>
                        navigate(
                          `/clients/${id}/shares-accounts/${acc.id}/actions/Approve`
                        )
                      }
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  {!acc?.status?.submittedAndPendingApproval &&
                    !acc?.status?.active && (
                      <>
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                          onClick={() =>
                            navigate(
                              `/clients/${id}/shares-accounts/${acc.id}/actions/Undo Approval`
                            )
                          }
                        >
                          <Undo2 className="w-4 h-4 text-white" />
                        </Button>
                        <Button
                          size="icon"
                          className="bg-[#1074b9] hover:bg-[#0662a3]"
                          onClick={() =>
                            navigate(
                              `/clients/${id}/shares-accounts/${acc.id}/actions/Activate`
                            )
                          }
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </Button>
                      </>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {(showClosedShares ? closedShares : openShares).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showClosedShares ? 6 : 5}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noShareAccounts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Collateral Data */}
      <div>
        <h2 className="text-lg font-semibold">{t('general.collateralData')}</h2>
        <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('general.collateralTableId')}</TableHead>
                <TableHead>{t('general.collateralTableName')}</TableHead>
                <TableHead>{t('general.collateralTableQuantity')}</TableHead>
                <TableHead>{t('general.collateralTableTotalValue')}</TableHead>
                <TableHead>
                  {t('general.collateralTableTotalCollateralValue')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaterals.map((c, i: number) => {
                const qty = Number(c?.quantity ?? 0)
                const base = Number(c?.basePrice ?? 0)
                const pct = Number(c?.pctToBase ?? 0)
                const total = base * qty
                const totalCollateral = (pct * base * qty) / 100
                return (
                  <TableRow key={String(c?.collateralId ?? c?.id ?? i)}>
                    <TableCell>
                      {String(c?.collateralId ?? c?.id ?? '—')}
                    </TableCell>
                    <TableCell>
                      {String(c?.name ?? c?.collateralName ?? '—')}
                    </TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell>{money(total)}</TableCell>
                    <TableCell>{money(totalCollateral)}</TableCell>
                  </TableRow>
                )
              })}
              {collaterals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-6 py-6 text-center text-zinc-500"
                  >
                    {t('general.noCollateral')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default ClientsGeneralTab
