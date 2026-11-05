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

import { getConfiguration } from '@/lib/fineract-openapi'
import { AccountingRulesApi, type AccountingRuleData } from '@/fineract-api'

import { Plus } from 'lucide-react'
import { formatTags, formatAccounts } from './accounting-rules.utils'

//accounting API
const accountingRulesApi = new AccountingRulesApi(getConfiguration())

const AccountingRules = () => {
  const navigate = useNavigate()

  //state to fetch accouting data
  const [rules, setRules] = useState<AccountingRuleData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let isCurrent = true
    const fetchRules = async () => {
      try {
        setIsLoading(true)
        const response = await accountingRulesApi.retrieveAllAccountingRules()
        if (isCurrent) {
          setRules(response.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch accounting rules', err)
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }
    fetchRules()

    return () => {
      isCurrent = false
    }
  }, [])

  const filtered = rules.filter(rule =>
    rule.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Accounting Rules', current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/accounting/accounting-rules/create')}
        >
          <Plus className="mr-2" /> Add Rule
        </Button>
      </div>

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

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* Accounting table */}
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page {page}{' '}
            of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">Office</TableHead>
              <TableHead className="px-6 py-4">Debit Tags</TableHead>
              <TableHead className="px-6 py-4">Debit Account</TableHead>
              <TableHead className="px-6 py-4">Credit Tags</TableHead>
              <TableHead className="px-6 py-4">Credit Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading accounting rules...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No accounting rules found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((rule, idx) => (
                <TableRow
                  key={rule.id ?? idx}
                  onClick={() =>
                    navigate(`/accounting/accounting-rules/view/${rule.id}`)
                  }
                  className="text-base hover:bg-muted cursor-pointer"
                >
                  <TableCell className="px-6 py-4">{rule.name}</TableCell>
                  <TableCell className="px-6 py-4">{rule.officeName}</TableCell>
                  <TableCell className="px-6 py-4">
                    {formatTags(rule.debitTags)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {formatAccounts(rule.debitAccounts)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {formatTags(rule.creditTags)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {formatAccounts(rule.creditAccounts)}
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

export default AccountingRules
