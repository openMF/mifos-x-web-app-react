/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

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
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TellerCashManagementApi } from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorMessage,
  shiftLabel,
  type Cashier,
  type CashiersOfTeller,
} from './types'

const tellersApi = new TellerCashManagementApi(getConfiguration())

/** The cashiers of one teller, as in the Angular web app */
const Cashiers = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [data, setData] = useState<CashiersOfTeller | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Cashier | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await tellersApi.getCashierData1(Number(id))
      setData((res.data ?? {}) as CashiersOfTeller)
    } catch (err) {
      setError(apiErrorMessage(err, t('cashiers.errors.loadList')))
    }
  }, [id, t])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!pendingDelete?.id || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await tellersApi.deleteCashier(Number(id), pendingDelete.id)
      // Close only once the cashier is gone; a failure stays in the dialog
      setPendingDelete(null)
      await load()
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('cashiers.errors.delete')))
    } finally {
      setDeleting(false)
    }
  }

  const cashiers = data?.cashiers ?? []

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
            label: data?.tellerName ?? id ?? '',
            href: `/organization/tellers/${id}`,
          },
          { label: t('cashiers.title'), current: true },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t('cashiers.title')}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {data?.tellerName} • {data?.officeName}
          </p>
        </div>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          onClick={() =>
            navigate(`/organization/tellers/${id}/cashiers/create`)
          }
        >
          <Plus className="mr-2" /> {t('cashiers.create')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {cashiers.length
              ? t('cashiers.count', { count: cashiers.length })
              : t('cashiers.empty')}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.cashier')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.description')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.from')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.to')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.shift')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('cashiers.fields.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashiers.map(c => (
              <TableRow
                key={c.id}
                className="text-base hover:bg-muted cursor-pointer"
                onClick={() =>
                  navigate(`/organization/tellers/${id}/cashiers/${c.id}`)
                }
              >
                <TableCell className="px-6 py-4">
                  {/* A link too, so the cashier opens from the keyboard */}
                  <Link
                    to={`/organization/tellers/${id}/cashiers/${c.id}`}
                    className="hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {c.staffName}
                  </Link>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.description || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {formatDate(c.startDate)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {formatDate(c.endDate)}
                </TableCell>
                <TableCell className="px-6 py-4">{shiftLabel(c, t)}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('cashiers.editAria', {
                        name: c.staffName ?? '',
                      })}
                      onClick={e => {
                        e.stopPropagation()
                        navigate(
                          `/organization/tellers/${id}/cashiers/${c.id}/edit`
                        )
                      }}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('cashiers.deleteAria', {
                        name: c.staffName ?? '',
                      })}
                      disabled={deleting}
                      onClick={e => {
                        e.stopPropagation()
                        setPendingDelete(c)
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="text-red-600"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => {
          if (!open && !deleting) {
            setPendingDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cashiers.deleteDialog.confirm', {
                name: pendingDelete?.staffName ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {deleteError}
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
  )
}

export default Cashiers
