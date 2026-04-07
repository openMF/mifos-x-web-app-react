/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type {
  GetLoansLoanIdResponse,
  GetLoansLoanIdTransactions,
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

/** Extension for properties not on the generated type but returned at runtime. */
type ExtendedLoan = GetLoansLoanIdResponse & {
  officeName?: string
}

type ExtendedTxn = Omit<GetLoansLoanIdTransactions, 'transactionType'> & {
  transactionType?: { value?: string }
  principalComponent?: number
  interestComponent?: number
  feeChargeComponent?: number
  penaltyChargeComponent?: number
  balance?: number
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(+dt) ? '—' : dt.toLocaleDateString()
}

const LoansTransactions = () => {
  const { loanId } = useParams()
  const [loan, setLoan] = useState<ExtendedLoan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        if (!loanId) return
        const loanIdNum = Number(loanId)
        const res = await loansApi.retrieveLoan(loanIdNum)
        setLoan(res.data as ExtendedLoan)
      } catch (err) {
        console.error('Failed to fetch loan transactions', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [loanId])

  if (loading)
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
    )

  const code = loan?.currency?.code ?? 'USD'
  const money = (n: number | null | undefined) =>
    n == null
      ? '—'
      : new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: code,
          minimumFractionDigits: 2,
        }).format(n)

  const txns: ExtendedTxn[] =
    (loan?.transactions as ExtendedTxn[] | undefined) ?? []

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            {/* Grouped header row */}
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Id</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>External Id</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead colSpan={5} className="text-center">
                Breakdown
              </TableHead>
              <TableHead>Loan Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>

            {/* Column labels row */}
            <TableRow className="text-base">
              <TableHead>#</TableHead>
              <TableHead>Id</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>External Id</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Transaction Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Penalties</TableHead>
              <TableHead>Loan Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {txns.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="text-center py-8 text-sm text-zinc-500"
                >
                  No transactions
                </TableCell>
              </TableRow>
            )}

            {txns.map((t, i) => (
              <TableRow key={String(t.id ?? i)} className="text-base">
                <TableCell>{i + 1}</TableCell>
                <TableCell>{t.id ?? '—'}</TableCell>
                <TableCell>{t.officeName ?? loan?.officeName ?? '—'}</TableCell>
                <TableCell>{t.externalId ?? '—'}</TableCell>
                <TableCell>{fmtDate(t.date ?? t.transactionDate)}</TableCell>
                <TableCell>
                  {t.type?.value ?? t.transactionType?.value ?? '—'}
                </TableCell>

                {/* Breakdown */}
                <TableCell className="text-right">{money(t.amount)}</TableCell>
                <TableCell className="text-right">
                  {money(t.principalPortion ?? t.principalComponent)}
                </TableCell>
                <TableCell className="text-right">
                  {money(t.interestPortion ?? t.interestComponent)}
                </TableCell>
                <TableCell className="text-right">
                  {money(t.feeChargesPortion ?? t.feeChargeComponent)}
                </TableCell>
                <TableCell className="text-right">
                  {money(t.penaltyChargesPortion ?? t.penaltyChargeComponent)}
                </TableCell>

                {/* Balance & Actions */}
                <TableCell className="text-right">
                  {money(t.outstandingLoanBalance ?? t.balance)}
                </TableCell>
                <TableCell>
                  {/* TODO: Navigate to transaction detail view */}
                  <Button size="sm" variant="secondary" disabled>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LoansTransactions
