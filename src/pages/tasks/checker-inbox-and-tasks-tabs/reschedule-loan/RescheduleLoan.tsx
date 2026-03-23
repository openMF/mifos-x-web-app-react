/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  RescheduleLoansApi,
  type GetLoanRescheduleRequestResponse,
} from '@/fineract-api'

const rescheduleLoanApi = new RescheduleLoansApi(getConfiguration())

const RescheduleLoan = () => {
  const [rescheduleLoans, setRescheduleLoans] = useState<
    GetLoanRescheduleRequestResponse[]
  >([])
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  useEffect(() => {
    const fetchRescheduledLoanDetails = async () => {
      try {
        const response =
          await rescheduleLoanApi.retrieveAllRescheduleRequest('pending')
        setRescheduleLoans(response.data ?? [])
      } catch (err) {
        console.error("Couldn't fetch rescheduled loan details", err)
      }
    }

    fetchRescheduledLoanDetails()
  }, [])

  const filteredLoans = rescheduleLoans.filter(loan =>
    loan.clientName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedRows(filteredLoans.map(loan => loan.id!))
  }

  const approveSelected = () => {}

  const rejectSelected = () => {}

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {filteredLoans.length > 0 && (
          <div>
            <Input
              placeholder="Filter by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-1/2"
            />
            <div className="flex gap-2">
              <Button
                className="bg-green-600 text-white"
                onClick={approveSelected}
              >
                Approve
              </Button>
              <Button
                className="bg-yellow-600 text-white"
                onClick={rejectSelected}
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>

      {filteredLoans.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={selectedRows.length === filteredLoans.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Reschedule Request #</TableHead>
              <TableHead>Loan Account #</TableHead>
              <TableHead>Reschedule From</TableHead>
              <TableHead>Reschedule Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map(loan => (
              <TableRow
                key={loan.id}
                onClick={() => handleToggle(loan.id!)}
                className="cursor-pointer"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(loan.id!)}
                    onCheckedChange={() => handleToggle(loan.id!)}
                  />
                </TableCell>
                <TableCell>{loan.clientName ?? 'Unnamed'}</TableCell>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.loanAccountNumber}</TableCell>
                <TableCell>{loan.rescheduleFromDate}</TableCell>
                <TableCell>
                  {loan.rescheduleReasonCodeValue?.name ?? '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No pending rescheduled loan available for this account.
        </div>
      )}
    </div>
  )
}

export default RescheduleLoan
