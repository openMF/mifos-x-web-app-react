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
import fineract from '@/lib/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorMessage,
  humanize,
  isSecretField,
  type Hook,
  type HookRequestError,
} from './types'

/** View Hook, with Edit and Delete, as in the Angular web app */
const ViewHook = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [hook, setHook] = useState<Hook | null>(null)
  const [error, setError] = useState<HookRequestError | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fineract.get<Hook>(`v1/hooks/${id}`)
        setHook(res.data ?? {})
      } catch (err) {
        setError({ message: apiErrorMessage(err), fallback: 'loadHook' })
      }
    })()
  }, [id])

  const handleDelete = async () => {
    if (!id || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await fineract.delete(`v1/hooks/${id}`)
      setConfirmOpen(false)
      navigate('/system/hooks')
    } catch (err) {
      setError({ message: apiErrorMessage(err), fallback: 'delete' })
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageHooks'), href: '/system/hooks' },
          { label: hook?.displayName ?? id ?? '', current: true },
        ]}
      />

      {/* Edit and Delete only once the hook has loaded */}
      {hook && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/system/hooks/${id}/edit`)}
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
                  ? t('hooks.actions.deleting')
                  : t('common:actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common:actions.delete')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('hooks.deleteConfirm', { name: hook?.displayName ?? '' })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error.message ?? t(`hooks.errors.${error.fallback}`)}
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
                    ? t('hooks.actions.deleting')
                    : t('hooks.actions.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {error && !confirmOpen && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error.message ?? t(`hooks.errors.${error.fallback}`)}
        </div>
      )}

      {hook && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
          <dl className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-2">
            <dt className="font-medium">{t('hooks.fields.template')}</dt>
            <dd>{hook.name}</dd>
            <dt className="font-medium">{t('hooks.fields.name')}</dt>
            <dd>{hook.displayName}</dd>
            <dt className="font-medium">{t('common:fields.status')}</dt>
            <dd>
              {hook.isActive
                ? t('common:status.active')
                : t('common:status.inactive')}
            </dd>
            {(hook.config ?? []).map(c => (
              <div key={c.fieldName} className="contents">
                <dt className="font-medium">{c.fieldName}</dt>
                <dd className="break-all">
                  {!c.fieldValue
                    ? '—'
                    : isSecretField(c.fieldName)
                      ? t('hooks.secretHidden')
                      : c.fieldValue}
                </dd>
              </div>
            ))}
          </dl>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">
                    {t('common:fields.entity')}
                  </TableHead>
                  <TableHead className="px-4 py-2">
                    {t('hooks.fields.action')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(hook.events ?? []).map(ev => (
                  <TableRow key={`${ev.entityName}-${ev.actionName}`}>
                    <TableCell className="px-4 py-2">
                      {humanize(ev.entityName)}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {humanize(ev.actionName)}
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

export default ViewHook
