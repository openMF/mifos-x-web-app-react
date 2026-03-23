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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MakerCheckerOr4EyeFunctionalityApi,
  type AuditData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const dummyData = [
  {
    id: 1,
    madeOnDate: '2025-06-25',
    processingResult: 'Pending',
    maker: 'admin',
    actionName: 'CREATE',
    entityName: 'Client',
  },
  {
    id: 2,
    madeOnDate: '2025-06-24',
    processingResult: 'Approved',
    maker: 'john',
    actionName: 'UPDATE',
    entityName: 'Loan',
  },
]

const makerCheckerApi = new MakerCheckerOr4EyeFunctionalityApi(
  getConfiguration()
)

const CheckerInboxContent = () => {
  const [_tasks, setTasks] = useState<AuditData[] | null>(null) // Reserved for future use: _tasks
  const [filter, setFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  useEffect(() => {
    const fetchRescheduledLoanDetails = async () => {
      try {
        const response = await makerCheckerApi.retrieveCommands()
        setTasks(response.data)
      } catch (err) {
        console.error("Couldn't fetch rescheduled loan details", err)
      }
    }

    fetchRescheduledLoanDetails()
  }, [])

  const handleToggle = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === dummyData.length
        ? []
        : dummyData.map(item => item.id)
    )
  }

  const filteredData = dummyData.filter(item =>
    item.maker.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Search & Bulk Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Search by maker"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full md:max-w-sm"
        />

        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            Approve
          </Button>
          <Button variant="destructive">Reject</Button>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
            Delete
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Input type="date" placeholder="From Date" />
        <Input type="date" placeholder="To Date" />
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Loan">Loan</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Resource ID" />
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Search
        </Button>
      </div>

      {/* Data Table */}
      {filteredData.length > 0 ? (
        <div className="rounded-md border shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedRows.length === dummyData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map(row => (
                <TableRow key={row.id} className="hover:bg-muted">
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onCheckedChange={() => handleToggle(row.id)}
                    />
                  </TableCell>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.madeOnDate}</TableCell>
                  <TableCell>{row.processingResult}</TableCell>
                  <TableCell>{row.maker}</TableCell>
                  <TableCell>{row.actionName}</TableCell>
                  <TableCell>{row.entityName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No checker inbox data available.
        </p>
      )}
    </div>
  )
}

export default CheckerInboxContent
