/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface ShareAccount {
  timeline?: Record<string, unknown>
  currency?: { name?: string; code?: string }
  summary?: Record<string, unknown>
  externalId?: string
  savingsAccountId?: number
  savingsAccountNumber?: number
  [key: string]: unknown
}

const fmtDate = (d: unknown) => {
  if (!d) return 'Not Activated'
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d
    return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
  const dt = new Date(d as string | number)
  return isNaN(+dt)
    ? 'Not Activated'
    : dt.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
}

// helper: format number to 2 decimals
const to2 = (n: unknown) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0))

const SharesAccountGeneralTab = () => {
  const { clientId, sharesAccountId } = useParams()
  const [data, setData] = useState<ShareAccount | null>(null)
  const [loading, setLoading] = useState(true)

  // fetch share account details on mount
  useEffect(() => {
    if (!sharesAccountId) return
    ;(async () => {
      try {
        const res = await fetch(
          `/api/v1/accounts/share/${sharesAccountId}?template=false`
        )
        const json = await res.json()
        setData(json || null)
      } catch (e) {
        console.error('Failed to load shares account', e)
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [sharesAccountId])

  if (loading) {
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
    )
  }
  if (!data) return null

  const tl = data.timeline || {}
  const cur = data.currency || {}
  const summary = data.summary || {}
  const activatedOn = tl.activatedOnDate ?? tl.activatedDate ?? null

  const currencyLabel = [cur.name, cur.code ? `[${cur.code}]` : '']
    .filter(Boolean)
    .join(' ')

  // linked savings account for dividend posting
  const savingsAccountId = data.savingsAccountId
  const savingsAccountNo =
    data.savingsAccountNumber != null
      ? String(data.savingsAccountNumber).padStart(9, '0')
      : '—'
  const savingsLink =
    clientId && savingsAccountId
      ? `/clients/${clientId}/savings-accounts/${savingsAccountId}/general`
      : '#'

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* shares details card */}
      <div className="md:w-1/2">
        <h4 className="font-semibold mb-2">Shares Details</h4>
        <Table className="border">
          <TableBody>
            <TableRow>
              <TableCell className="bg-zinc-100 w-1/2">Activated On</TableCell>
              <TableCell>{fmtDate(activatedOn)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-zinc-100">Currency</TableCell>
              <TableCell>{currencyLabel || '—'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-zinc-100">External Id</TableCell>
              <TableCell>{data.externalId || 'Unassigned'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-zinc-100">
                Linked Savings Account (Dividend Posting)
              </TableCell>
              <TableCell>
                {savingsAccountId ? (
                  <Link to={savingsLink} className="text-blue-600 underline">
                    {savingsAccountNo}
                  </Link>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* account summary card */}
      <div className="md:w-1/2">
        <h4 className="font-semibold mb-2">Account Summary</h4>
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead className="w-full"></TableHead>
              <TableHead className="text-right w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="bg-zinc-100">
                Pending for Approval Shares
              </TableCell>
              <TableCell className="text-right">
                {to2(summary.totalPendingForApprovalShares)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-zinc-100">Approved Shares</TableCell>
              <TableCell className="text-right">
                {to2(summary.totalApprovedShares)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SharesAccountGeneralTab
