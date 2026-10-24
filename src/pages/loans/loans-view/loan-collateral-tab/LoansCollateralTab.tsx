/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { LoanCollateralApi, type CollateralData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import fineract from '@/lib/axios'

import { Button } from '@/components/ui/button'
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

const loanCollateralApi = () =>
  new LoanCollateralApi(getConfiguration(), undefined, fineract)

const formatValue = (
  value?: number,
  currencyCode?: string,
  displaySymbol?: string
) => {
  if (value == null) return '—'
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  if (displaySymbol) return `${displaySymbol} ${formatted}`
  if (currencyCode) return `${currencyCode} ${formatted}`
  return formatted
}

const LoansCollateralTab = () => {
  const { clientId, groupId, loanId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('loans')
  const { t: tc } = useTranslation('common')

  const [collaterals, setCollaterals] = useState<CollateralData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [collateralToDelete, setCollateralToDelete] =
    useState<CollateralData | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadIdRef = useRef(0)

  const fetchCollaterals = useCallback(async () => {
    const requestId = ++loadIdRef.current
    if (!loanId) {
      setCollaterals([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await loanCollateralApi().retrieveCollateralDetails(
        Number(loanId)
      )
      if (requestId !== loadIdRef.current) return
      setCollaterals(res?.data ?? [])
    } catch (err) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to load collateral details from backend', err)
      setError(t('collateral.error', 'Failed to load loan collaterals.'))
      setCollaterals([])
    } finally {
      if (requestId === loadIdRef.current) {
        setLoading(false)
      }
    }
  }, [loanId, t])

  useEffect(() => {
    fetchCollaterals()
  }, [fetchCollaterals])

  const handleAddCollateral = () => {
    if (groupId) {
      navigate(
        `/groups/${groupId}/loans-accounts/${loanId}/actions/AddCollateral`
      )
    } else if (clientId) {
      navigate(
        `/clients/${clientId}/loans-accounts/${loanId}/actions/AddCollateral`
      )
    } else {
      navigate(`../actions/AddCollateral`)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!loanId || !collateralToDelete?.id || deletingId !== null) return

    const targetId = collateralToDelete.id
    setDeletingId(targetId)
    setDeleteError(null)

    try {
      await loanCollateralApi().deleteCollateral(Number(loanId), targetId)
      setCollateralToDelete(null)
      await fetchCollaterals()
    } catch (err) {
      console.error('Backend deleteCollateral failed', err)
      setDeleteError(
        t('collateral.deleteFailed', 'Failed to delete collateral.')
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-transparent space-y-4">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {t('collateral.title', 'Loan Collateral Details')}
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={handleAddCollateral}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('collateral.addCollateral', 'Add Collateral')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>{t('collateral.loading', 'Loading collaterals...')}</span>
        </div>
      ) : error ? (
        <div className="mx-4 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md">
          {error}
        </div>
      ) : collaterals.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500">
          {t('collateral.empty', 'No collaterals found')}
        </div>
      ) : (
        <div className="px-4">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('collateral.type', 'Type')}</TableHead>
                  <TableHead>{t('collateral.value', 'Value')}</TableHead>
                  <TableHead>
                    {t('collateral.description', 'Description')}
                  </TableHead>
                  <TableHead className="text-right">
                    {t('collateral.actions', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaterals.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.type?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {formatValue(
                        item.value,
                        item.currency?.code,
                        item.currency?.displaySymbol
                      )}
                    </TableCell>
                    <TableCell>{item.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === item.id}
                        onClick={() => {
                          setDeleteError(null)
                          setCollateralToDelete(item)
                        }}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {t('collateral.delete', 'Delete')}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AlertDialog
        open={collateralToDelete !== null}
        onOpenChange={open => {
          if (!open && !deletingId) {
            setCollateralToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('collateral.deleteConfirmTitle', 'Delete Collateral')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'collateral.deleteConfirmDescription',
                'Are you sure you want to delete this collateral? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {deleteError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              {tc('actions.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletingId !== null}
              onClick={handleDelete}
            >
              {deletingId !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('collateral.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LoansCollateralTab
