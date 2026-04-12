/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type HookRow = {
  template: string
  name: string
  enabled: boolean
}

const ManageHooks = () => {
  const navigate = useNavigate()

  // Local state
  const [rows] = useState<HookRow[]>([])
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter + pagination
  const filtered = rows.filter(
    r =>
      r.template.toLowerCase().includes(filter.toLowerCase()) ||
      r.name.toLowerCase().includes(filter.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const onPerPage = (v: string) => {
    setItemsPerPage(parseInt(v, 10))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Manage Hooks', current: true },
        ]}
      />

      {/* Create Hook button */}
      <div className="flex mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/system/hooks/create')}
        >
          <Plus className="mr-2" /> Create Hook
        </Button>
      </div>

      {/* Search + pagination controls */}
      <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
        Filter
      </div>
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search hooks..."
          value={filter}
          onChange={e => {
            setFilter(e.target.value)
            setPage(1)
          }}
          className="max-w-xl h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select value={itemsPerPage.toString()} onValueChange={onPerPage}>
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Hooks table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Hook Template</TableHead>
              <TableHead className="px-6 py-4">Hook Name</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-zinc-500"
                >
                  0 of 0
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r, i) => (
                <TableRow
                  key={`${r.template}-${r.name}-${i}`}
                  className="text-base"
                >
                  <TableCell className="px-6 py-4">{r.template}</TableCell>
                  <TableCell className="px-6 py-4">{r.name}</TableCell>
                  <TableCell className="px-6 py-4">
                    {r.enabled ? 'Enabled' : 'Disabled'}
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

export default ManageHooks
