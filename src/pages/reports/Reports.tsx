/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { getConfiguration } from '@/lib/fineract-openapi'
import { ReportsApi, type GetReportsResponse } from '@/fineract-api'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Play, Table2 } from 'lucide-react'

const reportsApi = new ReportsApi(getConfiguration())

/** Report types Fineract can run, in the order the web-app lists them */
const ENGINES = ['Table', 'Pentaho', 'BIRT', 'Chart', 'SMS'] as const

const Reports = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation([
    'common',
    'clients',
    'loans',
    'organization',
    'accounting',
  ])

  const categoryLabels: Record<string, string> = {
    client: t('clients:title'),
    loan: t('loans:title'),
    savings: t('loans:savings'),
    fund: t('organization:nav.funds'),
    accounting: t('accounting:title'),
  }
  const categoryLabel = category ? categoryLabels[category] : undefined

  const [reports, setReports] = useState<GetReportsResponse[]>([])
  const [search, setSearch] = useState('')
  const [engine, setEngine] = useState('all')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true) // Start the spinner
      try {
        const response = await reportsApi.retrieveReportList()
        const details = response.data ?? []

        if (!category) {
          setReports(details)
        } else {
          const filtered = details.filter(
            e =>
              e.reportCategory ===
              category.charAt(0).toUpperCase() + category.slice(1)
          )
          setReports(filtered)
        }
      } catch (error) {
        console.error('Failed to fetch reports', error)
      } finally {
        setLoading(false) // Stop the spinner even if there is an error
      }
    }
    fetchReports()
  }, [category])

  const isEngine = (report: GetReportsResponse, name: string) =>
    report.reportType?.toLowerCase() === name.toLowerCase()

  const engineCounts = Object.fromEntries(
    ENGINES.map(name => [name, reports.filter(r => isEngine(r, name)).length])
  )

  const filtered = reports.filter(
    report =>
      report.reportName?.toLowerCase().includes(search.toLowerCase()) &&
      (engine === 'all' || isEngine(report, engine))
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Groups the current page by category, in the order the categories appear.
  const groups = new Map<string, GetReportsResponse[]>()
  for (const report of paginated) {
    const key = report.reportCategory ?? ''
    groups.set(key, [...(groups.get(key) ?? []), report])
  }

  const runReport = (reportName?: string) => {
    if (!reportName) return
    navigate(`/reports/run/${encodeURIComponent(reportName)}`)
  }

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.reports'), href: '/reports' },
          ...(categoryLabel ? [{ label: categoryLabel }] : []),
        ]}
      />

      <h2 className="text-2xl font-semibold mb-6">
        {categoryLabel ?? t('common:nav.reports')}
      </h2>

      {/* Search + Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
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
              {[5, 10, 25, 50].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
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

      {/* Engine Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t('common:reports.filterByEngine')}
        </span>

        <ToggleGroup
          type="single"
          value={engine}
          onValueChange={value => {
            if (!value) return
            setEngine(value)
            setPage(1)
          }}
          className="flex-wrap gap-2"
          aria-label={t('common:reports.filterByEngine')}
        >
          {['all', ...ENGINES].map(name => (
            <ToggleGroupItem
              key={name}
              value={name}
              className="flex-none gap-2 rounded-full! border border-zinc-200 px-3 dark:border-zinc-700 data-[state=on]:border-[#1074b9] data-[state=on]:bg-[#1074b9] data-[state=on]:text-white"
            >
              {name === 'all' ? t('common:reports.allEngines') : name}
              <span className="rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {name === 'all' ? reports.length : engineCounts[name]}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
          {t('common:reports.matchCount', {
            shown: filtered.length,
            total: reports.length,
          })}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} reports • Page{' '}
            {page} of {totalPages}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4 w-40">Type</TableHead>
              <TableHead className="px-6 py-4 w-28" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-zinc-500"
                >
                  Loading reports from demo server...
                </TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              [...groups].map(([groupName, groupReports]) => {
                const isCollapsed = collapsed.has(groupName)
                return [
                  <TableRow
                    key={`group-${groupName}`}
                    className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                  >
                    <TableCell colSpan={3} className="p-0">
                      <button
                        type="button"
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleGroup(groupName)}
                        className="flex w-full items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 cursor-pointer"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                        />
                        {groupName || t('common:reports.other')}
                        <span className="ml-auto rounded-full border border-blue-100 bg-white px-2 text-xs font-normal text-zinc-600 dark:border-blue-900 dark:bg-zinc-800 dark:text-zinc-300">
                          {groupReports.length}
                        </span>
                      </button>
                    </TableCell>
                  </TableRow>,
                  ...(isCollapsed
                    ? []
                    : groupReports.map(report => (
                        <TableRow
                          key={report.id ?? report.reportName}
                          className="group hover:bg-blue-50/60 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                          onClick={() => runReport(report.reportName)}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <Table2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-base group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                  {report.reportName}
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {report.reportCategory}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="inline-block min-w-24 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                              {report.reportType}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {/* Shown while the row is hovered or the button has keyboard focus. */}
                            <Button
                              size="sm"
                              className="rounded-full bg-blue-700 px-4 text-white opacity-0 transition-opacity hover:bg-blue-800 focus-visible:opacity-100 group-hover:opacity-100"
                              onClick={e => {
                                e.stopPropagation()
                                runReport(report.reportName)
                              }}
                            >
                              {t('common:reports.run')}
                              <Play className="size-2.5 fill-current" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))),
                ]
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-zinc-500"
                >
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Reports
