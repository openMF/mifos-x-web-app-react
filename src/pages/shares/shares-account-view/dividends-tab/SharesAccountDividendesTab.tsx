/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface Dividend {
  id?: number
  transactionDate?: unknown
  date?: unknown
  amount?: number
  transactionReference?: string
  referenceNumber?: string
  status?: Record<string, unknown>
}

const fmtDate = (d: unknown) => {
  if (!d) return '—'
  if (Array.isArray(d)) {
    const [y, m, day] = d
    const dt = new Date(y, (m ?? 1) - 1, day ?? 1)
    return dt.toLocaleDateString()
  }
  const dt = new Date(d as string | number)
  return isNaN(+dt) ? '—' : dt.toLocaleDateString()
}

const SharesAccountDividendesTab = () => {
  const { accountId } = useParams() // get accountId from URL
  const [loading, setLoading] = useState(true)
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [currencyCode, setCurrencyCode] = useState<string>('')

  // fetch dividends for this shares account
  useEffect(() => {
    if (!accountId) return
    ;(async () => {
      try {
        const res = await fetch(
          `/api/v1/accounts/share/${accountId}?template=false`
        )
        const data = await res.json()
        setDividends(Array.isArray(data?.dividends) ? data.dividends : [])
        setCurrencyCode(data?.currency?.code || data?.currencyCode || '')
      } catch (e) {
        console.error('Failed to load dividends', e)
        setDividends([])
      } finally {
        setLoading(false)
      }
    })()
  }, [accountId])

  // helper: format money with currency
  const fmtMoney = (n: unknown) => {
    const val = Number(n)
    if (isNaN(val)) return '—'
    try {
      return new Intl.NumberFormat(undefined, {
        style: currencyCode ? 'currency' : 'decimal',
        currency: currencyCode || undefined,
        minimumFractionDigits: 2,
      }).format(val)
    } catch {
      return val.toFixed(2)
    }
  }

  return (
    <div className="tab-container">
      <h3 className="mb-4">Dividends</h3>

      {/* dividends table */}
      <div className="border rounded overflow-x-auto bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction Reference</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading / empty / data states */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading…</TableCell>
              </TableRow>
            ) : dividends.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No dividends</TableCell>
              </TableRow>
            ) : (
              dividends.map((d, idx) => (
                <TableRow key={d?.id ?? idx}>
                  <TableCell>
                    {fmtDate(d?.transactionDate ?? d?.date)}
                  </TableCell>
                  <TableCell>{String(fmtMoney(d?.amount))}</TableCell>
                  <TableCell>
                    {d?.transactionReference ?? d?.referenceNumber ?? '—'}
                  </TableCell>
                  <TableCell>{String(d?.status?.value ?? '—')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SharesAccountDividendesTab
