/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  LoanProductsApi,
  OfficesApi,
  ProvisioningCategoryApi,
  ProvisioningEntriesApi,
  type GetLoanProductsResponse,
  type GetOfficesResponse,
  type LoanProductProvisioningEntryData,
  type ProvisioningCategoryData,
  type ProvisioningEntryData,
} from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const provisioningEntriesApi = new ProvisioningEntriesApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())
const loanProductsApi = new LoanProductsApi(getConfiguration())
const provisioningCategoryApi = new ProvisioningCategoryApi(getConfiguration())

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const ViewProvisioningEntry = () => {
  const { id: entryIdParam } = useParams()
  const entryId = Number(entryIdParam)

  const [entry, setEntry] = useState<ProvisioningEntryData | null>(null)
  const [rows, setRows] = useState<LoanProductProvisioningEntryData[]>([])
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [products, setProducts] = useState<GetLoanProductsResponse[]>([])
  const [categories, setCategories] = useState<ProvisioningCategoryData[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [officeId, setOfficeId] = useState('all')
  const [productId, setProductId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rowsError, setRowsError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadEntryAndFilters = async () => {
      if (!Number.isInteger(entryId) || entryId <= 0) {
        setError('Invalid provisioning entry ID.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // 1. Fetch the main entry independently
      try {
        const entryResponse =
          await provisioningEntriesApi.retrieveProvisioningEntry(entryId)
        if (!cancelled) setEntry(entryResponse.data)
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load provisioning entry details', err)
          setEntry(null)
          setError(
            datatableErrorMessage(err) ??
              'Unable to load provisioning entry details.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }

      // 2. Fetch filter options independently
      try {
        const officesResponse = await officesApi.retrieveOffices(
          undefined,
          'id'
        )
        if (!cancelled) setOffices(officesResponse.data ?? [])
      } catch (err) {
        console.error('Failed to load offices filter', err)
      }

      try {
        const productsResponse = await loanProductsApi.retrieveAllLoanProducts()
        if (!cancelled) setProducts(productsResponse.data ?? [])
      } catch (err) {
        console.error('Failed to load products filter', err)
      }

      try {
        const categoryResponse = await provisioningCategoryApi.retrieveAll15()
        if (!cancelled) setCategories(categoryResponse.data ?? [])
      } catch (err) {
        console.error('Failed to load categories filter', err)
      }
    }

    void loadEntryAndFilters()
    return () => {
      cancelled = true
    }
  }, [entryId, refreshKey])

  useEffect(() => {
    let cancelled = false

    const loadRows = async () => {
      if (!Number.isInteger(entryId) || entryId <= 0) return

      setRowsLoading(true)
      setRowsError(null)
      try {
        const response =
          await provisioningEntriesApi.retrieveProviioningEntries(
            entryId,
            (page - 1) * pageSize,
            pageSize,
            officeId === 'all' ? undefined : Number(officeId),
            productId === 'all' ? undefined : Number(productId),
            categoryId === 'all' ? undefined : Number(categoryId)
          )
        if (cancelled) return
        const data = response.data
        setRows(data.pageItems ?? [])
        setTotal(data.totalFilteredRecords ?? data.pageItems?.length ?? 0)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load provisioning entry rows', err)
        setRowsError(
          datatableErrorMessage(err) ??
            'Unable to load provisioning entry rows.'
        )
        setRows([])
        setTotal(0)
      } finally {
        if (!cancelled) setRowsLoading(false)
      }
    }

    void loadRows()
    return () => {
      cancelled = true
    }
  }, [entryId, page, pageSize, officeId, productId, categoryId, refreshKey])

  const createJournalEntries = async () => {
    if (!Number.isInteger(entryId) || entryId <= 0 || actionLoading) return

    setActionLoading(true)
    setActionMessage(null)
    try {
      await provisioningEntriesApi.modifyProvisioningEntry(
        entryId,
        'createjournalentry',
        { command: 'createjournalentry' }
      )
      setActionMessage({
        type: 'success',
        text: 'Journal entries created successfully.',
      })
      setRefreshKey(key => key + 1)
    } catch (err) {
      console.error('Failed to create provisioning journal entries', err)
      setActionMessage({
        type: 'error',
        text: datatableErrorMessage(err) ?? 'Unable to create journal entries.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          {
            label: 'Provisioning Entries',
            href: '/accounting/provisioning-entries',
          },
          { label: String(entryIdParam ?? ''), current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Provisioning Entry {entryIdParam}
        </h1>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          disabled={loading || actionLoading || !entry || entry?.journalEntry}
          onClick={createJournalEntries}
        >
          {actionLoading ? 'Creating...' : '+ Create Journal Entries'}
        </Button>
      </div>

      {actionMessage && (
        <div
          role={actionMessage.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 rounded-md border px-4 py-2 text-sm ${
            actionMessage.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-green-300 bg-green-50 text-green-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : (
        <>
          <div className="mb-5 rounded-md border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="font-semibold">Created By</dt>
                <dd className="mt-3">{entry?.createdUser ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Created On</dt>
                <dd className="mt-3">
                  {entry?.createdDate?.slice(0, 10) ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Amount to be Reserved</dt>
                <dd className="mt-3">{entry?.reservedAmount ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="mb-5 grid gap-4 rounded-md bg-zinc-100 p-4 dark:bg-zinc-800 md:grid-cols-3">
            <Select
              value={officeId}
              onValueChange={value => {
                setOfficeId(value)
                setPage(1)
              }}
            >
              <SelectTrigger aria-label="Filter by office">
                <SelectValue placeholder="Office Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Office Name</SelectItem>
                {offices
                  .filter(office => office.id !== undefined)
                  .map(office => (
                    <SelectItem key={office.id} value={String(office.id)}>
                      {office.name ?? String(office.id)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={productId}
              onValueChange={value => {
                setProductId(value)
                setPage(1)
              }}
            >
              <SelectTrigger aria-label="Filter by loan product">
                <SelectValue placeholder="Loan Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Loan Product</SelectItem>
                {products
                  .filter(product => product.id !== undefined)
                  .map(product => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name ?? String(product.id)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryId}
              onValueChange={value => {
                setCategoryId(value)
                setPage(1)
              }}
            >
              <SelectTrigger aria-label="Filter by provisioning category">
                <SelectValue placeholder="Provisioning Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Provisioning Category</SelectItem>
                {categories
                  .filter(category => category.id !== undefined)
                  .map(category => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.categoryName ?? String(category.id)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {rowsError && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {rowsError}
            </div>
          )}

          <div className="rounded-md border bg-white shadow-sm dark:bg-zinc-900">
            <Table>
              <TableCaption className="pb-4">
                {rowsLoading
                  ? 'Loading provisioning details...'
                  : `Showing ${rows.length} of ${total} items`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Office Name</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Currency Code</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Provisioning Amount</TableHead>
                  <TableHead>Liability Account (CR)</TableHead>
                  <TableHead>Expense Account (DR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rowsError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      Could not load provisioning details.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      No provisioning details found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow
                      key={`${row.historyId ?? index}-${row.productId}`}
                    >
                      <TableCell>{row.officeName ?? '—'}</TableCell>
                      <TableCell>{row.productName ?? '—'}</TableCell>
                      <TableCell>{row.currencyCode ?? '—'}</TableCell>
                      <TableCell>{row.categoryName ?? '—'}</TableCell>
                      <TableCell>{row.amountreserved ?? '—'}</TableCell>
                      <TableCell>{row.liabilityAccountName ?? '—'}</TableCell>
                      <TableCell>{row.expenseAccountName ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-end gap-3 p-4 text-sm">
              <span>Items per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={value => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-24" aria-label="Items per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                {total === 0 ? 0 : (page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1 || rowsLoading}
                onClick={() => setPage(current => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pageCount || rowsLoading}
                onClick={() => setPage(current => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ViewProvisioningEntry
