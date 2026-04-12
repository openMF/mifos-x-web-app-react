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

import {
  TellerCashManagementApi,
  type GetTellersResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faEye } from '@fortawesome/free-solid-svg-icons'
import { Plus } from 'lucide-react'

const tellersApi = new TellerCashManagementApi(getConfiguration())

const Tellers = () => {
  const [tellers, setTellers] = useState<GetTellersResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()

  // fetch list once
  useEffect(() => {
    const fetchTellers = async () => {
      try {
        const res = await tellersApi.getTellerData()
        setTellers(res.data || [])
      } catch (err) {
        console.error('Failed to fetch tellers', err)
      }
    }
    fetchTellers()
  }, [])

  // search filter
  const filtered = tellers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // pagination
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
          { label: 'Organization', href: '/organization' },
          { label: 'Tellers', current: true },
        ]}
      />

      {/* create */}
      <div className="flex mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/tellers/create')}
        >
          <Plus className="mr-2" /> Create Teller
        </Button>
      </div>

      {/* controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search Tellers..."
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
            onValueChange={v => {
              setItemsPerPage(parseInt(v))
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

          {/* pager */}
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
              <TableHead className="px-6 py-4">Branch</TableHead>
              <TableHead className="px-6 py-4">Teller Name</TableHead>
              <TableHead className="px-6 py-4 text-center">Status</TableHead>
              <TableHead className="px-6 py-4 text-center">
                Started On
              </TableHead>
              <TableHead className="px-6 py-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map(teller => (
              <TableRow
                key={teller.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                onClick={() => navigate(`/organization/tellers/${teller.id}`)} // row -> details
              >
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {teller.officeName || '—'}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {teller.name || '—'}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className={`${teller.status?.toLowerCase() === 'active' ? 'text-green-500' : 'text-red-500'} text-sm`}
                  />
                </TableCell>
                <TableCell className="px-6 py-4 text-center text-zinc-700 dark:text-zinc-200">
                  {teller.startDate}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  {/* action: go to cashiers */}
                  <Button
                    variant="link"
                    onClick={() =>
                      navigate(`/organization/tellers/${teller.id}/cashiers`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-2" />
                    View Cashiers
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Tellers
