/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'

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

/** Loan status ids Fineract reports for rejected, withdrawn and closed loans */
const STATUS_WITHDRAWN = 400
const STATUS_REJECTED = 500
const CLOSED_STATUS_IDS = [600, 601, 602]

type Severity = 'active' | 'arrears' | 'pending' | 'closed' | 'neutral'
type SortKey = 'borrower' | 'status' | 'accountNo' | 'principal' | 'product'

/**
 * Shape the loans list endpoint returns at runtime. The generated type
 * declares pageItems as a Set of the single-loan response, which carries
 * neither the client's office nor the loan type.
 */
interface LoansListItem {
  id?: number
  accountNo?: string
  clientId?: number
  clientName?: string
  clientOfficeId?: number
  group?: { id?: number; name?: string; officeId?: number }
  loanProductId?: number
  loanProductName?: string
  loanType?: { value?: string }
  principal?: number
  currency?: { code?: string; decimalPlaces?: number }
  inArrears?: boolean
  status?: {
    id?: number
    value?: string
    active?: boolean
    closed?: boolean
    overpaid?: boolean
    pendingApproval?: boolean
    waitingForDisbursal?: boolean
  }
}

interface LoansListPage {
  pageItems?: LoansListItem[]
  totalFilteredRecords?: number
}

/** Row shape the table renders */
interface LoanRow {
  id: number
  accountNo: string
  borrowerName: string
  loanType: string
  clientId?: number
  groupId?: number
  officeId?: number
  productId?: number
  productName: string
  principal?: number
  currency?: { code?: string; decimalPlaces?: number }
  statusValue: string
  severity: Severity
  isClosed: boolean
}

interface Option {
  id: number
  name: string
}

/** Groups Fineract's loan states into the colours the list distinguishes */
const severityOf = (loan: LoansListItem): Severity => {
  const s = loan.status ?? {}
  // overpaid is its own state, not one waiting on approval or disbursal
  if (s.overpaid) return 'neutral'
  // an active loan that is overdue needs attention rather than looking healthy
  if (s.active) return loan.inArrears ? 'arrears' : 'active'
  if (s.pendingApproval || s.waitingForDisbursal) return 'pending'
  if (
    s.closed ||
    s.id === STATUS_WITHDRAWN ||
    s.id === STATUS_REJECTED ||
    CLOSED_STATUS_IDS.includes(s.id ?? -1)
  ) {
    return 'closed'
  }
  return 'neutral'
}

const toRow = (loan: LoansListItem): LoanRow => {
  const severity = severityOf(loan)
  return {
    id: loan.id ?? 0,
    accountNo: loan.accountNo ?? '',
    borrowerName: (loan.clientName || loan.group?.name || '').trim(),
    loanType: loan.loanType?.value ?? '',
    clientId: loan.clientId,
    groupId: loan.group?.id,
    // client loans carry the office at the top level, group loans only nested
    officeId: loan.clientOfficeId ?? loan.group?.officeId,
    productId: loan.loanProductId,
    productName: loan.loanProductName ?? '',
    principal: loan.principal,
    currency: loan.currency,
    statusValue: loan.status?.value ?? '',
    severity,
    isClosed: severity === 'closed',
  }
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

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

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

  // data
  const [loans, setLoans] = useState<LoanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [partial, setPartial] = useState(false)
  const [offices, setOffices] = useState<Option[]>([])
  const [products, setProducts] = useState<Option[]>([])

  // view state
  const [searchTerm, setSearchTerm] = useState('')
  const [officeId, setOfficeId] = useState(ALL)
  const [productId, setProductId] = useState(ALL)
  const [showClosed, setShowClosed] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
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
        for (
          let offset = FIRST_CHUNK;
          offset < first.total && !cancelled;
          offset += NEXT_CHUNK
        ) {
          try {
            const next = await fetchChunk(offset, NEXT_CHUNK)
            if (!cancelled) setLoans(prev => [...prev, ...next.rows])
          } catch (e) {
            console.error('Failed to load a chunk of loans', e)
            if (!cancelled) setPartial(true)
          }
        }
        if (!cancelled) setLoadingMore(false)
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

  const visibleRows = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    const filtered = loans.filter(
      loan =>
        (showClosed || !loan.isClosed) &&
        (officeId === ALL || String(loan.officeId) === officeId) &&
        (productId === ALL || String(loan.productId) === productId) &&
        (!term ||
          [loan.accountNo, loan.borrowerName, loan.productName].some(field =>
            field.toLowerCase().includes(term)
          ))
    )
    if (!sortKey) return filtered

    const value = (loan: LoanRow): string | number => {
      switch (sortKey) {
        case 'borrower':
          return loan.borrowerName.toLowerCase()
        case 'status':
          return loan.statusValue.toLowerCase()
        case 'accountNo':
          return loan.accountNo
        case 'principal':
          return loan.principal ?? -Infinity
        case 'product':
          return loan.productName.toLowerCase()
      }
    }
    return [...filtered].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      const order =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortAsc ? order : -order
    })
  }, [loans, deferredSearch, showClosed, officeId, productId, sortKey, sortAsc])

  const total = visibleRows.length
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  // a filter can shrink the list below the current page
  const currentPage = Math.min(page, totalPages)
  const pageRows = visibleRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(asc => !asc)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const resetFilters = () => {
    setOfficeId(ALL)
    setProductId(ALL)
    setShowClosed(false)
    setPage(1)
  }

  /** An amount in the loan's currency, e.g. $10,000.00, or "—" */
  const money = (value?: number, currency?: LoanRow['currency']) => {
    if (typeof value !== 'number') return '—'
    const digits = currency?.decimalPlaces ?? 2
    const options = {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }
    try {
      return new Intl.NumberFormat(i18n.language, {
        ...options,
        style: 'currency',
        currency: currency?.code,
      }).format(value)
    } catch {
      // no currency, or a code Intl does not know
      return new Intl.NumberFormat(i18n.language, options).format(value)
    }
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

  const sortableHead = (column: SortKey, label: string) => {
    const Icon =
      sortKey !== column ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown
    return (
      <TableHead
        key={column}
        className="px-3 py-3"
        aria-sort={
          sortKey !== column ? 'none' : sortAsc ? 'ascending' : 'descending'
        }
      >
        <button
          type="button"
          onClick={() => setSort(column)}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
        >
          {label}
          <Icon
            className={`h-3.5 w-3.5 ${sortKey === column ? '' : 'opacity-40'}`}
          />
        </button>
      </TableHead>
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
            </div>
          </div>

          {partial && (
            <p className="px-4 pt-4 text-sm text-amber-600 dark:text-amber-400">
              {t('list.partialLoad')}
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
                    {sortableHead('borrower', t('list.borrower'))}
                    {sortableHead('status', t('list.status'))}
                    {sortableHead('accountNo', t('list.loanAccount'))}
                    {sortableHead('principal', t('list.principal'))}
                    {sortableHead('product', t('list.loanProduct'))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageRows.map(loan => {
                    const ownerPath = borrowerPath(loan)
                    const accountPath = loanPath(loan)
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
                        <TableCell className="px-3 py-3 min-w-[11rem]">
                          <span
                            className={`inline-flex max-w-[13rem] items-center gap-1.5 rounded-2xl border px-2.5 py-0.5 text-xs font-semibold uppercase whitespace-normal ${BADGE_CLASSES[loan.severity]}`}
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            {loan.severity === 'arrears'
                              ? `${loan.statusValue} · ${tc('status.inArrears')}`
                              : loan.statusValue || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono text-sm">
                          {/* the row click is mouse-only, so the account
                              number is the keyboard route to the loan */}
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
                        <TableCell className="px-3 py-3 font-mono text-sm">
                          {money(loan.principal, loan.currency)}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          {loan.productName || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
        </aside>
      </div>
    </div>
  )
}

export default Loans
