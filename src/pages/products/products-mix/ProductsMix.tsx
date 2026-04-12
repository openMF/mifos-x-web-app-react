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
import { LoanProductsApi, type GetLoanProductsResponse } from '@/fineract-api'

// API client instance for Loan Products
const productMixApi = new LoanProductsApi(getConfiguration())

const ProductsMix = () => {
  const navigate = useNavigate()

  // state for storing product mixes
  const [mixes, setMixes] = useState<GetLoanProductsResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('') // filter input
  const [page, setPage] = useState(1) // pagination current page
  const [itemsPerPage, setItemsPerPage] = useState(10) // rows per page

  useEffect(() => {
    // fetch loan products with productMixes association
    const fetchProductMixes = async () => {
      try {
        const res = await productMixApi.retrieveAllLoanProducts({
          params: { associations: 'productMixes' },
        })
        setMixes(res.data || [])
      } catch (err) {
        console.error('Failed to fetch product mixes', err)
      }
    }
    fetchProductMixes()
  }, [])

  // search filtering
  const filtered = mixes.filter(mix =>
    mix.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // update rows per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          { label: 'Products Mix', current: true },
        ]}
      />

      {/* Add new product mix button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/products/products-mix/create')}
        >
          <Plus className="mr-2" /> Add
        </Button>
      </div>

      {/* Search + Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        {/* Search box */}
        <Input
          placeholder="Search Product Mix..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />

        {/* Pagination size selector */}
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

          {/* Prev/Next pagination */}
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

      {/* Table for Product Mix listing */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Product Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(mix => (
              <TableRow
                key={mix.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {mix.name}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProductsMix
