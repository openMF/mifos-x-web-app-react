/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { businessDateInputValue } from '@/lib/business-date'
import { inputToFineractDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  BatchAPIApi,
  RescheduleLoansApi,
  type GetLoanRescheduleRequestResponse,
} from '@/fineract-api'
import {
  buildRescheduleBatchRequests,
  formatRescheduleDate,
  getApiErrorMessage,
  getBatchErrorMessage,
  toggleSelectAll,
} from './reschedule-loan-utils'

const rescheduleLoanApi = new RescheduleLoansApi(getConfiguration())
const batchApi = new BatchAPIApi(getConfiguration())

const RescheduleLoan = () => {
  const { t, i18n } = useTranslation(['loans', 'common'])
  const [rescheduleLoans, setRescheduleLoans] = useState<
    GetLoanRescheduleRequestResponse[]
  >([])
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<'load' | 'refresh' | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const fetchIdRef = useRef(0)

  const fetchRescheduledLoanDetails = useCallback(
    async (isRefresh = false): Promise<boolean> => {
      const fetchId = ++fetchIdRef.current
      setIsLoading(true)
      setLoadError(null)
      try {
        const response =
          await rescheduleLoanApi.retrieveAllRescheduleRequest('pending')
        if (fetchId !== fetchIdRef.current) return false
        setRescheduleLoans(response.data ?? [])
        return true
      } catch (err) {
        if (fetchId !== fetchIdRef.current) return false
        console.error("Couldn't fetch rescheduled loan details", err)
        setRescheduleLoans([])
        setLoadError(isRefresh ? 'refresh' : 'load')
        return false
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    void fetchRescheduledLoanDetails(false)
  }, [fetchRescheduledLoanDetails])

  const filteredLoans = rescheduleLoans.filter(loan =>
    loan.clientName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const visibleIds = filteredLoans.map(loan => loan.id)
    setSelectedRows(prev => toggleSelectAll(prev, visibleIds))
  }

  const handleAction = async (command: 'approve' | 'reject') => {
    if (selectedRows.length === 0) return

    setIsSubmitting(true)
    setFeedback(null)
    setLoadError(null)

    const fallbackError =
      command === 'approve'
        ? t('loans:errors.failedApproveReschedule')
        : t('loans:errors.failedRejectReschedule')

    try {
      const businessDate = await businessDateInputValue()
      const actionDate = inputToFineractDate(businessDate)
      const batchPayload = buildRescheduleBatchRequests(
        selectedRows,
        command,
        actionDate
      )
      const response = await batchApi.handleBatchRequests(batchPayload, true)
      const batchError = getBatchErrorMessage(response.data, fallbackError)
      if (batchError) {
        setFeedback({ type: 'error', message: batchError })
        return
      }
      setFeedback({
        type: 'success',
        message:
          command === 'approve'
            ? t('loans:success.rescheduleApproved')
            : t('loans:success.rescheduleRejected'),
      })
      setSelectedRows([])
      await fetchRescheduledLoanDetails(true)
    } catch (err) {
      console.error(`Failed to ${command} rescheduled loan requests:`, err)
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err, fallbackError),
      })
    } finally {
      setIsSubmitting(false)
      if (command === 'approve') {
        setIsApproveDialogOpen(false)
      } else {
        setIsRejectDialogOpen(false)
      }
    }
  }

  const allVisibleSelected =
    filteredLoans.length > 0 &&
    filteredLoans.every(loan => selectedRows.includes(loan.id!))

  return (
    <div className="space-y-6 mt-6">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3 rounded-md text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md text-sm bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
        >
          <span>
            {loadError === 'refresh'
              ? t('loans:errors.failedRefreshReschedule')
              : t('loans:errors.failedLoadReschedule')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() =>
              void fetchRescheduledLoanDetails(loadError === 'refresh')
            }
            className="cursor-pointer"
          >
            {t('common:dashboard.retry')}
          </Button>
        </div>
      )}

      {rescheduleLoans.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Input
            placeholder={t('loans:rescheduleTable.filterByName')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/2"
          />
          <div className="flex gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              onClick={() => setIsApproveDialogOpen(true)}
              disabled={selectedRows.length === 0 || isSubmitting}
            >
              {t('common:actions.approve')}
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={selectedRows.length === 0 || isSubmitting}
            >
              {t('common:actions.reject')}
            </Button>
          </div>
        </div>
      )}

      {isLoading && rescheduleLoans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('common:actions.loading')}
        </div>
      ) : loadError &&
        rescheduleLoans.length === 0 ? null : rescheduleLoans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('loans:rescheduleTable.noPending')}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('loans:rescheduleTable.noMatching')}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{t('loans:rescheduleTable.client')}</TableHead>
              <TableHead>{t('loans:rescheduleTable.requestNumber')}</TableHead>
              <TableHead>
                {t('loans:rescheduleTable.loanAccountNumber')}
              </TableHead>
              <TableHead>{t('loans:rescheduleTable.rescheduleFrom')}</TableHead>
              <TableHead>
                {t('loans:rescheduleTable.rescheduleReason')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map(loan => (
              <TableRow
                key={loan.id}
                onClick={() => handleToggle(loan.id!)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.includes(loan.id!)}
                    onCheckedChange={() => handleToggle(loan.id!)}
                  />
                </TableCell>
                <TableCell>{loan.clientName ?? 'Unnamed'}</TableCell>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.loanAccountNumber}</TableCell>
                <TableCell>
                  {formatRescheduleDate(
                    loan.rescheduleFromDate as unknown as
                      | number[]
                      | string
                      | undefined,
                    i18n.language,
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {loan.rescheduleReasonCodeValue?.name ?? '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={open => {
          if (!isSubmitting) setIsApproveDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('loans:rescheduleDialog.approveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('loans:rescheduleDialog.approveDescription', {
                count: selectedRows.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              onClick={e => {
                e.preventDefault()
                void handleAction('approve')
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common:actions.loading')
                : t('common:actions.approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={open => {
          if (!isSubmitting) setIsRejectDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('loans:rescheduleDialog.rejectTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('loans:rescheduleDialog.rejectDescription', {
                count: selectedRows.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
              onClick={e => {
                e.preventDefault()
                void handleAction('reject')
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common:actions.loading')
                : t('common:actions.reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default RescheduleLoan
