/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
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

/** Two-letter initials from display name */
const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type SortField = 'name' | 'status' | 'accountNo' | 'externalId' | 'officeName'

/** Normalizes client status category for badges and indicators */
const getNormalizedStatus = (
  c: ClientRow
):
  | 'pending'
  | 'active'
  | 'closed'
  | 'rejected'
  | 'withdrawn'
  | 'transfer'
  | 'other' => {
  const val = c.status?.value?.toLowerCase() || ''
  const code = c.status?.code?.toLowerCase() || ''
  const id = c.status?.id

  if (
    id === STATUS_PENDING ||
    val.includes('pending') ||
    code.includes('pending')
  ) {
    return 'pending'
  }
  if (
    id === STATUS_ACTIVE ||
    val.includes('active') ||
    code.includes('active')
  ) {
    return 'active'
  }
  if (val.includes('transfer') || code.includes('transfer')) {
    return 'transfer'
  }
  if (
    id === STATUS_CLOSED ||
    val.includes('closed') ||
    code.includes('closed')
  ) {
    return 'closed'
  }
  if (
    id === STATUS_REJECTED ||
    val.includes('rejected') ||
    code.includes('rejected')
  ) {
    return 'rejected'
  }
  if (
    id === STATUS_WITHDRAWN ||
    val.includes('withdrawn') ||
    code.includes('withdraw')
  ) {
    return 'withdrawn'
  }
  return 'other'
}

export const Clients = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  // Pagination & Filtering state
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'closed'
  >('all')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [legalFormFilter, setLegalFormFilter] = useState<
    'all' | 'person' | 'entity'
  >('all')

  // Server-side sorting
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Layout & Data State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [rows, setRows] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
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
        const results = await Promise.allSettled([
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
          const [allRes, activeRes, pendingRes, closedRes] = results
          setKpiCounts({
            total:
              allRes.status === 'fulfilled'
                ? (allRes.value.data?.totalFilteredRecords ?? 0)
                : 0,
            active:
              activeRes.status === 'fulfilled'
                ? (activeRes.value.data?.totalFilteredRecords ?? 0)
                : 0,
            pending:
              pendingRes.status === 'fulfilled'
                ? (pendingRes.value.data?.totalFilteredRecords ?? 0)
                : 0,
            closed:
              closedRes.status === 'fulfilled'
                ? (closedRes.value.data?.totalFilteredRecords ?? 0)
                : 0,
          })
        }
      } catch {
        // Silently keep default 0 counts if stats unavailable
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const stats = useMemo(() => {
    return {
      total: kpiCounts.total || total,
      active: kpiCounts.active,
      pending: kpiCounts.pending,
      closed: kpiCounts.closed,
    }
  }, [kpiCounts, total])

  const sortFieldToApiProperty = (field: SortField): string => {
    switch (field) {
      case 'name':
        return 'displayName'
      case 'accountNo':
        return 'accountNo'
      case 'externalId':
        return 'externalId'
      case 'officeName':
        return 'officeName'
      case 'status':
        return 'status'
    }
  }

  // Fetch clients from server with server-side pagination, status, and sorting
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        let content: ClientRow[] = []
        let totalRecords = 0

        const apiOrderBy = sortFieldToApiProperty(sortField)
        const apiSortOrder = sortAsc ? 'ASC' : 'DESC'

        if (searchTerm.trim()) {
          // Search endpoint spans all statuses, supports search by text and server-side sorts
          const res = await clientSearchApi.searchByText({
            request: { text: searchTerm.trim() },
            page: Math.max(0, page - 1),
            size: itemsPerPage,
            sorts: [
              {
                property:
                  apiOrderBy === 'accountNo' ? 'accountNumber' : apiOrderBy,
                direction: apiSortOrder,
              },
            ],
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
          // Determine status parameter for retrieveAll21
          let apiStatus: string | undefined = undefined
          if (statusFilter === 'active') {
            apiStatus = 'active'
          } else if (statusFilter === 'pending') {
            apiStatus = 'pending'
          } else if (statusFilter === 'closed' || showClosed) {
            apiStatus = 'closed'
          } else {
            // 'all': pass undefined so Fineract returns all clients (both active & pending)
            apiStatus = undefined
          }

          let apiLegalForm: number | undefined = undefined
          if (legalFormFilter === 'person') {
            apiLegalForm = 1
          } else if (legalFormFilter === 'entity') {
            apiLegalForm = 2
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
            itemsPerPage,
            apiOrderBy,
            apiSortOrder,
            undefined, // orphansOnly
            apiLegalForm // legalForm
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
          setError(t('errors.failedLoadClients', 'Failed to load clients.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    searchTerm,
    page,
    itemsPerPage,
    showClosed,
    statusFilter,
    legalFormFilter,
    sortField,
    sortAsc,
    reloadKey,
    t,
  ])

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))

  // Clamp page to valid range when total records change
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(prev => !prev)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
    setPage(1)
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortAsc ? (
        <ChevronUp className="h-3.5 w-3.5 text-[#1074b9]" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 text-[#1074b9]" />
      )
    }
    return (
      <ChevronUp className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600 opacity-60 group-hover:opacity-100 transition-opacity" />
    )
  }

  // Exact Angular Status Badge
  const renderStatusBadge = (c: ClientRow) => {
    const statusType = getNormalizedStatus(c)

    if (statusType === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#f59e0b] text-[#b45309] dark:text-amber-300 bg-[#fffbeb] dark:bg-amber-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
          {t('statusPending', 'PENDING')}
        </span>
      )
    }
    if (statusType === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#10b981] text-[#15803d] dark:text-emerald-300 bg-[#f0fdf4] dark:bg-emerald-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
          {tc('status.active', 'ACTIVE')}
        </span>
      )
    }
    if (statusType === 'transfer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          {c.status?.value?.toUpperCase() ||
            t('statusTransfer', 'TRANSFER IN PROGRESS')}
        </span>
      )
    }
    if (statusType === 'closed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#9ca3af] text-[#4b5563] dark:border-zinc-500 dark:text-zinc-300 bg-[#f3f4f6] dark:bg-zinc-800 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280] shrink-0" />
          {tc('status.closed', 'CLOSED')}
        </span>
      )
    }
    if (statusType === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#ef4444] text-[#991b1b] dark:border-red-500 dark:text-red-300 bg-[#fef2f2] dark:bg-red-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
          {t('statusRejected', 'REJECTED')}
        </span>
      )
    }
    if (statusType === 'withdrawn') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#f97316] text-[#9a3412] dark:border-orange-500 dark:text-orange-300 bg-[#fff7ed] dark:bg-orange-950/30 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" />
          {t('statusWithdrawn', 'WITHDRAWN')}
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
    if (statusType === 'transfer') {
      return <div className="w-[3.5px] h-7 rounded-xs bg-sky-500 shrink-0" />
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

  const getSubtitle = (c: ClientRow) => {
    let legalLabel = ''
    if (
      c.legalForm?.id === 2 ||
      c.legalForm?.value?.toLowerCase() === 'entity' ||
      c.legalForm?.value?.toLowerCase() === 'labels.inputs.entity'
    ) {
      legalLabel = t('entity', 'Entity')
    } else if (
      c.legalForm?.id === 1 ||
      c.legalForm?.value?.toLowerCase() === 'person' ||
      c.legalForm?.value?.toLowerCase() === 'labels.inputs.person'
    ) {
      legalLabel = t('person', 'Person')
    } else if (c.legalForm?.value?.trim()) {
      legalLabel = c.legalForm.value.trim()
    }

    const dateVal =
      c.activationDate ||
      c.timeline?.activatedOnDate ||
      c.timeline?.submittedOnDate
    if (dateVal) {
      const formatted = formatDate(dateVal)
      const verb = c.activationDate
        ? t('activatedOn', 'Activated')
        : t('submittedOn', 'Submitted')
      return legalLabel
        ? `${legalLabel} · ${verb} ${formatted}`
        : `${verb} ${formatted}`
    }
    return legalLabel || '—'
  }

  return (
    <div className="w-full max-w-[960px] mx-auto my-4 px-2 sm:px-4 text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home', 'Home'), href: '/home' },
          { label: t('title', 'Clients'), current: true },
        ]}
      />
      <RouteSuccessMessage />

      {/* Top Header: Title with blue accent marker and Create Client Action Button */}
      <div className="flex items-center justify-between mb-5 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-[#1074b9] rounded-full shrink-0" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            {t('title', 'Clients')}
          </h1>
        </div>

        <Button
          onClick={() => navigate('/clients/create')}
          className="h-10 px-4 bg-[#1074b9] hover:bg-[#0d639e] text-white font-medium text-sm flex items-center gap-1.5 cursor-pointer shadow-none rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span>{t('createClient', 'Create client')}</span>
        </Button>
      </div>

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total clients */}
        <div
          onClick={() => {
            if (!searchTerm.trim()) {
              setStatusFilter('all')
              setShowClosed(false)
              setPage(1)
            }
          }}
          className={cn(
            'bg-white dark:bg-zinc-800 rounded-xl border p-4 sm:p-5 shadow-xs transition-colors cursor-pointer select-none',
            statusFilter === 'all' && !showClosed && !searchTerm.trim()
              ? 'border-[#1074b9] ring-1 ring-[#1074b9]/30'
              : 'border-gray-200/80 dark:border-zinc-700/80 hover:border-gray-300 dark:hover:border-zinc-600'
          )}
        >
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">
            {t('kpiTotalClients', 'Total clients')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-zinc-100">
            {stats.total.toLocaleString()}
          </span>
        </div>

        {/* Active */}
        <div
          onClick={() => {
            if (!searchTerm.trim()) {
              setStatusFilter('active')
              setShowClosed(false)
              setPage(1)
            }
          }}
          className={cn(
            'bg-white dark:bg-zinc-800 rounded-xl border p-4 sm:p-5 shadow-xs transition-colors cursor-pointer select-none',
            statusFilter === 'active' && !showClosed && !searchTerm.trim()
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-gray-200/80 dark:border-zinc-700/80 hover:border-gray-300 dark:hover:border-zinc-600'
          )}
        >
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">
            {t('kpiActive', 'Active')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.active.toLocaleString()}
          </span>
        </div>

        {/* Pending review */}
        <div
          onClick={() => {
            if (!searchTerm.trim()) {
              setStatusFilter('pending')
              setShowClosed(false)
              setPage(1)
            }
          }}
          className={cn(
            'bg-white dark:bg-zinc-800 rounded-xl border p-4 sm:p-5 shadow-xs transition-colors cursor-pointer select-none',
            statusFilter === 'pending' && !showClosed && !searchTerm.trim()
              ? 'border-amber-500 ring-1 ring-amber-500/30'
              : 'border-gray-200/80 dark:border-zinc-700/80 hover:border-gray-300 dark:hover:border-zinc-600'
          )}
        >
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">
            {t('kpiPendingReview', 'Pending review')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400">
            {stats.pending.toLocaleString()}
          </span>
        </div>

        {/* Closed */}
        <div
          onClick={() => {
            if (!searchTerm.trim()) {
              setStatusFilter('closed')
              setShowClosed(true)
              setPage(1)
            }
          }}
          className={cn(
            'bg-white dark:bg-zinc-800 rounded-xl border p-4 sm:p-5 shadow-xs transition-colors cursor-pointer select-none',
            (statusFilter === 'closed' || showClosed) && !searchTerm.trim()
              ? 'border-gray-500 ring-1 ring-gray-500/30'
              : 'border-gray-200/80 dark:border-zinc-700/80 hover:border-gray-300 dark:hover:border-zinc-600'
          )}
        >
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">
            {t('kpiClosed', 'Closed')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-700 dark:text-zinc-300">
            {stats.closed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Card Container with Controls and Table (max-w-[960px] layout) */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 shadow-xs p-4 sm:p-5">
        {/* Filter Toolbar row matching exact image */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t(
                'searchPlaceholder',
                'Search by name, external ID, or mobile'
              )}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-10 text-xs sm:text-sm bg-gray-50/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-700 rounded-lg focus-visible:ring-1 focus-visible:ring-[#1074b9]"
            />
          </div>

          {/* Controls: Filters button + Show closed accounts + Status dropdown + Import clients */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filters Button (toggles filter panel for extra options) */}
            <Button
              variant="outline"
              size="sm"
              disabled={!!searchTerm.trim()}
              onClick={() => setFilterPanelOpen(prev => !prev)}
              className={cn(
                'h-10 px-3 text-xs border-gray-200 dark:border-zinc-700 font-medium flex items-center gap-1.5 shadow-none transition-colors cursor-pointer',
                filterPanelOpen
                  ? 'bg-blue-50 text-[#1074b9] border-[#1074b9] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700'
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700',
                searchTerm.trim() && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{t('filters', 'Filters')}</span>
            </Button>

            {/* Show Closed Accounts toggle (disabled during search) */}
            <div className="flex items-center gap-2 select-none px-1">
              <Switch
                id="show-closed-accounts"
                checked={showClosed}
                disabled={!!searchTerm.trim()}
                onCheckedChange={checked => {
                  setShowClosed(checked)
                  setStatusFilter(checked ? 'closed' : 'all')
                  setPage(1)
                }}
              />
              <label
                htmlFor="show-closed-accounts"
                className={cn(
                  'text-xs font-medium cursor-pointer whitespace-nowrap',
                  searchTerm.trim()
                    ? 'text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-zinc-300'
                )}
              >
                {t('showClosedAccounts', 'Show closed accounts')}
              </label>
            </div>

            {/* Status select (disabled during search) */}
            <Select
              value={statusFilter}
              disabled={!!searchTerm.trim()}
              onValueChange={(val: 'all' | 'active' | 'pending' | 'closed') => {
                setStatusFilter(val)
                setShowClosed(val === 'closed')
                setPage(1)
              }}
            >
              <SelectTrigger
                className={cn(
                  'w-[130px] h-10 text-xs font-medium bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700',
                  searchTerm.trim() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <SelectValue placeholder={t('allStatuses', 'All statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('allStatuses', 'All statuses')}
                </SelectItem>
                <SelectItem value="active">
                  {tc('status.active', 'Active')}
                </SelectItem>
                <SelectItem value="pending">
                  {t('statusPending', 'Pending')}
                </SelectItem>
                <SelectItem value="closed">
                  {tc('status.closed', 'Closed')}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Import clients button */}
            <Button
              variant="outline"
              onClick={() => navigate('/organization/bulk-import/Clients')}
              className="h-10 px-3 text-xs border-gray-200 dark:border-zinc-700 font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer shadow-none"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t('importClients', 'Import clients')}</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Panel (opened by Filters button) */}
        {filterPanelOpen && !searchTerm.trim() && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-700/60 text-xs">
            <span className="font-semibold text-gray-600 dark:text-zinc-400">
              {t('legalForm', 'Legal form')}:
            </span>
            <div className="flex items-center gap-1.5">
              {(['all', 'person', 'entity'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setLegalFormFilter(type)
                    setPage(1)
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs',
                    legalFormFilter === type
                      ? 'bg-[#1074b9] text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700'
                  )}
                >
                  {type === 'all'
                    ? t('allTypes', 'All types')
                    : type === 'person'
                      ? t('person', 'Person')
                      : t('entity', 'Entity')}
                </button>
              ))}
            </div>

            {legalFormFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLegalFormFilter('all')
                  setPage(1)
                }}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto cursor-pointer"
              >
                {t('clearFilter', 'Clear filter')}
              </Button>
            )}
          </div>
        )}

        {/* Sub-toolbar: Client count on left, Page size selector & View mode on right */}
        <div className="flex items-center justify-between pb-3 pt-1 border-b border-gray-100 dark:border-zinc-700/60">
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
            {total === 1
              ? t('clientCount_one', {
                  count: total,
                  defaultValue: `${total} client`,
                })
              : t('clientCount', {
                  count: total,
                  defaultValue: `${total} clients`,
                })}
          </span>

          <div className="flex items-center gap-3">
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="hidden sm:inline">
                {tc('pagination.itemsPerPage', 'Items per page')}:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={v => {
                  setItemsPerPage(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[65px] h-8 text-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Switcher: List vs Grid */}
            <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-md p-0.5 bg-gray-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-800 text-[#1074b9] shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                )}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-[#1074b9] shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                )}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && rows.length === 0 && (
          <p className="text-center py-12 text-gray-500">
            {tc('status.loading', 'Loading...')}
          </p>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey(k => k + 1)}
              className="text-xs"
            >
              {tc('actions.retry', 'Retry')}
            </Button>
          </div>
        )}

        {/* Main Content Area: Table / Grid View */}
        {!error && (rows.length > 0 || !loading) && (
          <div className={cn('pt-2', loading && 'opacity-60')}>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {rows.map(c => (
                  <div
                    key={c.id}
                    onClick={() => c.id && navigate(`/clients/${c.id}/general`)}
                    className="p-4 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 hover:border-[#1074b9] dark:hover:border-[#1074b9] transition-colors cursor-pointer bg-white dark:bg-zinc-800/80 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      {renderRowAccent(c)}
                      <div className="w-10 h-10 rounded-full bg-[#1074b9] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                        {getInitials(c.displayName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">
                          {c.displayName?.trim() || '—'}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                          {getSubtitle(c)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-500 dark:text-zinc-400">
                        {c.accountNo || '—'}
                      </span>
                      {renderStatusBadge(c)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View with Percentage Widths (No horizontal scrollbar) */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700 text-[11px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                      {/* NAME */}
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 pl-2 pr-3 cursor-pointer select-none group w-[34%]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{t('table.name', 'NAME')}</span>
                          {renderSortIcon('name')}
                        </div>
                      </th>

                      {/* STATUS */}
                      <th
                        onClick={() => handleSort('status')}
                        className="py-3 px-3 cursor-pointer select-none group w-[14%]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{t('table.status', 'STATUS')}</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>

                      {/* ACCOUNT NO. */}
                      <th
                        onClick={() => handleSort('accountNo')}
                        className="py-3 px-3 cursor-pointer select-none group w-[18%]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{t('table.accountNo', 'ACCOUNT NO.')}</span>
                          {renderSortIcon('accountNo')}
                        </div>
                      </th>

                      {/* EXTERNAL ID */}
                      <th
                        onClick={() => handleSort('externalId')}
                        className="py-3 px-3 cursor-pointer select-none group w-[18%]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{t('table.externalId', 'EXTERNAL ID')}</span>
                          {renderSortIcon('externalId')}
                        </div>
                      </th>

                      {/* OFFICE NAME */}
                      <th
                        onClick={() => handleSort('officeName')}
                        className="py-3 px-3 cursor-pointer select-none group w-[16%]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{t('table.officeName', 'OFFICE NAME')}</span>
                          {renderSortIcon('officeName')}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60">
                    {rows.map(c => (
                      <tr
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (c.id) navigate(`/clients/${c.id}/general`)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (c.id) {
                              navigate(`/clients/${c.id}/general`)
                            }
                          }
                        }}
                        className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-zinc-700/30 transition-colors focus:outline-hidden focus:bg-gray-100/80 dark:focus:bg-zinc-700/50"
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

                    {rows.length === 0 && !loading && !error && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-sm text-gray-400"
                        >
                          {tc('status.noResults', 'No results found.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-zinc-700/60 text-xs text-gray-500">
                <div>
                  {tc('pagination.showing', {
                    current: rows.length,
                    total,
                    page,
                    pages: totalPages,
                    defaultValue: `Showing ${rows.length} of ${total} clients • Page ${page} of ${totalPages}`,
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-8 px-3 border-gray-300 dark:border-zinc-600 text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>{tc('actions.prev', 'Previous')}</span>
                  </Button>
                  <span className="text-xs px-2 font-medium">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 border-gray-300 dark:border-zinc-600 text-xs"
                  >
                    <span>{tc('actions.next', 'Next')}</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Clients
