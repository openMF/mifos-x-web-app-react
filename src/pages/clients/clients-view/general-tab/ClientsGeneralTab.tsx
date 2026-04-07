/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
  type GetClientsClientIdAccountsResponse,
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
  activatedOnDate?: unknown
}

interface AccountSummary {
  totalOutstanding?: number
  totalPaid?: number
  accountBalance?: number
}

interface AccountRecord {
  [key: string]: unknown
  id?: number | string
  status?: AccountStatus
  timeline?: AccountTimeline
  summary?: AccountSummary
  accountNo?: string
  productName?: string
  loanProductName?: string
  principal?: number
  loanBalance?: number
  originalLoan?: number
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
  totalOutstanding?: number
  totalPaid?: number
  code?: string
  accountBalance?: number
}

// small dot for status
const StatusDot = ({ acc }: { acc: AccountRecord }) => {
  const { t: tc } = useTranslation('common')
  const s: AccountStatus = acc?.status || {}
  const cls = s.active
    ? 'bg-green-500'
    : s.submittedAndPendingApproval || s.pendingApproval
      ? 'bg-yellow-500'
      : s.closed
        ? 'bg-zinc-400'
        : 'bg-sky-500'
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${cls}`}
      title={s?.value || tc('status.unknown')}
    />
  )
}

const ClientsGeneralTab = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation('clients')

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

  // performance history -> keep the same 5 fields as your Angular template
  const [perf, setPerf] = useState<Record<string, string>>({
    loanCycle: '',
    activeLoans: '',
    lastLoanAmount: '',
    activeSavings: '',
    totalSavings: '',
  })

  useEffect(() => {
    if (!id) return
    ;(async () => {
      // accounts
      try {
        const res = await accountsApi.retrieveAssociatedAccounts(Number(id))
        const d: GetClientsClientIdAccountsResponse = res.data ?? {}
        setLoanAccounts(
          d.loanAccounts ? (Array.from(d.loanAccounts) as AccountRecord[]) : []
        )
        setSavingsAccounts(
          d.savingsAccounts
            ? (Array.from(d.savingsAccounts) as AccountRecord[])
            : []
        )
        setShareAccounts([])
      } catch {
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
        setUpcomingCharges(
          chargeItems.map(ch => ({
            id: ch.id,
            name: ch.name,
            dueDate: ch.dueDate,
            amount: ch.amount,
            amountPaid: ch.amountPaid,
            amountWaived: ch.amountWaived,
            amountOutstanding: ch.amountOutstanding,
          }))
        )
      } catch {
        setUpcomingCharges([])
      }

      // performance history (report values as-is)
      try {
        const r = await reportsApi.runReport('ClientSummaryCounts', false, {
          params: { R_clientId: Number(id), genericResultSet: false },
        })
        const row = (r?.data?.data?.[0] ?? {}) as Record<string, unknown>
        setPerf({
          loanCycle: String(row.loanCycle ?? row['Loan Cycle'] ?? ''),
          activeLoans: String(row.activeLoans ?? row['Active Loans'] ?? ''),
          lastLoanAmount: String(
            row.lastLoanAmount ?? row['Last Loan Amount'] ?? ''
          ),
          activeSavings: String(
            row.activeSavings ?? row['Active Savings'] ?? ''
          ),
          totalSavings: String(row.totalSavings ?? row['Total Savings'] ?? ''),
        })
      } catch {
        // leave perf values empty if the report isn't there
      }

      // collateral rows (report). we won't re-shape; print what we get.
      try {
        const rr = await reportsApi.runReport('ClientCollateral', false, {
          params: { R_clientId: Number(id), genericResultSet: false },
        })
        const rows: Record<string, unknown>[] = Array.isArray(rr?.data?.data)
          ? (rr.data.data as unknown as Record<string, unknown>[])
          : []
        setCollaterals(rows)
      } catch {
        setCollaterals([])
      }
    })()
  }, [id])

  // open vs closed
  const openLoans = loanAccounts.filter(a => !a?.status?.closed)
  const closedLoans = loanAccounts.filter(a => a?.status?.closed)
  const openSavings = savingsAccounts.filter(a => !a?.status?.closed)
  const closedSavings = savingsAccounts.filter(a => a?.status?.closed)
  const openShares = shareAccounts.filter(a => !a?.status?.closed)
  const closedShares = shareAccounts.filter(a => a?.status?.closed)

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Performance History  */}
      <div>
        <h3 className="text-lg font-semibold">
          {t('general.performanceHistory')}
        </h3>
        <div className="mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              {t('general.noOfLoanCycles')} {perf.loanCycle || '—'} <br />
              {t('general.noOfActiveLoans')} {perf.activeLoans || '—'} <br />
              {t('general.lastLoanAmount')} {perf.lastLoanAmount || '—'} <br />
            </div>
            <div>
              {t('general.noOfActiveSavings')} {perf.activeSavings || '—'}{' '}
              <br />
              {t('general.totalSavings')} {perf.totalSavings || '—'} <br />
            </div>
          </div>
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
                  {String(ch?.amount ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {String(ch?.amountPaid ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {String(ch?.amountWaived ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {String(ch?.amountOutstanding ?? '—')}
                </TableCell>
                <TableCell className="px-6 py-4 space-x-2">
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
                  {acc?.loanProductName ?? acc?.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.principal ?? acc?.originalLoan ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.summary?.totalOutstanding ?? acc?.loanBalance ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {acc?.summary?.totalPaid ?? '—'}
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
                    {acc?.summary?.accountBalance ?? acc?.accountBalance ?? '—'}
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
                  colSpan={showClosedSavings ? 5 : 6}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noSavingAccounts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
                    {Array.isArray(acc?.timeline?.closedOnDate)
                      ? formatDate(acc.timeline!.closedOnDate as number[])
                      : String(acc?.timeline?.closedOnDate ?? '—')}
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
                    <TableCell>{total}</TableCell>
                    <TableCell>{totalCollateral}</TableCell>
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
