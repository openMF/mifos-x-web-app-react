/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type {
  GetLoansLoanIdResponse,
  GetLoansLoanIdRepaymentPeriod,
} from '@/fineract-api'
import { LoansApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const loansApi = new LoansApi(getConfiguration())

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(+dt) ? '—' : dt.toLocaleDateString()
}

const LoansRepaymentScheduleTab = () => {
  const { loanId } = useParams()
  const [loan, setLoan] = useState<GetLoansLoanIdResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // fetch loan details
  useEffect(() => {
    ;(async () => {
      try {
        if (!loanId) return
        const loanIdNum = Number(loanId)
        const res = await loansApi.retrieveLoan(loanIdNum)
        setLoan(res.data)
      } catch (err) {
        console.error('Failed to fetch loan', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [loanId])

  // currency formatter
  const currencyCode = loan?.currency?.code ?? 'USD'
  const currency = (n: number | null | undefined) =>
    n == null
      ? '—'
      : new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
        }).format(n)

  // repayment schedule
  const schedule = loan?.repaymentSchedule
  const rawPeriods: GetLoansLoanIdRepaymentPeriod[] = useMemo(
    () => schedule?.periods ?? [],
    [schedule?.periods]
  )

  // filter out disbursement
  const periods = useMemo(
    () => rawPeriods.filter(p => (p.period ?? 0) > 0),
    [rawPeriods]
  )

  // disbursement row
  const disbursement = rawPeriods.find(p => (p.period ?? 0) === 0)
  const timeline = loan?.timeline
  const disbDate =
    timeline?.actualDisbursementDate ??
    timeline?.expectedDisbursementDate ??
    disbursement?.dueDate
  const openingBalance =
    disbursement?.principalLoanBalanceOutstanding ??
    schedule?.totalPrincipalDisbursed ??
    loan?.principal ??
    null

  // totals
  const n = (v: number | undefined) => v ?? 0
  interface ScheduleTotals {
    principal: number
    interest: number
    fees: number
    penalties: number
    due: number
    paid: number
    inAdvance: number
    late: number
    outstanding: number
  }
  const totals = periods.reduce<ScheduleTotals>(
    (acc, p) => {
      const principal = n(p.principalDue)
      const interest = n(p.interestDue)
      const fees = n(p.feeChargesDue)
      const penalties = n(p.penaltyChargesDue)
      const due =
        n(p.totalDueForPeriod) || principal + interest + fees + penalties

      const paid = n(p.totalPaidForPeriod)
      const inAdvance = n(p.totalPaidInAdvanceForPeriod)
      const late = n(p.totalPaidLateForPeriod)
      const outstanding =
        n(p.totalOutstandingForPeriod) || Math.max(due - paid, 0)

      acc.principal += principal
      acc.interest += interest
      acc.fees += fees
      acc.penalties += penalties
      acc.due += due
      acc.paid += paid
      acc.inAdvance += inAdvance
      acc.late += late
      acc.outstanding += outstanding
      return acc
    },
    {
      principal: 0,
      interest: 0,
      fees: 0,
      penalties: 0,
      due: 0,
      paid: 0,
      inAdvance: 0,
      late: 0,
      outstanding: 0,
    }
  )

  if (loading)
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
    )

  return (
    <div className="space-y-4">
      {/* export button */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => window.print()}>
          Export to PDF
        </Button>
      </div>

      {/* schedule table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            {/* grouped header */}
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead colSpan={2} className="text-center">
                Loan Amount and Balance
              </TableHead>
              <TableHead colSpan={3} className="text-center">
                Total Cost of Loan
              </TableHead>
              <TableHead colSpan={5} className="text-center">
                Installment Totals
              </TableHead>
            </TableRow>

            {/* labels row */}
            <TableRow className="text-base">
              <TableHead>#</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Balance Of Loan</TableHead>
              <TableHead>Principal Due</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Penalties</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>In advance</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* disbursement row */}
            {disbDate != null && (
              <TableRow>
                <TableCell />
                <TableCell />
                <TableCell className="font-medium">
                  {fmtDate(disbDate)}
                </TableCell>
                <TableCell />
                <TableCell className="font-medium">
                  {currency(openingBalance)}
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell className="font-medium">
                  {currency(openingBalance)}
                </TableCell>
              </TableRow>
            )}

            {/* installment rows */}
            {periods.map(p => {
              const principal = n(p.principalDue)
              const interest = n(p.interestDue)
              const fees = n(p.feeChargesDue)
              const penalties = n(p.penaltyChargesDue)
              const due =
                n(p.totalDueForPeriod) ||
                principal + interest + fees + penalties
              const paid = n(p.totalPaidForPeriod)
              const inAdvance = n(p.totalPaidInAdvanceForPeriod)
              const late = n(p.totalPaidLateForPeriod)
              const outstanding =
                n(p.totalOutstandingForPeriod) || Math.max(due - paid, 0)

              return (
                <TableRow
                  key={String(p.period ?? fmtDate(p.dueDate))}
                  className="text-base"
                >
                  <TableCell>{String(p.period ?? '—')}</TableCell>
                  <TableCell className="text-red-500">
                    {String(p.daysInPeriod ?? '—')}
                  </TableCell>
                  <TableCell className="text-red-500">
                    {fmtDate(p.dueDate)}
                  </TableCell>
                  <TableCell>
                    {p.obligationsMetOnDate
                      ? fmtDate(p.obligationsMetOnDate)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency(p.principalLoanBalanceOutstanding)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {currency(principal)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {currency(interest)}
                  </TableCell>
                  <TableCell className="text-right">{currency(fees)}</TableCell>
                  <TableCell className="text-right">
                    {currency(penalties)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {currency(due)}
                  </TableCell>
                  <TableCell className="text-right">{currency(paid)}</TableCell>
                  <TableCell className="text-right">
                    {currency(inAdvance)}
                  </TableCell>
                  <TableCell className="text-right">{currency(late)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {currency(outstanding)}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* totals row */}
            <TableRow>
              <TableCell colSpan={5} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.principal)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.interest)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.fees)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.penalties)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.due)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.paid)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.inAdvance)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.late)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency(totals.outstanding)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LoansRepaymentScheduleTab
