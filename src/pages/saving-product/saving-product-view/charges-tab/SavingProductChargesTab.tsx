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
  SavingsAccountApi,
  type SavingsAccountChargeData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

const api = new SavingsAccountApi(getConfiguration())

const SavingProductChargesTab = () => {
  const { accountId } = useParams()
  const navigate = useNavigate()

  // state
  const [loading, setLoading] = useState(true)
  const [charges, setCharges] = useState<SavingsAccountChargeData[]>([])
  const [showInactive, setShowInactive] = useState(false)
  const [accountStatus, setAccountStatus] = useState<string>('')

  // fetch charges from API
  useEffect(() => {
    if (!accountId) return
    ;(async () => {
      try {
        const res = await api.retrieveOne25(
          Number(accountId),
          undefined,
          undefined,
          'charges'
        )
        setCharges(res?.data?.charges || [])
        setAccountStatus(res?.data?.status?.value || '')
      } catch (e) {
        console.error('Failed to load charges', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [accountId])

  // filter charges based on toggle
  const filtered = charges.filter(c =>
    showInactive ? c?.isActive === false : c?.isActive !== false
  )

  // action handlers
  const onPay = (id: number) => alert(`Pay charge ${id}`)
  const onWaive = (id: number) => alert(`Waive charge ${id}`)
  const onInactivate = (id: number) => alert(`Inactivate charge ${id}`)
  const onEdit = (charge: SavingsAccountChargeData) =>
    navigate(`edit/${charge.id}`)
  const onDelete = (id: number) => {
    if (confirm('Delete this charge?')) alert(`Delete charge ${id}`)
  }

  return (
    <div className="tab-container">
      {/* header row */}
      <div className="flex items-start gap-4 mb-5">
        <h3 className="m-0">Charges</h3>
        {charges.length > 0 && (
          <Button
            onClick={() => setShowInactive(v => !v)}
            className="bg-[#0e77b7] hover:bg-[#0d6aa4]"
          >
            {showInactive ? 'View Active Charges' : 'View Inactive Charges'}
          </Button>
        )}
      </div>

      {/* table wrapper */}
      <div className="border rounded overflow-x-auto bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Charge Type</TableHead>
              <TableHead>Payment Due At</TableHead>
              <TableHead>Due As Of</TableHead>
              <TableHead>Repeats On (M/d)</TableHead>
              <TableHead>Calculation Type</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Waived</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading empty states */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={11}>Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>No charges</TableCell>
              </TableRow>
            ) : (
              // list charges
              filtered.map(charge => (
                <TableRow key={charge.id} className="select-row">
                  <TableCell>{charge.name}</TableCell>
                  <TableCell>{charge.penalty ? 'Penalty' : 'Fee'}</TableCell>
                  <TableCell>{charge?.chargeTimeType?.value}</TableCell>
                  <TableCell>{charge?.dueDate || ''}</TableCell>
                  <TableCell>
                    {Array.isArray(charge?.feeOnMonthDay)
                      ? charge.feeOnMonthDay.join('/')
                      : ''}
                  </TableCell>
                  <TableCell>{charge?.chargeCalculationType?.value}</TableCell>
                  <TableCell>{charge?.amount}</TableCell>
                  <TableCell>{charge?.amountPaid}</TableCell>
                  <TableCell>{charge?.amountWaived}</TableCell>
                  <TableCell>{charge?.amountOutstanding}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {accountStatus === 'Submitted and pending approval' ? (
                        <>
                          {/* editable in draft mode */}
                          <Button size="sm" onClick={() => onEdit(charge)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(charge.id!)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* active charges actions */}
                          {charge?.amountOutstanding !== 0 && (
                            <>
                              <Button
                                className="bg-[#0e77b7] hover:bg-[#0d6aa4]"
                                size="sm"
                                onClick={() => onPay(charge.id!)}
                              >
                                $
                              </Button>
                              <Button
                                className="bg-[#0e77b7] hover:bg-[#0d6aa4]"
                                size="sm"
                                onClick={() => onWaive(charge.id!)}
                              >
                                Flag
                              </Button>
                              {'recurring' in charge && charge.recurring && (
                                <Button
                                  size="sm"
                                  onClick={() => onInactivate(charge.id!)}
                                >
                                  Ban
                                </Button>
                              )}
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

export default SavingProductChargesTab
