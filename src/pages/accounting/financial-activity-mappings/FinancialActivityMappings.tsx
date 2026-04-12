/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  MappingFinancialActivitiesToAccountsApi,
  type GetFinancialActivityAccountsResponse,
} from '@/fineract-api'

// API client
const financialActivityApi = new MappingFinancialActivitiesToAccountsApi(
  getConfiguration()
)

const FinancialActivityMappings = () => {
  const navigate = useNavigate()

  // Data + UI state
  const [mappings, setMappings] = useState<
    GetFinancialActivityAccountsResponse[]
  >([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Initial fetch
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const response = await financialActivityApi.retrieveAll()
        setMappings(response.data || [])
      } catch (err) {
        console.error('Failed to fetch financial activity mappings', err)
      }
    }
    fetchMappings()
  }, [])

  // Text filter on financial activity name
  const filtered = mappings.filter(mapping =>
    mapping.financialActivityData?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Items-per-page change resets to page 1
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Financial Activity Mappings', current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() =>
            navigate('/accounting/financial-activity-mappings/create')
          }
        >
          <Plus className="mr-2" /> Define New Mapping
        </Button>
      </div>

      {/* Filter + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        {/* Search by FA */}
        <Input
          placeholder="Filter by Financial Activity"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />

        {/* Items per page + Prev/Next */}
        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
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

      {/* Mappings table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption
            className="text-sm text-gray-5
00 dark:text-gray-400 pt-6 pb-2"
          >
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>

          {/* Header */}
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Financial Activity</TableHead>
              <TableHead className="px-6 py-4">Account Type</TableHead>
              <TableHead className="px-6 py-4">Account Code</TableHead>
              <TableHead className="px-6 py-4">Account Name</TableHead>
            </TableRow>
          </TableHeader>

          {/* Rows */}
          <TableBody>
            {paginated.map((mapping, idx) => (
              <TableRow
                key={idx}
                onClick={() =>
                  navigate(
                    `/accounting/financial-activity-mappings/${mapping.id}`
                  )
                }
                className="text-base hover:bg-muted"
              >
                <TableCell className="px-6 py-4">
                  {mapping.financialActivityData?.name}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {mapping.financialActivityData?.mappedGLAccountType || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {mapping.glAccountData?.glCode || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {mapping.glAccountData?.name || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default FinancialActivityMappings
