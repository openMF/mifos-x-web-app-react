/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TellerCashManagementApi } from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

import { apiErrorMessage, shiftLabel, type Cashier } from './types'

const tellersApi = new TellerCashManagementApi(getConfiguration())

/** View Cashier, with Edit and Delete, as in the Angular web app */
const ViewCashier = () => {
  const { id, cashierId } = useParams<{ id: string; cashierId: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [cashier, setCashier] = useState<
    (Cashier & { tellerName?: string }) | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!id || !cashierId) return
    ;(async () => {
      try {
        const res = await tellersApi.findCashierData(
          Number(id),
          Number(cashierId)
        )
        setCashier((res.data ?? {}) as Cashier & { tellerName?: string })
      } catch (err) {
        setError(apiErrorMessage(err, t('cashiers.errors.load')))
      }
    })()
  }, [id, cashierId, t])

  const handleDelete = async () => {
    if (!id || !cashierId || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await tellersApi.deleteCashier(Number(id), Number(cashierId))
      setConfirmOpen(false)
      navigate(`/organization/tellers/${id}/cashiers`)
    } catch (err) {
      setError(apiErrorMessage(err, t('cashiers.errors.delete')))
      setDeleting(false)
    }
  }

  const rows: [string, string][] = cashier
    ? [
        [t('cashiers.fields.teller'), cashier.tellerName ?? ''],
        [t('cashiers.fields.cashier'), cashier.staffName ?? ''],
        [t('cashiers.fields.description'), cashier.description || '—'],
        [t('cashiers.fields.from'), formatDate(cashier.startDate)],
        [t('cashiers.fields.to'), formatDate(cashier.endDate)],
        [t('cashiers.fields.shift'), shiftLabel(cashier, t)],
      ]
    : []

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('cashiers.breadcrumbs.tellers'),
            href: '/organization/tellers',
          },
          {
            label: t('cashiers.title'),
            href: `/organization/tellers/${id}/cashiers`,
          },
          { label: cashier?.staffName ?? cashierId ?? '', current: true },
        ]}
      />

      {/* Edit and Delete only once the cashier has loaded */}
      {cashier && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() =>
              navigate(`/organization/tellers/${id}/cashiers/${cashierId}/edit`)
            }
          >
            <FontAwesomeIcon icon={faPen} className="mr-2" />
            {t('common:actions.edit')}
          </Button>
          <AlertDialog
            open={confirmOpen}
            onOpenChange={open => {
              if (!deleting) {
                setConfirmOpen(open)
                setError(null)
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                disabled={deleting}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                {deleting
                  ? t('cashiers.deleteDialog.deleting')
                  : t('common:actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common:actions.delete')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('cashiers.deleteDialog.confirm', {
                    name: cashier?.staffName ?? '',
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  {t('common:actions.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleting}
                  onClick={e => {
                    // Keep the dialog open until the request finishes
                    e.preventDefault()
                    handleDelete()
                  }}
                >
                  {deleting
                    ? t('cashiers.deleteDialog.deleting')
                    : t('cashiers.deleteDialog.confirmButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {error && !confirmOpen && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {cashier && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 max-w-2xl">
          <dl className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-medium">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

export default ViewCashier
