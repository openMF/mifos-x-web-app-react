/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppMultiSelect from '@/components/custom/select/AppMultiSelect'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  SearchAPIApi,
  type AdHocSearchQueryData,
  type PostAdhocQuerySearchRequest,
} from '@/fineract-api'
import { todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const searchApi = new SearchAPIApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/**
 * POST /search/advance also takes these fields, but the generated
 * PostAdhocQuerySearchRequest leaves them out (listed in ISSUES.md).
 */
type FundMappingRequest = PostAdhocQuerySearchRequest & {
  entities: string[]
  loanStatus?: string[]
  loanProducts?: number[]
  offices?: number[]
  minOutStandingAmountPercentage?: number
  maxOutStandingAmountPercentage?: number
  outstandingAmount?: number
}

/** Status codes Fineract maps in AdHocQuerySearchConditions */
const LOAN_STATUSES = [
  { id: 'all', name: 'All' },
  { id: 'active', name: 'Active' },
  { id: 'overpaid', name: 'Overpaid' },
  { id: 'closed', name: 'Closed (obligations met)' },
  { id: 'writeoff', name: 'Closed (written-off)' },
]

const DATE_OPTIONS = [
  { id: 'approvalDate', name: 'Approval Date' },
  { id: 'createdDate', name: 'Creation Date' },
  { id: 'disbursalDate', name: 'Disbursement Date' },
]

const CONDITIONS = [
  { id: 'between', name: 'between' },
  { id: '<=', name: '<=' },
  { id: '>=', name: '>=' },
  { id: '<', name: '<' },
  { id: '>', name: '>' },
  { id: '=', name: '=' },
]

type Range = { condition: string; min: string; max: string; value: string }

const emptyRange: Range = { condition: 'between', min: '', max: '', value: '' }

const isRangeComplete = (range: Range) =>
  range.condition === 'between'
    ? range.min !== '' && range.max !== ''
    : range.value !== ''

/**
 * Organization > Fund Mapping: loans grouped by office and product, filtered
 * by status, date and outstanding amount (GET /search/template,
 * POST /search/advance), as in the Angular web app.
 */
const FundMapping = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [offices, setOffices] = useState<{ id: string; name: string }[]>([])
  const [loanStatus, setLoanStatus] = useState<string[]>([])
  const [loanProducts, setLoanProducts] = useState<string[]>([])
  const [officeIds, setOfficeIds] = useState<string[]>([])
  const [loanDateOption, setLoanDateOption] = useState('')
  const [loanFromDate, setLoanFromDate] = useState('')
  const [loanToDate, setLoanToDate] = useState('')
  const [includePercentage, setIncludePercentage] = useState(false)
  const [percentage, setPercentage] = useState<Range>(emptyRange)
  const [includeAmount, setIncludeAmount] = useState(false)
  const [amount, setAmount] = useState<Range>(emptyRange)
  const [results, setResults] = useState<AdHocSearchQueryData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await searchApi.retrieveAdHocSearchQueryTemplate()
        setProducts(
          (res.data.loanProducts ?? []).map(p => ({
            id: p.id?.toString() ?? '',
            name: p.name ?? '',
          }))
        )
        setOffices(
          (res.data.offices ?? []).map(o => ({
            id: o.id?.toString() ?? '',
            name: o.name ?? '',
          }))
        )
      } catch (err) {
        console.error('Failed to fetch search template', err)
        setError('Failed to load products and offices.')
      }
    }
    fetchTemplate()
  }, [])

  const canSubmit =
    loanDateOption !== '' &&
    loanFromDate !== '' &&
    loanToDate !== '' &&
    (!includePercentage || isRangeComplete(percentage)) &&
    (!includeAmount || isRangeComplete(amount))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    if (loanFromDate > loanToDate) {
      setError('From Date must be on or before To Date.')
      return
    }
    const invertedRange = (range: Range) =>
      range.condition === 'between' && Number(range.min) > Number(range.max)
    if (
      (includePercentage && invertedRange(percentage)) ||
      (includeAmount && invertedRange(amount))
    ) {
      setError('Minimum Value must not be more than Maximum Value.')
      return
    }
    const request: FundMappingRequest = {
      entities: ['loans'],
      loanStatus,
      loanProducts: loanProducts.map(Number),
      offices: officeIds.map(Number),
      loanDateOption,
      loanFromDate,
      loanToDate,
      includeOutStandingAmountPercentage: includePercentage,
      includeOutstandingAmount: includeAmount,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
    }
    if (includePercentage) {
      request.outStandingAmountPercentageCondition = percentage.condition
      if (percentage.condition === 'between') {
        request.minOutStandingAmountPercentage = Number(percentage.min)
        request.maxOutStandingAmountPercentage = Number(percentage.max)
      } else {
        request.outStandingAmountPercentage = Number(percentage.value)
      }
    }
    if (includeAmount) {
      request.outstandingAmountCondition = amount.condition
      if (amount.condition === 'between') {
        request.minOutstandingAmount = Number(amount.min)
        request.maxOutstandingAmount = Number(amount.max)
      } else {
        request.outstandingAmount = Number(amount.value)
      }
    }
    setResults(null)
    setSubmitting(true)
    setError(null)
    try {
      const res = await searchApi.advancedSearch(request)
      setResults(res.data ?? [])
    } catch (err) {
      const data = (err as AxiosError<ApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          'Failed to run the fund mapping search.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const renderRange = (
    idPrefix: string,
    range: Range,
    setRange: (range: Range) => void
  ) => (
    <div className="flex flex-col md:flex-row gap-4 pl-6">
      <AppSelect
        selectLabel="Comparison Condition*"
        selectPlaceholder="Select condition"
        selectValue={range.condition}
        selectOnChange={condition => setRange({ ...range, condition })}
        selectClassname="w-full md:w-1/3 space-y-2"
        selectOptions={CONDITIONS}
      />
      {range.condition === 'between' ? (
        <>
          <div className="w-full md:w-1/3 space-y-2">
            <Label htmlFor={`${idPrefix}-min`}>Minimum Value*</Label>
            <Input
              id={`${idPrefix}-min`}
              type="number"
              min={0}
              value={range.min}
              onChange={e => setRange({ ...range, min: e.target.value })}
            />
          </div>
          <div className="w-full md:w-1/3 space-y-2">
            <Label htmlFor={`${idPrefix}-max`}>Maximum Value*</Label>
            <Input
              id={`${idPrefix}-max`}
              type="number"
              min={0}
              value={range.max}
              onChange={e => setRange({ ...range, max: e.target.value })}
            />
          </div>
        </>
      ) : (
        <div className="w-full md:w-1/3 space-y-2">
          <Label htmlFor={`${idPrefix}-value`}>Comparison Value*</Label>
          <Input
            id={`${idPrefix}-value`}
            type="number"
            min={0}
            value={range.value}
            onChange={e => setRange({ ...range, value: e.target.value })}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Fund Mapping', current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mb-4">Fund Mapping</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
            <AppMultiSelect
              selectLabel="Loan Status"
              selectPlaceholder="Select loan status"
              selectValues={loanStatus}
              selectOnChange={setLoanStatus}
              selectOptions={LOAN_STATUSES}
            />
            <AppMultiSelect
              selectLabel="Product"
              selectPlaceholder="Select products"
              selectValues={loanProducts}
              selectOnChange={setLoanProducts}
              selectOptions={products}
            />
            <AppMultiSelect
              selectLabel="Office"
              selectPlaceholder="Select offices"
              selectValues={officeIds}
              selectOnChange={setOfficeIds}
              selectOptions={offices}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <AppSelect
              selectLabel="Date Type*"
              selectPlaceholder="Select date type"
              selectValue={loanDateOption}
              selectOnChange={setLoanDateOption}
              selectClassname="w-full md:w-1/3 space-y-2"
              selectOptions={DATE_OPTIONS}
            />
            <div className="w-full md:w-1/3 space-y-2">
              <Label htmlFor="loanFromDate">From Date*</Label>
              <Input
                id="loanFromDate"
                type="date"
                max={todayInputValue()}
                value={loanFromDate}
                onChange={e => setLoanFromDate(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/3 space-y-2">
              <Label htmlFor="loanToDate">To Date*</Label>
              <Input
                id="loanToDate"
                type="date"
                max={todayInputValue()}
                value={loanToDate}
                onChange={e => setLoanToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={includePercentage}
                onCheckedChange={c => setIncludePercentage(!!c)}
              />
              <span>Loan Outstanding Percentage</span>
            </label>
            {includePercentage &&
              renderRange('percentage', percentage, setPercentage)}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={includeAmount}
                onCheckedChange={c => setIncludeAmount(!!c)}
              />
              <span>Loan Outstanding Amount</span>
            </label>
            {includeAmount && renderRange('amount', amount, setAmount)}
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!canSubmit || submitting}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>

      {results && (
        <div className="bg-white dark:bg-zinc-900 rounded-md border shadow mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Office</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No loans match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                results.map(row => (
                  <TableRow key={`${row.officeName}-${row.loanProductName}`}>
                    <TableCell>{row.officeName}</TableCell>
                    <TableCell>{row.loanProductName}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      {row.loanOutStanding}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.percentage}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default FundMapping
