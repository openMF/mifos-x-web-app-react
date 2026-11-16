/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Search,
  Settings2,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
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
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { LoanProductsApi, LoansApi, OfficesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { useAppSelector } from '@/app/hook'
import { formatDisplayCurrency, formatDisplayNumber } from '@/lib/number-format'

import {
  toRow,
  type LoanCurrency,
  type LoanRow,
  type LoansListItem,
  type Severity,
} from './loans-list/loan-row'
import {
  BORROWER_COLUMN_ID,
  DEFAULT_COLUMN_IDS,
  loadVisibleColumns,
  loanFieldColumns,
  saveVisibleColumns,
  type CellFormat,
  type ColumnDef,
} from './loans-list/columns'
import {
  isFilterSet,
  matchesFilter,
  newFilter,
  type ActiveFilter,
} from './loans-list/filters'
import { useLoanDatatables } from './loans-list/use-loan-datatables'
import { buildCsv, downloadCsv, exportFileName } from './loans-list/export-csv'
import ColumnsSheet from './loans-list/ColumnsSheet'
import AdditionalFilters from './loans-list/AdditionalFilters'

const loansApi = new LoansApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())
const loanProductsApi = new LoanProductsApi(getConfiguration())

/**
 * The loans endpoint cannot filter by office or product and has no text
 * search, so every loan is loaded and the list is filtered on the client. The
 * first chunk is small so rows appear quickly; the rest follow in the
 * background.
 */
const FIRST_CHUNK = 100
const NEXT_CHUNK = 500

/** Select value standing for "no filter", since Radix rejects an empty one */
const ALL = 'all'

/** Fields the search always covers, whether or not their column is shown */
const ALWAYS_SEARCHED = ['status', 'accountNo', 'product']

interface LoansListPage {
  pageItems?: LoansListItem[]
  totalFilteredRecords?: number
}

interface Option {
  id: number
  name: string
}

// A stable sort keeps offset paging consistent across chunks, so no loan is
// returned twice or skipped between requests.
const fetchChunk = async (offset: number, limit: number) => {
  const res = await loansApi.retrieveAll27(
    undefined, // externalId
    offset,
    limit,
    'accountNo',
    'ASC'
  )
  const data = (res.data ?? {}) as unknown as LoansListPage
  return {
    rows: (data.pageItems ?? []).map(toRow),
    total: data.totalFilteredRecords ?? 0,
  }
}

/**
 * Loads the loans from `start` up to `total` one chunk at a time. A failed
 * chunk is skipped and its offset returned, so the loans already loaded stay
 * usable.
 */
const fetchRest = async (
  start: number,
  total: number,
  onRows: (rows: LoanRow[]) => void,
  isCancelled: () => boolean
) => {
  const failed: number[] = []
  for (
    let offset = start;
    offset < total && !isCancelled();
    offset += NEXT_CHUNK
  ) {
    try {
      const next = await fetchChunk(offset, NEXT_CHUNK)
      if (!isCancelled()) onRows(next.rows)
    } catch (e) {
      console.error('Failed to load a chunk of loans', e)
      failed.push(offset)
    }
  }
  return failed
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

/** The datatable a datatable column id ("dt:table:column") belongs to */
const tableOf = (columnId: string) =>
  columnId.startsWith('dt:') ? columnId.split(':')[1] : undefined

const BADGE_CLASSES: Record<Severity, string> = {
  active:
    'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400',
  arrears:
    'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
  pending:
    'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  closed:
    'border-zinc-300 text-zinc-500 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  neutral:
    'border-zinc-300 text-zinc-600 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

const ACCENT_CLASSES: Record<Severity, string> = {
  active: 'border-l-green-500',
  arrears: 'border-l-red-500',
  pending: 'border-l-amber-500',
  closed: 'border-l-zinc-300 dark:border-l-zinc-600',
  neutral: 'border-l-zinc-300 dark:border-l-zinc-600',
}

const Loans = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('loans')
  const { t: tc } = useTranslation('common')
  const decimalPlaces = useAppSelector(state => state.settings.decimalPlaces)

  // data
  const [loans, setLoans] = useState<LoanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  // offsets of the later chunks that failed, so they can be loaded again
  const [failedChunks, setFailedChunks] = useState<number[]>([])
  const [retryingChunks, setRetryingChunks] = useState(false)
  const unmounted = useRef(false)
  const [offices, setOffices] = useState<Option[]>([])
  const [products, setProducts] = useState<Option[]>([])

  // view state
  const [searchTerm, setSearchTerm] = useState('')
  const [officeId, setOfficeId] = useState(ALL)
  const [productId, setProductId] = useState(ALL)
  const [showClosed, setShowClosed] = useState(false)
  const [filters, setFilters] = useState<ActiveFilter[]>([])
  const nextFilterUid = useRef(1)
  const [visibleIds, setVisibleIds] = useState(loadVisibleColumns)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [filterPickerUsed, setFilterPickerUsed] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [page, setPage] = useState(1)

  // filtering runs over every loaded loan, so let typing stay responsive
  const deferredSearch = useDeferredValue(searchTerm)

  // Load the first chunk, show it, then load the rest one chunk at a time.
  // A failed later chunk is skipped so the loans already shown stay usable.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const first = await fetchChunk(0, FIRST_CHUNK)
        if (cancelled) return
        setLoans(first.rows)
        setLoading(false)

        if (first.total <= FIRST_CHUNK) return
        setLoadingMore(true)
        const failed = await fetchRest(
          FIRST_CHUNK,
          first.total,
          rows => setLoans(prev => [...prev, ...rows]),
          () => cancelled
        )
        if (!cancelled) {
          setFailedChunks(failed)
          setLoadingMore(false)
        }
      } catch (e) {
        console.error('Failed to load loans', e)
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    unmounted.current = false
    return () => {
      unmounted.current = true
    }
  }, [])

  // Loans added or removed since the first attempt shift every later offset,
  // so loading only the failed offsets again could skip a loan. The whole list
  // is loaded again instead, with a fresh total, and replaces the current one
  // once it is complete. A loan moved across a chunk boundary meanwhile is
  // kept once rather than shown twice.
  const retryChunks = async () => {
    setRetryingChunks(true)
    try {
      const first = await fetchChunk(0, NEXT_CHUNK)
      const reloaded = new Map(first.rows.map(loan => [loan.id, loan]))
      const stillFailed = await fetchRest(
        NEXT_CHUNK,
        first.total,
        rows => rows.forEach(loan => reloaded.set(loan.id, loan)),
        () => unmounted.current
      )
      if (unmounted.current) return
      setLoans([...reloaded.values()])
      setFailedChunks(stillFailed)
    } catch (e) {
      // the current list and its failed chunks stay as they were
      console.error('Failed to load loans', e)
    }
    if (!unmounted.current) setRetryingChunks(false)
  }

  // filter options load independently of the loans themselves
  useEffect(() => {
    officesApi
      .retrieveOffices()
      .then(res =>
        setOffices(
          ((res.data ?? []) as Option[]).filter(o => o.id != null && o.name)
        )
      )
      .catch(e => console.error('Failed to load offices', e))
    loanProductsApi
      .retrieveAllLoanProducts()
      .then(res =>
        setProducts(
          ((res.data ?? []) as Option[]).filter(p => p.id != null && p.name)
        )
      )
      .catch(e => console.error('Failed to load loan products', e))
  }, [])

  useEffect(() => saveVisibleColumns(visibleIds), [visibleIds])

  // Datatable rows are only loaded for the tables a shown or filtered column
  // comes from, and the list of tables only once something needs it.
  const neededTables = useMemo(
    () => [
      ...new Set(
        [...visibleIds, ...filters.map(filter => filter.columnId)]
          .map(tableOf)
          .filter((name): name is string => !!name)
      ),
    ],
    [visibleIds, filters]
  )
  const datatables = useLoanDatatables(
    columnsOpen || filterPickerUsed || neededTables.length > 0,
    neededTables
  )

  const statusOptions = useMemo(
    () =>
      [...new Set(loans.map(loan => loan.statusValue).filter(Boolean))].sort(),
    [loans]
  )
  const loanFields = useMemo(
    () => loanFieldColumns(key => t(key), statusOptions),
    [t, statusOptions]
  )
  const columnsById = useMemo(() => {
    const all = [
      ...loanFields,
      ...(datatables.tables ?? []).flatMap(table => table.columns),
    ]
    return new Map(all.map(column => [column.id, column]))
  }, [loanFields, datatables.tables])
  const resolve = useCallback(
    (id: string) => columnsById.get(id),
    [columnsById]
  )

  // Drop saved columns, and filters, that no longer exist: a loan field that
  // was renamed, or a datatable column once the table list shows it is gone.
  useEffect(() => {
    const known = (id: string) =>
      columnsById.has(id) || (!!tableOf(id) && datatables.tables === null)
    setVisibleIds(prev => (prev.every(known) ? prev : prev.filter(known)))
    setFilters(prev =>
      prev.every(f => known(f.columnId))
        ? prev
        : prev.filter(f => known(f.columnId))
    )
  }, [columnsById, datatables.tables])

  const visibleColumns = useMemo(
    () =>
      visibleIds
        .map(id => columnsById.get(id))
        .filter((column): column is ColumnDef => !!column),
    [visibleIds, columnsById]
  )

  const officeNames = useMemo(
    () => new Map(offices.map(office => [office.id, office.name])),
    [offices]
  )

  const format = useMemo<CellFormat>(() => {
    const language = i18n.language
    return {
      money: (value?: number, currency?: LoanCurrency) => {
        if (typeof value !== 'number') return ''
        return formatDisplayCurrency(
          value,
          currency?.code,
          language,
          decimalPlaces
        )
      },
      number: value => formatDisplayNumber(value, language, decimalPlaces),
      date: (value, withTime) => {
        const date = formatDate(value, language, '')
        if (!withTime) return date
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${date} ${pad(value.getHours())}:${pad(value.getMinutes())}`
      },
      yesNo: value => tc(value ? 'actions.yes' : 'actions.no'),
      officeName: id => (id === undefined ? '' : (officeNames.get(id) ?? '')),
      datatableRow: (table, loanId) => datatables.rows[table]?.get(loanId),
    }
  }, [i18n.language, tc, officeNames, datatables.rows, decimalPlaces])

  // a sort on a column that has since been hidden no longer applies
  const activeSort =
    sortColumn === BORROWER_COLUMN_ID ||
    (sortColumn && visibleIds.includes(sortColumn))
      ? sortColumn
      : null

  const visibleRows = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()

    // A filter on a datatable column waits for that table's rows, so it does
    // not hide every loan while they load.
    const appliedFilters = filters
      .filter(isFilterSet)
      .map(filter => ({ filter, column: columnsById.get(filter.columnId) }))
      .filter(
        (entry): entry is { filter: ActiveFilter; column: ColumnDef } =>
          !!entry.column &&
          (!entry.column.table || !!datatables.rows[entry.column.table])
      )
    const searchedColumns = [
      ...ALWAYS_SEARCHED.map(id => columnsById.get(id)),
      ...visibleColumns.filter(column => !ALWAYS_SEARCHED.includes(column.id)),
    ].filter((column): column is ColumnDef => !!column)

    const filtered = loans.filter(
      loan =>
        (showClosed || !loan.isClosed) &&
        (officeId === ALL || String(loan.officeId) === officeId) &&
        (productId === ALL || String(loan.productId) === productId) &&
        appliedFilters.every(({ filter, column }) =>
          matchesFilter(column.cell(loan, format), filter)
        ) &&
        (!term ||
          loan.borrowerName.toLowerCase().includes(term) ||
          searchedColumns.some(column =>
            column.cell(loan, format).text.toLowerCase().includes(term)
          ))
    )
    if (!activeSort) return filtered

    const sortBy = columnsById.get(activeSort)
    const keyed = filtered.map(loan => ({
      loan,
      value: sortBy
        ? sortBy.cell(loan, format).value
        : loan.borrowerName.toLowerCase() || null,
    }))
    keyed.sort((a, b) => {
      // empty cells stay at the end whichever way the column is sorted
      if (a.value === null || b.value === null) {
        return a.value === b.value ? 0 : a.value === null ? 1 : -1
      }
      const order =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value - b.value
          : String(a.value).localeCompare(String(b.value), undefined, {
              numeric: true,
            })
      return sortAsc ? order : -order
    })
    return keyed.map(entry => entry.loan)
  }, [
    loans,
    deferredSearch,
    showClosed,
    officeId,
    productId,
    filters,
    columnsById,
    visibleColumns,
    datatables.rows,
    format,
    activeSort,
    sortAsc,
  ])

  const total = visibleRows.length
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  // a filter can shrink the list below the current page
  const currentPage = Math.min(page, totalPages)
  const pageRows = visibleRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const setSort = (columnId: string) => {
    if (activeSort === columnId) setSortAsc(asc => !asc)
    else {
      setSortColumn(columnId)
      setSortAsc(true)
    }
  }

  const resetFilters = () => {
    setOfficeId(ALL)
    setProductId(ALL)
    setShowClosed(false)
    setFilters([])
    setPage(1)
  }

  const addFilter = (column: ColumnDef) => {
    const filter = newFilter(
      nextFilterUid.current++,
      column.id,
      column.filterType
    )
    setFilters(prev => [...prev, filter])
    setPage(1)
  }

  const changeFilter = (changed: ActiveFilter) => {
    setFilters(prev => prev.map(f => (f.uid === changed.uid ? changed : f)))
    setPage(1)
  }

  const removeFilter = (uid: number) => {
    setFilters(prev => prev.filter(f => f.uid !== uid))
    setPage(1)
  }

  // Every matching loan is written, not only the current page, so the file
  // waits until all loans and every shown or filtered datatable have loaded.
  // A failed chunk or table keeps it disabled until a retry succeeds, since
  // the file would otherwise miss loans or include ones a filter excludes.
  const canExport =
    !loading &&
    !error &&
    !loadingMore &&
    failedChunks.length === 0 &&
    !retryingChunks &&
    neededTables.every(name => !!datatables.rows[name]) &&
    total > 0

  const exportLoans = () => {
    const header = [t('list.borrower'), ...visibleColumns.map(c => c.label)]
    const rows = visibleRows.map(loan => [
      loan.borrowerName,
      ...visibleColumns.map(column => column.cell(loan, format).text),
    ])
    downloadCsv(exportFileName(), buildCsv(header, rows))
  }

  // The loan account view is only routed under /groups, so a client's loan
  // opens the client page, which lists its loan accounts
  const loanPath = (loan: LoanRow) =>
    loan.groupId && !loan.clientId
      ? `/groups/${loan.groupId}/loans-accounts/${loan.id}/general`
      : loan.clientId
        ? `/clients/${loan.clientId}/general`
        : undefined

  const openLoan = (loan: LoanRow) => {
    const path = loanPath(loan)
    if (path) navigate(path)
  }

  const borrowerPath = (loan: LoanRow) =>
    loan.clientId
      ? `/clients/${loan.clientId}/general`
      : loan.groupId
        ? `/groups/${loan.groupId}/general`
        : undefined

  const sortableHead = (columnId: string, label: string) => {
    const Icon =
      activeSort !== columnId ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown
    return (
      <TableHead
        key={columnId}
        className="px-3 py-3"
        aria-sort={
          activeSort !== columnId
            ? 'none'
            : sortAsc
              ? 'ascending'
              : 'descending'
        }
      >
        <button
          type="button"
          onClick={() => setSort(columnId)}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
        >
          {label}
          <Icon
            className={`h-3.5 w-3.5 ${activeSort === columnId ? '' : 'opacity-40'}`}
          />
        </button>
      </TableHead>
    )
  }

  const renderCell = (loan: LoanRow, column: ColumnDef) => {
    if (column.id === 'status') {
      return (
        <TableCell key={column.id} className="px-3 py-3 min-w-[11rem]">
          <span
            className={`inline-flex max-w-[13rem] items-center gap-1.5 rounded-2xl border px-2.5 py-0.5 text-xs font-semibold uppercase whitespace-normal ${BADGE_CLASSES[loan.severity]}`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {loan.severity === 'arrears'
              ? `${loan.statusValue} · ${tc('status.inArrears')}`
              : loan.statusValue || '—'}
          </span>
        </TableCell>
      )
    }

    if (column.id === 'accountNo') {
      const accountPath = loanPath(loan)
      return (
        <TableCell key={column.id} className="px-3 py-3 font-mono text-sm">
          {/* the row click is mouse-only, so the account number is the
              keyboard route to the loan */}
          {accountPath && loan.accountNo ? (
            <Link
              to={accountPath}
              onClick={e => e.stopPropagation()}
              className="hover:underline"
            >
              {loan.accountNo}
            </Link>
          ) : (
            loan.accountNo || '—'
          )}
        </TableCell>
      )
    }

    const pending =
      !!column.table &&
      !datatables.rows[column.table] &&
      datatables.loadingTables.includes(column.table)
    const { text } = column.cell(loan, format)
    return (
      <TableCell
        key={column.id}
        className={`px-3 py-3 ${column.mono ? 'font-mono text-sm' : ''}`}
      >
        {pending ? (
          <span className="text-zinc-400">…</span>
        ) : (
          text || <span className="text-zinc-400">—</span>
        )}
      </TableCell>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), current: true },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        {/* list */}
        <div className="min-w-0 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={t('list.searchPlaceholder')}
                aria-label={t('list.searchPlaceholder')}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-9 h-11 text-base"
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              {loadingMore && (
                <span className="text-zinc-500">{t('list.loadingMore')}</span>
              )}
              {!loading && !error && (
                <span className="font-medium text-[#1074b9] dark:text-sky-400">
                  {t('list.loanCount', { count: total })}
                </span>
              )}
              <Button
                variant="outline"
                size="icon"
                disabled={!canExport}
                onClick={exportLoans}
                aria-label={t('list.export')}
                title={
                  canExport ? t('list.exportHint') : t('list.exportWaiting')
                }
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setColumnsOpen(true)}
                aria-label={t('list.customiseColumns')}
                title={t('list.customiseColumns')}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {failedChunks.length > 0 && (
            <p className="px-4 pt-4 text-sm text-amber-600 dark:text-amber-400">
              {t('list.partialLoad')}
              {!loadingMore && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={retryChunks}
                    disabled={retryingChunks}
                    className="underline cursor-pointer disabled:cursor-default disabled:opacity-60"
                  >
                    {t('list.retry')}
                  </button>
                </>
              )}
            </p>
          )}

          {(datatables.failedTables.length > 0 ||
            (datatables.tablesFailed && neededTables.length > 0)) && (
            <p className="px-4 pt-4 text-sm text-amber-600 dark:text-amber-400">
              {t('list.datatableColumnsFailed')}{' '}
              <button
                type="button"
                onClick={datatables.retry}
                className="underline cursor-pointer"
              >
                {t('list.retry')}
              </button>
            </p>
          )}

          {loading && (
            <p className="text-center py-8 text-zinc-500">
              {tc('actions.loading')}
            </p>
          )}

          {error && (
            <p className="text-center py-8 text-red-500">
              {t('errors.failedLoadLoans')}
            </p>
          )}

          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {sortableHead(BORROWER_COLUMN_ID, t('list.borrower'))}
                    {visibleColumns.map(column =>
                      sortableHead(column.id, column.label)
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageRows.map(loan => {
                    const ownerPath = borrowerPath(loan)
                    return (
                      <TableRow
                        key={loan.id}
                        onClick={() => openLoan(loan)}
                        className={`cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base ${
                          loan.isClosed ? 'opacity-60' : ''
                        }`}
                      >
                        <TableCell
                          className={`px-3 py-3 border-l-4 ${ACCENT_CLASSES[loan.severity]}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1074b9] text-xs font-semibold text-white">
                              {initials(loan.borrowerName)}
                            </span>
                            <div className="min-w-0">
                              {ownerPath ? (
                                <Link
                                  to={ownerPath}
                                  onClick={e => e.stopPropagation()}
                                  className="block truncate font-medium hover:underline"
                                >
                                  {loan.borrowerName || '—'}
                                </Link>
                              ) : (
                                <span className="block truncate font-medium">
                                  {loan.borrowerName || '—'}
                                </span>
                              )}
                              {loan.loanType && (
                                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                                  {loan.loanType}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {visibleColumns.map(column => renderCell(loan, column))}
                      </TableRow>
                    )
                  })}

                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length + 1}
                        className="px-6 py-6 text-center text-zinc-500"
                      >
                        {tc('status.noResults')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tc('pagination.showing', {
                    current: pageRows.length,
                    total,
                    page: currentPage,
                    pages: totalPages,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={v => {
                      setItemsPerPage(parseInt(v, 10))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger
                      className="w-[140px]"
                      aria-label={tc('pagination.itemsPerPage')}
                    >
                      <SelectValue
                        placeholder={tc('pagination.itemsPerPage')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                  >
                    {tc('actions.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage(Math.min(totalPages, currentPage + 1))
                    }
                  >
                    {tc('actions.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* filters */}
        <aside className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="font-semibold">{t('list.filters')}</h2>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-[#1074b9] dark:text-sky-400"
              onClick={resetFilters}
            >
              {t('list.reset')}
            </Button>
          </div>
          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="loans-office-filter">{t('list.office')}</Label>
              <Select
                value={officeId}
                onValueChange={v => {
                  setOfficeId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger id="loans-office-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('list.allOffices')}</SelectItem>
                  {offices.map(o => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loans-product-filter">
                {t('list.loanProduct')}
              </Label>
              <Select
                value={productId}
                onValueChange={v => {
                  setProductId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger id="loans-product-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('list.allProducts')}</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="loans-show-closed"
                checked={showClosed}
                onCheckedChange={v => {
                  setShowClosed(v)
                  setPage(1)
                }}
              />
              <Label htmlFor="loans-show-closed">
                {t('list.showClosedAccounts')}
              </Label>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
            <AdditionalFilters
              filters={filters}
              resolve={resolve}
              loanFields={loanFields}
              datatables={datatables.tables}
              datatablesFailed={datatables.tablesFailed}
              loadingTables={datatables.loadingTables}
              onRetry={datatables.retry}
              onPickerOpen={() => setFilterPickerUsed(true)}
              onAdd={addFilter}
              onChange={changeFilter}
              onRemove={removeFilter}
            />
          </div>
        </aside>
      </div>

      <ColumnsSheet
        open={columnsOpen}
        onOpenChange={setColumnsOpen}
        visibleIds={visibleIds}
        onChange={setVisibleIds}
        onReset={() => setVisibleIds([...DEFAULT_COLUMN_IDS])}
        resolve={resolve}
        loanFields={loanFields}
        datatables={datatables.tables}
        datatablesFailed={datatables.tablesFailed}
        onRetry={datatables.retry}
        borrowerLabel={t('list.borrower')}
      />
    </div>
  )
}

export default Loans
