/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AuditsApi, type AuditSearchData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { formatAuditDateTime } from './format'
import type { AuditAppUser, AuditPage } from './types'

const auditsApi = new AuditsApi(getConfiguration())

const PAGE_SIZE = 10

/** Value AppSelect uses for "no filter" (Radix Select rejects '') */
const ANY = 'any'

type Filters = {
  makerId: string
  actionName: string
  entityName: string
  resourceId: string
  processingResult: string
  checkerId: string
  fromDate: string
  toDate: string
}

const emptyFilters: Filters = {
  makerId: ANY,
  actionName: ANY,
  entityName: ANY,
  resourceId: '',
  processingResult: ANY,
  checkerId: ANY,
  fromDate: '',
  toDate: '',
}

const orUndefined = (value: string) =>
  value === ANY || value === '' ? undefined : value

const withAny = (options: { id: string; name: string }[]) => [
  { id: ANY, name: 'Any' },
  ...options,
]

/**
 * System > Audit Trails: every command run on the system, filtered by user,
 * action, entity, resource, status, checker and date (GET /audits,
 * GET /audits/searchtemplate), as in the Angular web app.
 */
const AuditTrails = () => {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<AuditSearchData>({})
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<AuditPage>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await auditsApi.retrieveAuditSearchTemplate()
        setTemplate(res.data ?? {})
      } catch (err) {
        console.error('Failed to fetch audit search template', err)
      }
    }
    fetchTemplate()
  }, [])

  useEffect(() => {
    // Ignore a response that arrives after the filters or page changed
    let ignore = false
    const fetchAudits = async () => {
      setLoading(true)
      setError(null)
      try {
        const resourceId = orUndefined(applied.resourceId)
        const makerId = orUndefined(applied.makerId)
        const checkerId = orUndefined(applied.checkerId)
        const res = await auditsApi.retrieveAuditEntries(
          orUndefined(applied.actionName),
          orUndefined(applied.entityName),
          resourceId ? Number(resourceId) : undefined,
          makerId ? Number(makerId) : undefined,
          orUndefined(applied.fromDate),
          orUndefined(applied.toDate),
          checkerId ? Number(checkerId) : undefined,
          undefined, // checkerDateTimeFrom
          undefined, // checkerDateTimeTo
          // Fineract filters on status; processingResult is ignored
          orUndefined(applied.processingResult), // status
          undefined, // clientId
          undefined, // loanId
          undefined, // officeId
          undefined, // groupId
          undefined, // savingsAccountId
          undefined, // processingResult
          'yyyy-MM-dd',
          'en',
          page * PAGE_SIZE,
          PAGE_SIZE,
          'id',
          'DESC',
          true
        )
        if (ignore) return
        // The generated client types this response as a string
        setData(res.data as unknown as AuditPage)
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch audit trails', err)
        setData({})
        setError('Failed to load audit trails.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchAudits()
    return () => {
      ignore = true
    }
  }, [applied, page])

  const total = data.totalFilteredRecords ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rows = data.pageItems ?? []

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      filters.fromDate &&
      filters.toDate &&
      filters.fromDate > filters.toDate
    ) {
      setError('From Date must be on or before To Date.')
      return
    }
    setPage(0)
    setApplied(filters)
  }

  const handleReset = () => {
    setError(null)
    setFilters(emptyFilters)
    setPage(0)
    setApplied(emptyFilters)
  }

  const userOptions = withAny(
    ((template.appUsers ?? []) as AuditAppUser[]).map(user => ({
      id: user.id?.toString() ?? '',
      name: user.username ?? '',
    }))
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Audit Trails', current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mb-4">Audit Trails</h1>

      <form
        className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow mb-6 space-y-4"
        onSubmit={handleSearch}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AppSelect
            selectLabel="User"
            selectPlaceholder="Any"
            selectValue={filters.makerId}
            selectOnChange={value => setFilter('makerId', value)}
            selectClassname="w-full space-y-2"
            selectOptions={userOptions}
          />
          <AppSelect
            selectLabel="Action"
            selectPlaceholder="Any"
            selectValue={filters.actionName}
            selectOnChange={value => setFilter('actionName', value)}
            selectClassname="w-full space-y-2"
            selectOptions={withAny(
              (template.actionNames ?? []).map(name => ({ id: name, name }))
            )}
          />
          <AppSelect
            selectLabel="Entity"
            selectPlaceholder="Any"
            selectValue={filters.entityName}
            selectOnChange={value => setFilter('entityName', value)}
            selectClassname="w-full space-y-2"
            selectOptions={withAny(
              (template.entityNames ?? []).map(name => ({ id: name, name }))
            )}
          />
          <div className="w-full space-y-2">
            <Label htmlFor="resourceId">Resource ID</Label>
            <Input
              id="resourceId"
              type="number"
              min={1}
              value={filters.resourceId}
              onChange={e => setFilter('resourceId', e.target.value)}
            />
          </div>
          <AppSelect
            selectLabel="Status"
            selectPlaceholder="Any"
            selectValue={filters.processingResult}
            selectOnChange={value => setFilter('processingResult', value)}
            selectClassname="w-full space-y-2"
            selectOptions={withAny(
              (template.statuses ?? []).map(status => ({
                id: status.id?.toString() ?? '',
                name: status.processingResult ?? '',
              }))
            )}
          />
          <AppSelect
            selectLabel="Checker"
            selectPlaceholder="Any"
            selectValue={filters.checkerId}
            selectOnChange={value => setFilter('checkerId', value)}
            selectClassname="w-full space-y-2"
            selectOptions={userOptions}
          />
          <div className="w-full space-y-2">
            <Label htmlFor="fromDate">From Date</Label>
            <Input
              id="fromDate"
              type="date"
              value={filters.fromDate}
              onChange={e => setFilter('fromDate', e.target.value)}
            />
          </div>
          <div className="w-full space-y-2">
            <Label htmlFor="toDate">To Date</Label>
            <Input
              id="toDate"
              type="date"
              value={filters.toDate}
              onChange={e => setFilter('toDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          >
            Search
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 mb-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-md border shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Made By</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Made On</TableHead>
              <TableHead>Checker</TableHead>
              <TableHead>Checked On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  No audit entries match these filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  onClick={() => navigate(`/system/audit-trails/${row.id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/system/audit-trails/${row.id}`)
                    }
                  }}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.resourceId}</TableCell>
                  <TableCell>{row.processingResult}</TableCell>
                  <TableCell>{row.maker}</TableCell>
                  <TableCell>{row.actionName}</TableCell>
                  <TableCell>{row.entityName}</TableCell>
                  <TableCell>{row.officeName}</TableCell>
                  <TableCell>{formatAuditDateTime(row.madeOnDate)}</TableCell>
                  <TableCell>{row.checker}</TableCell>
                  <TableCell>
                    {formatAuditDateTime(row.checkedOnDate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 text-sm">
        <span>
          {total} entries • Page {page + 1} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || loading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= pages || loading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default AuditTrails
