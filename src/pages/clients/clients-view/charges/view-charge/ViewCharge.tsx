/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDollarSign,
  faFlag,
  faTrash,
  faStop,
} from '@fortawesome/free-solid-svg-icons'

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
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import {
  ClientChargesApi,
  type GetClientsChargesPageItems,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import { canDeleteCharge, canPayCharge, canWaiveCharge } from './charge-actions'

type ChargeTransaction = {
  id?: number
  officeName?: string
  type?: { value?: string }
  date?: number[]
  amount?: number
  reversed?: boolean
}

type ChargeWithTransactions = GetClientsChargesPageItems & {
  clientTransactionDatas?: ChargeTransaction[]
}

const strike = (reversed?: boolean) =>
  reversed ? 'line-through opacity-50' : ''

const chargeApi = new ClientChargesApi(getConfiguration())

const ViewCharge = () => {
  const navigate = useNavigate()
  const { clientId, chargeId } = useParams<{
    clientId: string
    chargeId: string
  }>()
  const [charge, setCharge] = useState<ChargeWithTransactions>()
  const [isLoading, setIsLoading] = useState(true)
  // Stores the error kind (not a translated string) so a language change
  // does not re-run the fetch and reset the displayed charge.
  const [loadError, setLoadError] = useState<'load' | 'refresh' | null>(null)
  const [isWaiveOpen, setIsWaiveOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const requestIdRef = useRef(0)
  const routeKeyRef = useRef(`${clientId ?? ''}:${chargeId ?? ''}`)

  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const fetchDetails = useCallback(
    async (isRefresh = false) => {
      const reqId = ++requestIdRef.current
      const expectedRouteKey = `${clientId ?? ''}:${chargeId ?? ''}`
      if (!clientId || !chargeId) {
        setCharge(undefined)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setLoadError(null)
      try {
        const res = await chargeApi.retrieveClientCharge(
          Number(clientId),
          Number(chargeId),
          { params: { associations: 'all' } }
        )
        if (
          reqId !== requestIdRef.current ||
          expectedRouteKey !== routeKeyRef.current
        )
          return
        setCharge(res.data)
      } catch (err) {
        if (
          reqId !== requestIdRef.current ||
          expectedRouteKey !== routeKeyRef.current
        )
          return
        console.error("Couldn't fetch charge details", err)
        setCharge(undefined)
        setLoadError(isRefresh ? 'refresh' : 'load')
      } finally {
        if (
          reqId === requestIdRef.current &&
          expectedRouteKey === routeKeyRef.current
        ) {
          setIsLoading(false)
        }
      }
    },
    [clientId, chargeId]
  )

  useEffect(() => {
    routeKeyRef.current = `${clientId ?? ''}:${chargeId ?? ''}`
    requestIdRef.current += 1
    setCharge(undefined)
    setFeedback(null)
    setLoadError(null)
    setIsWaiveOpen(false)
    setIsDeleteOpen(false)
    setIsSubmitting(false)
    void fetchDetails(false)
  }, [clientId, chargeId, fetchDetails])

  const handleWaive = async () => {
    if (!clientId || !chargeId) return
    const expectedRouteKey = `${clientId}:${chargeId}`
    setIsSubmitting(true)
    setFeedback(null)
    setLoadError(null)
    try {
      await chargeApi.payOrWaiveClientCharge(
        Number(clientId),
        Number(chargeId),
        {},
        'waive'
      )
      if (expectedRouteKey !== routeKeyRef.current) return
      setCharge(undefined)
      setIsWaiveOpen(false)
      setFeedback({ type: 'success', message: t('charge.waiveSuccess') })
      await fetchDetails(true)
    } catch (err) {
      if (expectedRouteKey !== routeKeyRef.current) return
      console.error('Failed to waive charge', err)
      setIsWaiveOpen(false)
      setFeedback({ type: 'error', message: t('charge.waiveError') })
    } finally {
      if (expectedRouteKey === routeKeyRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const handleDelete = async () => {
    if (!clientId || !chargeId) return
    const expectedRouteKey = `${clientId}:${chargeId}`
    setIsSubmitting(true)
    setFeedback(null)
    try {
      await chargeApi.deleteClientCharge(Number(clientId), Number(chargeId))
      if (expectedRouteKey !== routeKeyRef.current) return
      setIsDeleteOpen(false)
      navigate(`/clients/${clientId}/general`, {
        state: {
          successMessage: t('charge.deleteSuccess'),
        } satisfies RouteSuccessState,
      })
    } catch (err) {
      if (expectedRouteKey !== routeKeyRef.current) return
      console.error('Failed to delete charge', err)
      setIsDeleteOpen(false)
      setFeedback({ type: 'error', message: t('charge.deleteError') })
    } finally {
      if (expectedRouteKey === routeKeyRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const canPay = canPayCharge(charge)
  const isWaivable = canWaiveCharge(charge)
  const isDeletable = canDeleteCharge(charge)
  const actionsDisabled = isLoading || isSubmitting

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          { label: t('client'), href: `/clients/${clientId}/general` },
          { label: charge?.name || t('charge.breadcrumbLabel'), current: true },
        ]}
      />

      {/* action feedback message */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 p-4 rounded-md text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-destructive/15 text-destructive'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 p-4 rounded-md bg-destructive/15 text-destructive text-sm font-medium"
        >
          <span>
            {loadError === 'refresh'
              ? t('charge.refreshError')
              : t('charge.loadError')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void fetchDetails(loadError === 'refresh')}
          >
            {t('charge.retry')}
          </Button>
        </div>
      )}

      {/* top actions */}
      <div className="flex gap-3 mb-4">
        <Button
          onClick={() => navigate('pay')}
          disabled={!canPay || actionsDisabled}
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
        >
          <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
          {t('charge.buttonPay')}
        </Button>
        <Button
          onClick={() => setIsWaiveOpen(true)}
          disabled={!isWaivable || actionsDisabled}
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
        >
          <FontAwesomeIcon icon={faFlag} className="mr-2" />
          {t('charge.buttonWaive')}
        </Button>
        <Button
          onClick={() => setIsDeleteOpen(true)}
          disabled={!isDeletable || actionsDisabled}
          variant="destructive"
        >
          <FontAwesomeIcon icon={faTrash} className="mr-2" />
          {t('charge.buttonDelete')}
        </Button>
      </div>

      {/* charge details */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm">
        <div className="px-6 py-4 text-lg font-semibold flex items-center gap-2">
          <FontAwesomeIcon
            icon={faStop}
            className={
              charge?.isWaived || charge?.isPaid
                ? 'text-zinc-400'
                : 'text-green-600'
            }
          />
          {charge?.name}
        </div>

        <div className="border-t px-6 py-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-1/3 p-3">{t('charge.labelCurrency')}</td>
                <td className="p-3">{charge?.currency?.name}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelChargeTimeType')}</td>
                <td className="p-3">{charge?.chargeTimeType?.code}</td>
              </tr>
              <tr>
                <td className="p-3">
                  {t('charge.labelChargeCalculationType')}
                </td>
                <td className="p-3">{charge?.chargeCalculationType?.code}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelDueAsOf')}</td>
                <td className="p-3">
                  {formatDate(
                    charge?.dueDate as number[] | undefined,
                    i18n.language
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelDue')}</td>
                <td className="p-3">{charge?.amount}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelPaid')}</td>
                <td className="p-3">{charge?.amountPaid}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelWaived')}</td>
                <td className="p-3">{charge?.amountWaived}</td>
              </tr>
              <tr>
                <td className="p-3">{t('charge.labelOutstanding')}</td>
                <td className="p-3">{charge?.amountOutstanding}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* transactions */}
        {charge?.clientTransactionDatas?.length ? (
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold mb-3">
              {t('charge.transactionsTitle')}
            </h1>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('charge.columnId')}</TableHead>
                  <TableHead>{t('charge.columnOfficeName')}</TableHead>
                  <TableHead>{tc('fields.type')}</TableHead>
                  <TableHead>{t('charge.columnTransactionDate')}</TableHead>
                  <TableHead>{t('charge.columnAmount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charge.clientTransactionDatas.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className={strike(tx.reversed)}>
                      {tx.id}
                    </TableCell>
                    <TableCell className={strike(tx.reversed)}>
                      {tx.officeName}
                    </TableCell>
                    <TableCell className={strike(tx.reversed)}>
                      {tx.type?.value}
                    </TableCell>
                    <TableCell className={strike(tx.reversed)}>
                      {formatDate(tx.date, i18n.language)}
                    </TableCell>
                    <TableCell className={strike(tx.reversed)}>
                      {tx.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('../../general')}
              >
                {tc('actions.back')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Waive Confirmation Dialog */}
      <AlertDialog
        open={isWaiveOpen}
        onOpenChange={open => {
          if (!isSubmitting) setIsWaiveOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('charge.waiveDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('charge.waiveDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {tc('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault()
                void handleWaive()
              }}
              disabled={isSubmitting}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {isSubmitting ? tc('actions.loading') : t('charge.buttonWaive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={open => {
          if (!isSubmitting) setIsDeleteOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('charge.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('charge.deleteDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {tc('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault()
                void handleDelete()
              }}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? tc('actions.loading') : t('charge.buttonDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ViewCharge
