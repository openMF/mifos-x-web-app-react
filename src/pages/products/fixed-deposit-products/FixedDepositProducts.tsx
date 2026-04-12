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
  FixedDepositProductApi,
  type GetFixedDepositProductsResponse,
} from '@/fineract-api'

// API instance for Fixed Deposit Products
const fdApi = new FixedDepositProductApi(getConfiguration())

const FixedDepositProducts = () => {
  const [products, setProducts] = useState<GetFixedDepositProductsResponse[]>(
    []
  )
  const [searchTerm, setSearchTerm] = useState('') // search filter
  const [page, setPage] = useState(1) // pagination page
  const [itemsPerPage, setItemsPerPage] = useState(10) // items shown per page
  const navigate = useNavigate()

  // Fetch FD products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fdApi.retrieveAll30() // API call to fetch all FD products
        setProducts(res.data || [])
      } catch (err) {
        console.error('Failed to fetch FD products', err)
      }
    }
    fetchData()
  }, [])

  // Apply search filter
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
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
          { label: 'Fixed Deposit Products', current: true },
        ]}
      />

      {/* Create button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/products/fixed-deposits/create')}
        >
          <Plus className="mr-2" /> Create Fixed Deposit Product
        </Button>
      </div>

      {/* Search & Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Filter"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />

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

          {/* Pagination buttons */}
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

      {/* Table for FD Products */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Short Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(p => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                onClick={() =>
                  navigate(`/products/fixed-deposit-products/${p.id}/general`)
                }
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {p.name}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {p.shortName}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default FixedDepositProducts
