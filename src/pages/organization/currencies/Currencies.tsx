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
import { CurrencyApi, type CurrencyData } from '@/fineract-api'

const currenciesApi = new CurrencyApi(getConfiguration())

const Currencies = () => {
  const navigate = useNavigate()
  const [currencies, setCurrencies] = useState<CurrencyData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // fetch currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await currenciesApi.retrieveCurrencies()
        setCurrencies(response.data.selectedCurrencyOptions ?? [])
      } catch (err) {
        console.error('Failed to fetch currencies', err)
      }
    }
    fetchCurrencies()
  }, [])

  // filter by search term
  const filtered = currencies.filter(currency =>
    currency.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Currency Configuration', current: true },
        ]}
      />

      {/* add/edit button */}
      <div className="flex gap-4 mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/currencies/manage')}
        >
          <Plus className="mr-2" /> Add/Edit
        </Button>
      </div>

      {/* search + pagination controls */}
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

      {/* currencies table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Currency Name</TableHead>
              <TableHead className="px-6 py-4">Currency Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(currency => (
              <TableRow key={currency.code}>
                <TableCell className="px-6 py-4">
                  {currency.name || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {currency.code || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Currencies
