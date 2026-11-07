/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, RotateCcw, NotebookText } from 'lucide-react'

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
  ProvisioningEntriesApi,
  type PageProvisioningEntryData,
  type ProvisioningEntryData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const provisioningEntriesApi = new ProvisioningEntriesApi(getConfiguration())

type ProvisioningEntryRow = ProvisioningEntryData & {
  journalEntryId?: number | null
}

const ProvisioningEntries = () => {
  const navigate = useNavigate()

  const [entries, setEntries] = useState<ProvisioningEntryRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const offset = (page - 1) * itemsPerPage
        const res = await provisioningEntriesApi.retrieveAllProvisioningEntries(
          offset,
          itemsPerPage
        )

        if (cancelled) return

        const data: PageProvisioningEntryData = res.data || {}
        const pageItems = (data.pageItems ?? []) as ProvisioningEntryRow[]
        setEntries(pageItems)
        setTotal(data.totalFilteredRecords ?? pageItems.length)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch provisioning entries', err)
        setError('Unable to load provisioning entries.')
        setEntries([])
        setTotal(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [itemsPerPage, page])

  const filtered = entries.filter(e =>
    (e.createdUser ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  const visibleRows = searchTerm ? filtered : entries

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Provisioning Entries', current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/accounting/provisioning-entries/create')}
        >
          <Plus className="mr-2" /> Create Provisioning Entry
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Filter by Created By"
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
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {visibleRows.length} of{' '}
            {searchTerm ? visibleRows.length : total} items • Page {page} of{' '}
            {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Created By</TableHead>
              <TableHead className="px-6 py-4">Created On</TableHead>
              <TableHead className="px-6 py-4">Journal Entry Created</TableHead>
              <TableHead className="px-6 py-4">View Report</TableHead>
              <TableHead className="px-6 py-4">Recreate Provisioning</TableHead>
              <TableHead className="px-6 py-4">View Journal Entry</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-sm text-zinc-500"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-sm text-red-600"
                >
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-sm text-zinc-500"
                >
                  No provisioning entries
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              visibleRows.map(row => {
                const createdOn = row.createdDate
                  ? new Date(row.createdDate).toLocaleDateString()
                  : '—'
                const jeCreated = row.journalEntry ? 'Yes' : 'No'

                return (
                  <TableRow key={row.id} className="text-base hover:bg-muted">
                    <TableCell className="px-6 py-4">
                      {row.createdUser ?? '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4">{createdOn}</TableCell>
                    <TableCell className="px-6 py-4">{jeCreated}</TableCell>

                    <TableCell className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/accounting/provisioning-entries/${row.id}/report`
                          )
                        }
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/accounting/provisioning-entries/${row.id}/recreate`
                          )
                        }
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Recreate
                      </Button>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      {row.journalEntryId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/accounting/journal-entries/view/${row.journalEntryId}`
                            )
                          }
                        >
                          <NotebookText className="mr-2 h-4 w-4" />
                          View JE
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProvisioningEntries
