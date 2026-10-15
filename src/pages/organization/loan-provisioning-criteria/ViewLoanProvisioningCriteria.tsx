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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProvisioningCriteriaApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorMessage,
  categoryLabel,
  type ProvisioningCriteria,
} from './types'

const provisioningCriteriaApi = new ProvisioningCriteriaApi(getConfiguration())

/** View Loan Provisioning Criteria, with Edit and Delete, as in the Angular web app */
const ViewLoanProvisioningCriteria = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [criteria, setCriteria] = useState<ProvisioningCriteria | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await provisioningCriteriaApi.retrieveProvisioningCriteria(
          Number(id)
        )
        setCriteria((res.data ?? {}) as ProvisioningCriteria)
      } catch (err) {
        setError(
          apiErrorMessage(err, t('provisioningCriteria.messages.loadError'))
        )
      }
    })()
  }, [id, t])

  const handleDelete = async () => {
    if (!id || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await provisioningCriteriaApi.deleteProvisioningCriteria(Number(id))
      setConfirmOpen(false)
      navigate('/organization/loan-provisioning')
    } catch (err) {
      setError(
        apiErrorMessage(err, t('provisioningCriteria.messages.deleteError'))
      )
      setDeleting(false)
    }
  }

  const products = (criteria?.loanProducts ?? [])
    .map(p => p.name)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('provisioningCriteria.title'),
            href: '/organization/loan-provisioning',
          },
          { label: criteria?.criteriaName ?? id ?? '', current: true },
        ]}
      />

      {/* Edit and Delete only once the criterion has loaded */}
      {criteria && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() =>
              navigate(`/organization/loan-provisioning/${id}/edit`)
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
                  ? t('provisioningCriteria.delete.deleting')
                  : t('common:actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common:actions.delete')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('provisioningCriteria.delete.message', {
                    name: criteria?.criteriaName ?? '',
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
                    ? t('provisioningCriteria.delete.deleting')
                    : t('provisioningCriteria.delete.confirm')}
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

      {criteria && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-3">
            <span className="font-medium">
              {t('provisioningCriteria.fields.criteriaName')}
            </span>
            <span>{criteria.criteriaName}</span>
            <span className="font-medium">
              {t('provisioningCriteria.fields.loanProducts')}
            </span>
            <span>{products || '—'}</span>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">
                    {t('common:ui.category')}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t('provisioningCriteria.fields.minAgeDays')}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t('provisioningCriteria.fields.maxAgeDays')}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t('provisioningCriteria.fields.percentageColumn')}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t('provisioningCriteria.fields.liabilityAccount')}
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    {t('provisioningCriteria.fields.expenseAccount')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(criteria.definitions ?? []).map(d => (
                  <TableRow key={d.categoryId}>
                    <TableCell className="px-4 py-3 font-medium">
                      {categoryLabel(d.categoryName)}
                    </TableCell>
                    <TableCell className="px-4 py-3">{d.minAge}</TableCell>
                    <TableCell className="px-4 py-3">{d.maxAge}</TableCell>
                    <TableCell className="px-4 py-3">
                      {d.provisioningPercentage}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {d.liabilityName ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {d.expenseName ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewLoanProvisioningCriteria
