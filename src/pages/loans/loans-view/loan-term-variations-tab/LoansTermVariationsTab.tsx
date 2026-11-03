/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  LoansApi,
  type GetLoansLoanIdResponse,
  type GetLoansLoanIdLoanTermVariations,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface ExtendedLoanResponse extends GetLoansLoanIdResponse {
  termVariations?: GetLoansLoanIdLoanTermVariations[]
}

const TERM_TYPE_LABELS: Record<string, string> = {
  interestPause: 'Interest Pause',
  emiAmount: 'EMI Amount',
  dueDate: 'Due Date',
  principalAmount: 'Principal Amount',
  graceOnPrincipal: 'Grace on Principal',
  graceOnInterest: 'Grace on Interest',
  extendRepaymentPeriod: 'Extend Repayment Period',
}

const formatTermType = (termType?: { value?: string; code?: string }) => {
  const raw = termType?.value || termType?.code
  if (!raw) return '—'

  const normalized = raw.replace(/^loanTermType\./, '')
  if (TERM_TYPE_LABELS[normalized]) {
    return TERM_TYPE_LABELS[normalized]
  }

  // Format camelCase or snake_case as fallback to readable Title Case words
  return normalized
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const formatVariationDate = (date?: unknown) => {
  if (typeof date === 'string') {
    const dateOnlyMatch = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnlyMatch) {
      const parts = [
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]),
        Number(dateOnlyMatch[3]),
      ]
      return formatDate(parts)
    }
  }
  return formatDate(date as number[] | string | Date | undefined | null)
}

const formatVariationValue = (
  decimalValue?: number | null,
  dateValue?: unknown
) => {
  if (decimalValue !== undefined && decimalValue !== null) {
    return decimalValue.toLocaleString()
  }
  if (dateValue) {
    return formatVariationDate(dateValue)
  }
  return '—'
}

const LoansTermVariationsTab = () => {
  const { loanId } = useParams()
  const [variations, setVariations] = useState<
    GetLoansLoanIdLoanTermVariations[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadIdRef = useRef(0)

  const fetchLoanTermVariations = useCallback(async () => {
    const requestId = ++loadIdRef.current
    if (!loanId) {
      setVariations([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const loansApi = new LoansApi(getConfiguration())
      const res = await loansApi.retrieveLoan(
        Number(loanId),
        undefined,
        'loanTermVariations'
      )
      if (requestId !== loadIdRef.current) return

      const loanData = res.data as ExtendedLoanResponse
      const extractedVariations =
        loanData.loanTermVariations ?? loanData.termVariations ?? []
      setVariations(extractedVariations)
    } catch (err) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to fetch loan term variations', err)
      setError('Failed to load loan term variations.')
      setVariations([])
    } finally {
      if (requestId === loadIdRef.current) {
        setLoading(false)
      }
    }
  }, [loanId])

  useEffect(() => {
    fetchLoanTermVariations()
  }, [fetchLoanTermVariations])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Term Variations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Term Type</TableHead>
                <TableHead>Applicable From</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Specific to Installment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm text-destructive font-medium">
                        {error}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLoanTermVariations}
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : variations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-zinc-500 dark:text-zinc-400"
                  >
                    No term variations found for this loan account
                  </TableCell>
                </TableRow>
              ) : (
                variations.map((variation, index) => (
                  <TableRow key={variation.id ?? index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatTermType(variation.termType)}</TableCell>
                    <TableCell>
                      {formatVariationDate(
                        variation.termVariationApplicableFrom
                      )}
                    </TableCell>
                    <TableCell>
                      {formatVariationValue(
                        variation.decimalValue,
                        variation.dateValue
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          variation.isSpecificToInstallment
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        )}
                      >
                        {variation.isSpecificToInstallment ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default LoansTermVariationsTab
