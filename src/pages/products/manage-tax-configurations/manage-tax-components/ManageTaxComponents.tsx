/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { getConfiguration } from '@/lib/fineract-openapi'
import {
  TaxComponentsApi,
  type GetTaxesComponentsResponse,
} from '@/fineract-api'

// API client for tax components
const taxApi = new TaxComponentsApi(getConfiguration())

const ManageTaxComponents = () => {
  // State for tax components
  const [components, setComponents] = useState<GetTaxesComponentsResponse[]>([])
  // State for search filter
  const [searchTerm, setSearchTerm] = useState('')
  // Pagination states
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const navigate = useNavigate()

  // Fetch tax components on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await taxApi.retrieveAllTaxComponents() // correct endpoint for tax components
        setComponents(res.data || [])
      } catch (err) {
        console.error('Failed to fetch tax components', err)
      }
    }
    fetch()
  }, [])

  // Apply search filter
  const filtered = components.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Tax Configurations',
            href: '/products/tax-configurations',
          },
          { label: 'Tax Components', current: true },
        ]}
      />

      {/* Create button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() =>
            navigate('/products/tax-configurations/tax-components/create')
          }
        >
          <Plus className="mr-2" /> Create Tax Component
        </Button>
      </div>

      {/* Search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        {/* Search input */}
        <Input
          placeholder="Filter"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1) // reset to first page when searching
          }}
          className="max-w-sm h-11 text-base"
        />

        {/* Pagination dropdown and buttons */}
        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={val => {
              setItemsPerPage(parseInt(val))
              setPage(1)
            }}
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

          {/* Prev / Next navigation */}
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

      {/* Table of Tax Components */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Percentage %</TableHead>
              <TableHead className="px-6 py-4">Start Date</TableHead>
              <TableHead className="px-6 py-4">Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(c => (
              <TableRow
                key={c.id}
                className="text-base hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() =>
                  navigate(
                    `/products/tax-configurations/tax-components/${c.id}`
                  )
                }
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {c.name}
                </TableCell>
                <TableCell className="px-6 py-4">{c.percentage}</TableCell>
                <TableCell className="px-6 py-4">{c.startDate}</TableCell>
                <TableCell className="px-6 py-4">
                  {c.creditAccount?.name || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ManageTaxComponents
