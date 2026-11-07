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
import type { AxiosError } from 'axios'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  DataTablesApi,
  type GetDataTablesResponse,
  type ResultsetColumnHeaderData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { isJsonColumn } from '@/lib/datatable-json'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faPen,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

import type { DataTablesApiErrorResponse } from './dataTableOptions'

const dataTablesApi = new DataTablesApi(getConfiguration())

const ViewDataTables = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['datatables', 'common'])
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleDelete = async () => {
    if (!id || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await dataTablesApi.deleteDatatable(id)
      setConfirmOpen(false)
      navigate('/system/data-tables')
    } catch (err) {
      const data = (err as AxiosError<DataTablesApiErrorResponse>).response
        ?.data
      setDeleteError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('manage.errors.deleteFailed')
      )
      setDeleting(false)
    }
  }

  const [assocWith, setAssocWith] = useState('')
  const [fields, setFields] = useState<ResultsetColumnHeaderData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Fetch datatable details
  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await dataTablesApi.getDatatable(id)
        const data: GetDataTablesResponse = res?.data ?? {}
        // The entity the data table belongs to, e.g. m_client
        setAssocWith(data.applicationTableName ?? '')
        setFields(
          Array.isArray(data.columnHeaderData) ? data.columnHeaderData : []
        )
        // A missing table comes back as 204 with no body
        setLoaded(Boolean(data.registeredTableName))
      } catch (err) {
        console.error('Failed to fetch datatable', err)
        setAssocWith('')
        setFields([])
      }
    })()
  }, [id])

  // Filter + pagination
  const filtered = fields.filter(c =>
    String(c.columnName ?? '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handleItemsChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manage.title'), href: '/system/data-tables' },
          { label: id ?? '—', current: true },
        ]}
      />

      {/* Edit + Delete, as in the Angular web app, once the table has loaded */}
      {loaded && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() =>
              navigate(
                `/system/data-tables/${encodeURIComponent(id ?? '')}/edit`
              )
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
                setDeleteError(null)
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                disabled={deleting}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                {deleting ? t('manage.deleting') : t('common:actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common:actions.delete')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('manage.deleteConfirm', { name: id })}
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
                  {deleting ? t('manage.deleting') : t('manage.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder={t('manage.searchFields')}
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
            onValueChange={handleItemsChange}
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
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t('common:actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>

      {/* Associated With info */}
      <div className="mb-4 rounded-md border bg-white dark:bg-zinc-900">
        <div className="px-6 py-4 text-sm">
          <span className="font-medium">{t('manage.associatedWith')}</span>{' '}
          <span className="text-zinc-600 dark:text-zinc-300">
            {assocWith || '—'}
          </span>
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('common:pagination.showing', {
              current: paginated.length,
              total: filtered.length,
              page,
              pages: totalPages,
            })}
          </TableCaption>

          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">
                {t('manage.fieldName')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('common:fields.type')}
              </TableHead>
              <TableHead className="px-6 py-4">{t('manage.length')}</TableHead>
              <TableHead className="px-6 py-4">{t('manage.code')}</TableHead>
              <TableHead className="px-6 py-4">
                {t('manage.mandatory')}
              </TableHead>
              <TableHead className="px-6 py-4">{t('manage.unique')}</TableHead>
              <TableHead className="px-6 py-4">{t('manage.indexed')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((c, idx) => (
              <TableRow
                key={idx}
                className="text-base hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <TableCell className="px-6 py-4 font-medium">
                  {c.columnName ?? ''}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {isJsonColumn(c) ? (
                    // A JSON column is reported with a TEXT display type, so
                    // the raw type is the only thing that names it. Calling it
                    // out here saves reading the schema to find out which text
                    // columns hold documents.
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {t('columnTypes.json')}
                    </span>
                  ) : (
                    String(c.columnType ?? '').toUpperCase()
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.columnLength ?? 0}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.columnCode ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {/* GET /datatables/{name} sends isColumnNullable, not mandatory */}
                  {c.isColumnNullable === undefined ? (
                    '—'
                  ) : (
                    <FontAwesomeIcon
                      icon={c.isColumnNullable ? faCircleXmark : faCircleCheck}
                      className={
                        c.isColumnNullable
                          ? 'w-4 h-4 text-red-500'
                          : 'w-4 h-4 text-green-500'
                      }
                    />
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={c.isColumnUnique ? faCircleCheck : faCircleXmark}
                    className={
                      c.isColumnUnique
                        ? 'w-4 h-4 text-green-500'
                        : 'w-4 h-4 text-red-500'
                    }
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <FontAwesomeIcon
                    icon={c.isColumnIndexed ? faCircleCheck : faCircleXmark}
                    className={
                      c.isColumnIndexed
                        ? 'w-4 h-4 text-green-500'
                        : 'w-4 h-4 text-red-500'
                    }
                  />
                </TableCell>
              </TableRow>
            ))}

            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 py-6"
                >
                  {t('manage.noFields')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ViewDataTables
