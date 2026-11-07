/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'
import { Plus } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { getConfiguration } from '@/lib/fineract-openapi'
import {
  EntityDataTableApi,
  type GetEntityDatatableChecksResponse,
} from '@/fineract-api'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

import { entityLabelKey } from './entities'

const entityDataTableApi = new EntityDataTableApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** GET /entityDatatableChecks returns a page, not a plain array */
type EntityDatatableChecksPage = {
  totalFilteredRecords?: number
  pageItems?: GetEntityDatatableChecksResponse[]
}

const errorMessage = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

/** Organization > Entity Data Table Checks, as in the Angular web app */
const EntityDataTableChecks = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  const entityLabel = (entity?: string) => {
    const key = entityLabelKey(entity)
    return key ? t(key) : (entity ?? '')
  }

  const [checks, setChecks] = useState<GetEntityDatatableChecksResponse[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [pendingDelete, setPendingDelete] =
    useState<GetEntityDatatableChecksResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchChecks = useCallback(async () => {
    try {
      // Fineract pages this list; ask for everything and filter here, as Angular does
      const res = await entityDataTableApi.retrieveAll6(
        undefined,
        undefined,
        undefined,
        0,
        -1
      )
      const data = res.data as unknown as EntityDatatableChecksPage
      setChecks(data?.pageItems ?? [])
      setLoadError(null)
    } catch (err) {
      setLoadError(errorMessage(err, t('entityChecks.errors.loadFailed')))
    }
  }, [t])

  useEffect(() => {
    fetchChecks()
  }, [fetchChecks])

  const handleDelete = async () => {
    if (!pendingDelete?.id || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await entityDataTableApi.deleteDatatable1(pendingDelete.id)
      setPendingDelete(null)
      await fetchChecks()
    } catch (err) {
      setDeleteError(errorMessage(err, t('entityChecks.errors.deleteFailed')))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  // Filter + pagination
  const term = searchTerm.toLowerCase()
  const filtered = checks.filter(c =>
    [
      entityLabel(c.entity),
      c.productName,
      c.datatableName,
      c.status?.value,
    ].some(v =>
      String(v ?? '')
        .toLowerCase()
        .includes(term)
    )
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  // A delete can empty the last page, so never show a page past the end
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          { label: t('entityDataTableChecks'), current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/data-checks/create')}
        >
          <Plus className="mr-2" /> {t('common:actions.create')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder={t('common:actions.filter')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder={t('common:pagination.itemsPerPage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            {t('common:actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>

      {(loadError || deleteError) && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError || deleteError}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('common:pagination.showing', {
              current: paginated.length,
              total: filtered.length,
              page: currentPage,
              pages: totalPages,
            })}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">
                {t('common:fields.entity')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('entityChecks.fields.productName')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('entityChecks.fields.dataTable')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('common:fields.status')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('entityChecks.fields.systemDefined')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('entityChecks.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(c => (
              <TableRow key={c.id} className="text-base">
                <TableCell className="px-6 py-4">
                  {entityLabel(c.entity)}
                </TableCell>
                {/* No product means the check applies to every product */}
                <TableCell className="px-6 py-4">
                  {c.productName ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">{c.datatableName}</TableCell>
                <TableCell className="px-6 py-4">{c.status?.value}</TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={c.systemDefined ? faCircleCheck : faCircleXmark}
                    className={
                      c.systemDefined ? 'text-green-500' : 'text-red-500'
                    }
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('entityChecks.deleteCheck', {
                      name: c.datatableName,
                    })}
                    disabled={deleting}
                    onClick={() => {
                      setDeleteError(null)
                      setPendingDelete(c)
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => {
          if (!open && !deleting) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('entityChecks.confirmDelete', {
                name: pendingDelete?.datatableName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
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
                ? t('entityChecks.deleting')
                : t('entityChecks.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EntityDataTableChecks
