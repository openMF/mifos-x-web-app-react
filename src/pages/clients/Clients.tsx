/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState, useMemo } from 'react'
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
import { Switch } from '@/components/ui/switch'
import RouteSuccessMessage from '@/components/custom/route-success-message/RouteSuccessMessage'

import {
  Plus,
  Search,
  Upload,
  Filter,
  List,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import {
  ClientApi,
  ClientSearchV2Api,
  type GetClientsResponse,
  type PageClientSearchData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const clientApi = new ClientApi(getConfiguration())
const clientSearchApi = new ClientSearchV2Api(getConfiguration())

/** Client status ids Fineract reports */
const STATUS_PENDING = 100
const STATUS_ACTIVE = 300
const STATUS_CLOSED = 600
const STATUS_REJECTED = 800
const STATUS_WITHDRAWN = 900

export interface ClientRow {
  id?: number
  displayName?: string
  accountNo?: string
  externalId?: string
  officeName?: string
  officeId?: number
  status?: { id?: number; value?: string; code?: string }
  legalForm?: { id?: number; value?: string }
  activationDate?: number[] | string | Date
  activatedDateStr?: string
  timeline?: {
    submittedOnDate?: number[] | string | Date
    activatedOnDate?: number[] | string | Date
    closedOnDate?: number[] | string | Date
  }
}

interface ClientsListItem {
  id?: number
  displayName?: string
  accountNo?: string
  externalId?: string
  officeName?: string
  officeId?: number
  status?: { id?: number; value?: string; code?: string }
  legalForm?: { id?: number; value?: string }
  activationDate?: number[] | string
  timeline?: {
    submittedOnDate?: number[] | string
    activatedOnDate?: number[] | string
    closedOnDate?: number[] | string
  }
}

interface ClientsSearchItem {
  id?: number
  displayName?: string
  accountNumber?: string
  externalId?: string
  officeName?: string
  officeId?: number
  status?: { id?: number; value?: string; code?: string }
}

interface ClientNameParts {
  fullname?: string
  firstname?: string
  middlename?: string
  lastname?: string
}

const buildName = (parts: ClientNameParts) =>
  parts.fullname?.trim() ||
  [parts.firstname, parts.middlename, parts.lastname]
    .map(n => n?.trim())
    .filter(Boolean)
    .join(' ')

const fillMissingNames = (rows: ClientRow[]) =>
  Promise.all(
    rows.map(async row => {
      if (row.displayName?.trim() || !row.id) return row
      try {
        const res = await clientApi.retrieveOne11(row.id)
        const name = buildName(res.data as ClientNameParts)
        return name ? { ...row, displayName: name } : row
      } catch {
        return row
      }
    })
  )

/** Generates avatar initials matching Angular (e.g. Zoë Ünicode -> ZÜ, QAAuto List -> QL) */
const getInitials = (name?: string) => {
  if (!name?.trim()) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase()
  }
  const first = Array.from(parts[0])[0] || ''
  const last = Array.from(parts[parts.length - 1])[0] || ''
  return `${first}${last}`.toUpperCase()
}

/** Formats subtitle: "Person · Activated 31 October 2026" or "Person" */
const getSubtitle = (c: ClientRow) => {
  const type = c.legalForm?.value || 'Person'
  const statusStr = c.status?.value?.toLowerCase()
  const isActive = c.status?.id === STATUS_ACTIVE || statusStr === 'active'
  const isClosed = c.status?.id === STATUS_CLOSED || statusStr === 'closed'

  if (isActive) {
    if (c.activatedDateStr) {
      return `${type} · Activated ${c.activatedDateStr}`
    }
    const rawDate = c.activationDate || c.timeline?.activatedOnDate
    if (rawDate) {
      const formatted = formatDate(rawDate, 'en-GB', '')
      if (formatted && formatted !== '—') {
        return `${type} · Activated ${formatted}`
      }
    }
  }

  if (isClosed && c.timeline?.closedOnDate) {
    const formatted = formatDate(c.timeline.closedOnDate, 'en-GB', '')
    if (formatted && formatted !== '—') {
      return `${type} · Closed ${formatted}`
    }
  }

  return type
}

/** Normalizes client status category for badges and indicators */
const getNormalizedStatus = (
  c: ClientRow
): 'pending' | 'active' | 'closed' | 'rejected' | 'withdrawn' | 'other' => {
  const val = c.status?.value?.toLowerCase()
  const id = c.status?.id

  if (id === STATUS_PENDING || val === 'pending') return 'pending'
  if (id === STATUS_ACTIVE || val === 'active') return 'active'
  if (
    id === STATUS_CLOSED ||
    val === 'closed' ||
    val === 'closed / written off' ||
    val === 'transfer in progress'
  )
    return 'closed'
  if (id === STATUS_REJECTED || val === 'rejected') return 'rejected'
  if (id === STATUS_WITHDRAWN || val === 'withdrawn') return 'withdrawn'
  return 'other'
}

const Clients = () => {
  const navigate = useNavigate()

  // Pagination & Filters
  const [itemsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'closed'
  >('all')

  // Sorting
  const [sortField, setSortField] = useState<
    'name' | 'accountNo' | 'externalId'
  >('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Dialogs & Data State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterOpen, setFilterOpen] = useState(false)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpiCounts, setKpiCounts] = useState<{
    total: number
    active: number
    pending: number
    closed: number
  }>({ total: 0, active: 0, pending: 0, closed: 0 })

  // Fetch real KPI totals from server
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [allRes, activeRes, pendingRes, closedRes] = await Promise.all([
          clientApi.retrieveAll21(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            0,
            1
          ),
          clientApi.retrieveAll21(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'active',
            undefined,
            0,
            1
          ),
          clientApi.retrieveAll21(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'pending',
            undefined,
            0,
            1
          ),
          clientApi.retrieveAll21(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'closed',
            undefined,
            0,
            1
          ),
        ])
        if (!cancelled) {
          setKpiCounts({
            total: allRes.data?.totalFilteredRecords ?? 0,
            active: activeRes.data?.totalFilteredRecords ?? 0,
            pending: pendingRes.data?.totalFilteredRecords ?? 0,
            closed: closedRes.data?.totalFilteredRecords ?? 0,
          })
        }
      } catch {
        // Silently keep default 0 counts if stats unavailable
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Compute KPI stats from real counts
  const stats = useMemo(() => {
    return {
      total: kpiCounts.total || total,
      active: kpiCounts.active,
      pending: kpiCounts.pending,
      closed: kpiCounts.closed,
    }
  }, [kpiCounts, total])

  // Fetch clients
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        let content: ClientRow[] = []
        let totalRecords = 0

        if (searchTerm.trim()) {
          const res = await clientSearchApi.searchByText({
            request: { text: searchTerm.trim() },
            page: Math.max(0, page - 1),
            size: itemsPerPage,
          })

          const data: PageClientSearchData = res.data || {}
          const items = (data.content ?? []) as unknown as ClientsSearchItem[]

          content = items.map(c => ({
            id: c.id,
            displayName: c.displayName,
            accountNo: c.accountNumber,
            externalId: c.externalId,
            officeName: c.officeName,
            officeId: c.officeId,
            status: c.status,
          }))
          totalRecords = data.totalElements ?? content.length
        } else {
          let apiStatus: string | undefined
          if (statusFilter === 'active') {
            apiStatus = 'active'
          } else if (statusFilter === 'pending') {
            apiStatus = 'pending'
          } else if (statusFilter === 'closed') {
            apiStatus = 'closed'
          } else {
            // statusFilter === 'all'
            apiStatus = showClosed ? undefined : 'active'
          }

          const res = await clientApi.retrieveAll21(
            undefined, // officeId
            undefined, // externalId
            undefined, // displayName
            undefined, // firstName
            undefined, // lastName
            apiStatus,
            undefined, // underHierarchy
            (page - 1) * itemsPerPage,
            itemsPerPage
          )

          const data: GetClientsResponse = res.data || {}
          const items = (data.pageItems ?? []) as unknown as ClientsListItem[]

          content = items.map(c => ({
            id: c.id,
            displayName: c.displayName,
            accountNo: c.accountNo,
            externalId: c.externalId,
            officeName: c.officeName,
            officeId: c.officeId,
            status: c.status,
            legalForm: c.legalForm,
            activationDate: c.activationDate,
            timeline: c.timeline,
          }))
          totalRecords = data.totalFilteredRecords ?? content.length
        }

        content = await fillMissingNames(content)

        if (!cancelled) {
          setRows(content)
          setTotal(totalRecords)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setRows([])
          setTotal(0)
          setError('Unable to load clients. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchTerm, page, itemsPerPage, showClosed, statusFilter])

  // Client-side sorting
  const displayRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      let valA = ''
      let valB = ''
      if (sortField === 'name') {
        valA = a.displayName || ''
        valB = b.displayName || ''
      } else if (sortField === 'accountNo') {
        valA = a.accountNo || ''
        valB = b.accountNo || ''
      } else if (sortField === 'externalId') {
        valA = a.externalId || ''
        valB = b.externalId || ''
      }
      const cmp = valA.localeCompare(valB, undefined, { numeric: true })
      return sortAsc ? cmp : -cmp
    })

    return sorted
  }, [rows, sortField, sortAsc])

  const displayTotal = total
  const totalPages = Math.max(1, Math.ceil(displayTotal / itemsPerPage))

  const handleSort = (field: 'name' | 'accountNo' | 'externalId') => {
    if (sortField === field) {
      setSortAsc(prev => !prev)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Exact Angular Status Badge
  const renderStatusBadge = (c: ClientRow) => {
    const statusType = getNormalizedStatus(c)

    if (statusType === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#f59e0b] text-[#b45309] dark:text-amber-300 bg-[#fffbeb] dark:bg-amber-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
          PENDING
        </span>
      )
    }
    if (statusType === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#10b981] text-[#15803d] dark:text-emerald-300 bg-[#f0fdf4] dark:bg-emerald-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
          ACTIVE
        </span>
      )
    }
    if (statusType === 'closed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#9ca3af] text-[#4b5563] dark:border-zinc-500 dark:text-zinc-300 bg-[#f3f4f6] dark:bg-zinc-800 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280] shrink-0" />
          CLOSED
        </span>
      )
    }
    if (statusType === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#ef4444] text-[#991b1b] dark:border-red-500 dark:text-red-300 bg-[#fef2f2] dark:bg-red-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
          REJECTED
        </span>
      )
    }
    if (statusType === 'withdrawn') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#f97316] text-[#9a3412] dark:border-orange-500 dark:text-orange-300 bg-[#fff7ed] dark:bg-orange-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" />
          WITHDRAWN
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-zinc-300 text-zinc-600 dark:text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
        {c.status?.value?.toUpperCase() || 'UNKNOWN'}
      </span>
    )
  }

  // Row Accent vertical bar indicator on the far left of each row
  const renderRowAccent = (c: ClientRow) => {
    const statusType = getNormalizedStatus(c)

    if (statusType === 'pending') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-[#f59e0b] shrink-0" />
    }
    if (statusType === 'active') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-[#10b981] shrink-0" />
    }
    if (statusType === 'closed') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-[#9ca3af] shrink-0" />
    }
    if (statusType === 'rejected') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-[#ef4444] shrink-0" />
    }
    if (statusType === 'withdrawn') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-[#f97316] shrink-0" />
    }
    return (
      <div className="w-[3.5px] h-7 rounded-xs bg-gray-300 dark:bg-zinc-600 shrink-0" />
    )
  }

  return (
    <div className="w-full max-w-[960px] mx-auto my-4 px-2 sm:px-4">
      {/* Top Header: Title and Create Client Action Button */}
      <div className="flex items-center justify-between mb-5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          Clients
        </h1>

        <Button
          onClick={() => navigate('/clients/create')}
          className="h-9 px-3.5 text-xs font-semibold bg-[#1074b9] hover:bg-[#0e639c] text-white rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors mt-0.5"
        >
          <Plus className="h-4 w-4" />
          Create client
        </Button>
      </div>

      <RouteSuccessMessage className="mb-4" />

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null)
              setPage(1)
            }}
            className="text-xs border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4 Stat Summary Cards Grid (Total, Active, Pending review, Closed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total clients */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all')
            setShowClosed(true)
            setPage(1)
          }}
          className={cn(
            'text-left w-full bg-white dark:bg-zinc-800 rounded-lg border p-5 shadow-xs transition-all cursor-pointer hover:border-[#1074b9]/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1074b9]',
            statusFilter === 'all'
              ? 'border-gray-300 dark:border-zinc-600 ring-1 ring-gray-200 dark:ring-zinc-700'
              : 'border-gray-200 dark:border-zinc-700'
          )}
        >
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400">
            Total clients
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mt-2 tracking-tight">
            {stats.total}
          </div>
        </button>

        {/* Active clients */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('active')
            setPage(1)
          }}
          className={cn(
            'text-left w-full bg-white dark:bg-zinc-800 rounded-lg border p-5 shadow-xs transition-all cursor-pointer hover:border-emerald-500/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
            statusFilter === 'active'
              ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-900/50'
              : 'border-gray-200 dark:border-zinc-700'
          )}
        >
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400">
            Active
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#10b981] dark:text-emerald-400 mt-2 tracking-tight">
            {stats.active}
          </div>
        </button>

        {/* Pending review */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('pending')
            setPage(1)
          }}
          className={cn(
            'text-left w-full bg-white dark:bg-zinc-800 rounded-lg border p-5 shadow-xs transition-all cursor-pointer hover:border-amber-500/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500',
            statusFilter === 'pending'
              ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900/50'
              : 'border-gray-200 dark:border-zinc-700'
          )}
        >
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400">
            Pending review
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#f59e0b] dark:text-amber-400 mt-2 tracking-tight">
            {stats.pending}
          </div>
        </button>

        {/* Closed clients */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('closed')
            setShowClosed(true)
            setPage(1)
          }}
          className={cn(
            'text-left w-full bg-white dark:bg-zinc-800 rounded-lg border p-5 shadow-xs transition-all cursor-pointer hover:border-gray-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400',
            statusFilter === 'closed'
              ? 'border-gray-400 dark:border-zinc-500 ring-1 ring-gray-300 dark:ring-zinc-600'
              : 'border-gray-200 dark:border-zinc-700'
          )}
        >
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400">
            Closed
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-zinc-300 mt-2 tracking-tight">
            {stats.closed}
          </div>
        </button>
      </div>

      {/* Main Listing Container Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-xs p-5 sm:p-6 mb-8">
        {/* Controls Row 1: Search, Filters button, Show closed switch, Status dropdown, Import clients */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pb-4 border-b border-gray-100 dark:border-zinc-700/60">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, account number, or external ID"
              className="pl-9 h-9 sm:h-10 text-[13px] bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 placeholder:text-gray-400 rounded-md focus-visible:ring-1 focus-visible:ring-[#1074b9]"
            />
          </div>

          {/* Filters Button */}
          <Button
            variant="outline"
            onClick={() => setFilterOpen(prev => !prev)}
            className={cn(
              'h-9 sm:h-10 px-3 sm:px-3.5 text-[13px] font-medium border-gray-200 dark:border-zinc-700 rounded-md flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-none transition-colors',
              filterOpen
                ? 'bg-gray-100 dark:bg-zinc-700 text-[#1074b9]'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
            )}
          >
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </Button>

          {/* Show Closed Accounts Switch */}
          <div className="flex items-center gap-2 select-none px-1">
            <Switch
              id="show-closed"
              checked={showClosed}
              onCheckedChange={checked => {
                setShowClosed(checked)
                setPage(1)
              }}
              className="data-[state=unchecked]:bg-[#cfd8dc] dark:data-[state=unchecked]:bg-zinc-600"
            />
            <label
              htmlFor="show-closed"
              className="cursor-pointer text-[13px] text-gray-600 dark:text-zinc-300 font-normal whitespace-nowrap"
            >
              Show closed accounts
            </label>
          </div>

          {/* Status Dropdown */}
          <Select
            value={statusFilter}
            onValueChange={v => {
              setStatusFilter(v as 'all' | 'active' | 'pending' | 'closed')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[125px] sm:w-[135px] h-9 sm:h-10 text-[13px] bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Import Clients Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/organization/bulk-import/Clients')}
            className="h-9 sm:h-10 px-3 sm:px-3.5 text-[13px] font-medium border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shadow-none"
          >
            <Upload className="h-4 w-4 text-gray-500" />
            Import clients
          </Button>
        </div>

        {/* Controls Row 2: Count on Left, View Switcher on Right */}
        <div className="flex items-center justify-between pt-4 pb-3">
          <div className="text-[13px] font-medium text-gray-500 dark:text-zinc-400">
            {displayTotal} clients
          </div>

          <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-md p-0.5 bg-gray-50/60 dark:bg-zinc-800/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={cn(
                'p-1.5 rounded transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={cn(
                'p-1.5 rounded transition-colors cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Grid View of Clients */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4">
            {displayRows.map(c => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => c.id && navigate(`/clients/${c.id}/general`)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && c.id) {
                    e.preventDefault()
                    navigate(`/clients/${c.id}/general`)
                  }
                }}
                className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-[#1074b9]/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-[#1074b9]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {renderRowAccent(c)}
                    <div className="w-10 h-10 rounded-full bg-[#1074b9] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                      {getInitials(c.displayName)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-[13px] text-gray-900 dark:text-zinc-100 truncate hover:text-[#1074b9]">
                        {c.displayName?.trim() || '—'}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5 font-normal">
                        {getSubtitle(c)}
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge(c)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] pt-3 border-t border-gray-100 dark:border-zinc-700/60 text-gray-500 dark:text-zinc-400">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block font-medium">
                      Account No
                    </span>
                    <span className="font-mono text-gray-700 dark:text-zinc-300 truncate block">
                      {c.accountNo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block font-medium">
                      External ID
                    </span>
                    <span className="font-mono text-gray-700 dark:text-zinc-300 truncate block">
                      {c.externalId || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase text-gray-400 block font-medium">
                      Office
                    </span>
                    <span className="text-gray-700 dark:text-zinc-300 truncate block">
                      {c.officeName || '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {displayRows.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-gray-400">
                No clients found matching your criteria.
              </div>
            )}
          </div>
        ) : (
          /* Clients Table with Fixed Proportional Column Widths */
          <div
            aria-busy={loading}
            className={cn(
              'border-t border-gray-200 dark:border-zinc-700 -mx-5 sm:-mx-6 px-5 sm:px-6',
              loading && 'opacity-70 transition-opacity'
            )}
          >
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="hover:bg-transparent border-b border-gray-200 dark:border-zinc-700 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={
                      sortField === 'name'
                        ? sortAsc
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    onClick={() => handleSort('name')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('name')
                      }
                    }}
                    className="py-3 pl-2 pr-3 w-[34%] cursor-pointer select-none focus:outline-none focus:bg-gray-100 dark:focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-1">
                      NAME
                      {sortField === 'name' ? (
                        sortAsc ? (
                          <ChevronUp className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        )
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-gray-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 w-[14%]">STATUS</th>

                  <th
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={
                      sortField === 'accountNo'
                        ? sortAsc
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    onClick={() => handleSort('accountNo')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('accountNo')
                      }
                    }}
                    className="py-3 px-3 w-[18%] cursor-pointer select-none focus:outline-none focus:bg-gray-100 dark:focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-1">
                      ACCOUNT NO.
                      {sortField === 'accountNo' ? (
                        sortAsc ? (
                          <ChevronUp className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        )
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-gray-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={
                      sortField === 'externalId'
                        ? sortAsc
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    onClick={() => handleSort('externalId')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('externalId')
                      }
                    }}
                    className="py-3 px-3 w-[18%] cursor-pointer select-none focus:outline-none focus:bg-gray-100 dark:focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-1">
                      EXTERNAL ID
                      {sortField === 'externalId' ? (
                        sortAsc ? (
                          <ChevronUp className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-700 dark:text-zinc-200" />
                        )
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-gray-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 w-[16%]">OFFICE NAME</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60">
                {displayRows.map(c => (
                  <tr
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => c.id && navigate(`/clients/${c.id}/general`)}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ' ') && c.id) {
                        e.preventDefault()
                        navigate(`/clients/${c.id}/general`)
                      }
                    }}
                    className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-zinc-700/30 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-zinc-700"
                  >
                    {/* Name column: Indicator bar + Avatar + DisplayName/Subtitle */}
                    <td className="py-3 pl-2 pr-3 w-[34%]">
                      <div className="flex items-center gap-3">
                        {renderRowAccent(c)}
                        <div className="w-9 h-9 rounded-full bg-[#1074b9] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                          {getInitials(c.displayName)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[13px] text-gray-900 dark:text-zinc-100 hover:text-[#1074b9] transition-colors truncate">
                            {c.displayName?.trim() || '—'}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5 font-normal">
                            {getSubtitle(c)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 w-[14%]">
                      {renderStatusBadge(c)}
                    </td>

                    {/* Account No */}
                    <td className="py-3 px-3 w-[18%] font-mono text-[13px] text-gray-600 dark:text-zinc-400">
                      {c.accountNo || '—'}
                    </td>

                    {/* External ID */}
                    <td className="py-3 px-3 w-[18%] font-mono text-[13px] text-gray-600 dark:text-zinc-400">
                      <span
                        className="truncate block max-w-[180px]"
                        title={c.externalId}
                      >
                        {c.externalId || '—'}
                      </span>
                    </td>

                    {/* Office Name */}
                    <td className="py-3 px-3 w-[16%] text-[13px] font-normal text-gray-700 dark:text-zinc-300">
                      {c.officeName || '—'}
                    </td>
                  </tr>
                ))}

                {displayRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      No clients found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-zinc-700/60 text-xs sm:text-sm text-gray-500">
            <div>
              Showing {(page - 1) * itemsPerPage + 1}–
              {Math.min(page * itemsPerPage, displayTotal)} of {displayTotal}{' '}
              clients
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 w-8 p-0 border-gray-300 dark:border-zinc-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs px-1 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0 border-gray-300 dark:border-zinc-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Clients
