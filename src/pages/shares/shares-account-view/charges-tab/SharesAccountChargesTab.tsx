/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface ShareCharge {
  id?: number
  name?: string
  penalty?: boolean
  chargeTimeType?: { value?: string }
  chargeCalculationType?: { value?: string }
  amount?: number
  amountPaid?: number
  amountWaived?: number
  amountOutstanding?: number
}

const SharesAccountChargesTab = () => {
  const { accountId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true) // loading state
  const [charges, setCharges] = useState<ShareCharge[]>([]) // list of charges
  const [accountStatus, setAccountStatus] = useState<string>('') // account status text

  // fetch share account charges when accountId changes
  useEffect(() => {
    if (!accountId) return
    ;(async () => {
      try {
        const res = await fetch(
          `/api/v1/accounts/share/${accountId}?template=false`
        )
        const data = await res.json()
        const list = Array.isArray(data?.charges) ? data.charges : []
        setCharges(list)
        setAccountStatus(String(data?.status?.value || ''))
      } catch (e) {
        console.error('Failed to load share account charges', e)
        setCharges([])
      } finally {
        setLoading(false)
      }
    })()
  }, [accountId])

  // action handlers
  const onPay = (id: number) => alert(`Pay charge ${id}`)
  const onWaive = (id: number) => alert(`Waive charge ${id}`)
  const onEdit = (c: ShareCharge) => navigate(`edit/${c.id}`)
  const onDelete = (id: number) => {
    if (confirm('Delete this charge?')) alert(`Delete charge ${id}`)
  }

  return (
    <div className="tab-container">
      <h3 className="mb-4">All Charges</h3>

      {/* charges table */}
      <div className="border rounded overflow-x-auto bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Fee/Penalty</TableHead>
              <TableHead>Payment Due At</TableHead>
              <TableHead>Calculation Type</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Waived</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading / empty states */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading…</TableCell>
              </TableRow>
            ) : charges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No charges</TableCell>
              </TableRow>
            ) : (
              // render each charge row
              charges.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c?.name ?? '—'}</TableCell>
                  <TableCell>{c?.penalty ? 'Penalty' : 'Fee'}</TableCell>
                  <TableCell>{c?.chargeTimeType?.value ?? '—'}</TableCell>
                  <TableCell>
                    {c?.chargeCalculationType?.value ?? '—'}
                  </TableCell>
                  <TableCell>{c?.amount ?? '—'}</TableCell>
                  <TableCell>{c?.amountPaid ?? '—'}</TableCell>
                  <TableCell>{c?.amountWaived ?? '—'}</TableCell>
                  <TableCell>{c?.amountOutstanding ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* if still pending → allow edit/delete */}
                      {accountStatus === 'Submitted and pending approval' ? (
                        <>
                          <Button size="sm" onClick={() => onEdit(c)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => c.id != null && onDelete(c.id)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          {Number(c?.amountOutstanding ?? 0) !== 0 && (
                            <>
                              <Button
                                className="bg-[#0e77b7] hover:bg-[#0d6aa4]"
                                size="sm"
                                onClick={() => c.id != null && onPay(c.id)}
                              >
                                Pay
                              </Button>
                              <Button
                                className="bg-[#0e77b7] hover:bg-[#0d6aa4]"
                                size="sm"
                                onClick={() => c.id != null && onWaive(c.id)}
                              >
                                Waive
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SharesAccountChargesTab
