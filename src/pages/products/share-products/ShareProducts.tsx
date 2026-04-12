/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  SelfShareProductsApi,
  type GetProductsTypeProductIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const shareApi = new SelfShareProductsApi(getConfiguration())

const ShareProducts = () => {
  const navigate = useNavigate()

  // data
  const [products, setProducts] = useState<GetProductsTypeProductIdResponse[]>(
    []
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // load list
  useEffect(() => {
    const fetchShareProducts = async () => {
      try {
        const res = await shareApi.retrieveAllProducts1()
        const items = res.data
        setProducts(
          typeof items !== 'string' && items
            ? (items as GetProductsTypeProductIdResponse[])
            : []
        )
      } catch (err) {
        console.error('Failed to fetch share products', err)
      }
    }
    fetchShareProducts()
  }, [])

  // filter + paginate
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          { label: 'Share Products', current: true },
        ]}
      />

      {/* create */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-white text-base"
          onClick={() => navigate('/products/share-products/create')}
        >
          + Create Share Product
        </Button>
      </div>

      {/* controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search Share Products..."
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
            onValueChange={value => {
              setItemsPerPage(parseInt(value))
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

      {/* table */}
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
              <TableHead className="px-6 py-4">Total Shares</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map(product => (
              <TableRow
                key={product.id}
                onClick={() =>
                  navigate(`/products/share-products/${product.id}`)
                }
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {product.name}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {product.shortName}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {product.totalShares}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ShareProducts
