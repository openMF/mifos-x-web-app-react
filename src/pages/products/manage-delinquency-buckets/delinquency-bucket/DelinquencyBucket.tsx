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
  DelinquencyRangeAndBucketsManagementApi,
  type DelinquencyBucketData,
} from '@/fineract-api'

// API instance
const delinquencyApi = new DelinquencyRangeAndBucketsManagementApi(
  getConfiguration()
)

const DelinquencyBucket = () => {
  const [buckets, setBuckets] = useState<DelinquencyBucketData[]>([]) // all fetched buckets
  const [searchTerm, setSearchTerm] = useState('') // search filter
  const [page, setPage] = useState(1) // current page
  const [itemsPerPage, setItemsPerPage] = useState(10) // pagination size
  const navigate = useNavigate()

  // Fetch all delinquency buckets on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await delinquencyApi.getDelinquencyBuckets()
        setBuckets(res.data || [])
      } catch (err) {
        console.error('Failed to fetch delinquency buckets', err)
      }
    }
    fetch()
  }, [])

  // Filter buckets by search
  const filtered = buckets.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Delinquency Bucket Configurations',
            href: '/products/delinquency-bucket-configurations',
          },
          { label: 'Delinquency Buckets', current: true },
        ]}
      />

      {/* Create new bucket button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() =>
            navigate(
              '/products/delinquency-bucket-configurations/buckets/create'
            )
          }
        >
          <Plus className="mr-2" /> Create Delinquency Bucket
        </Button>
      </div>

      {/* Search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Filter Deliquency Buckets"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1) // reset to first page when filtering
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={val => {
              setItemsPerPage(parseInt(val))
              setPage(1) // reset page on size change
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

          {/* Prev/Next buttons */}
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

      {/* Buckets table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(b => (
              <TableRow
                key={b.id}
                className="text-base hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                onClick={() =>
                  navigate(
                    `/products/delinquency-bucket-configurations/buckets/${b.id}`
                  )
                } // navigate to bucket details
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {b.name}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DelinquencyBucket
