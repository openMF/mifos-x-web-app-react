/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import fineract from '@/lib/axios'
import { formatDate } from '@/lib/date-utils'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faRotate,
  faUpload,
} from '@fortawesome/free-solid-svg-icons'

import { BULK_IMPORTS, CLIENT_LEGAL_FORMS } from './bulkImports'

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** One row of GET /imports */
type ImportRecord = {
  importId?: number
  name?: string
  importTime?: number[]
  endTime?: number[]
  completed?: boolean
  totalRecords?: number
  successCount?: number
  failureCount?: number
}

type Named = { id?: number; name?: string; displayName?: string }

const DATE_FORMAT = 'dd MMMM yyyy'
const LOCALE = 'en'

const errorMessage = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

/** Saves a blob through a temporary link, as the documents tab does */
const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * One import type: download its template (filtered by office, staff and, for
 * clients, legal form), upload a filled file, and see the past imports with
 * their result files. The Angular web app's View Bulk Import page.
 */
const ViewBulkImport = () => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const { importName } = useParams<{ importName: string }>()
  const entity = BULK_IMPORTS.find(e => e.slug === importName)

  const [offices, setOffices] = useState<Named[]>([])
  const [staff, setStaff] = useState<Named[]>([])
  const [officeId, setOfficeId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imports, setImports] = useState<ImportRecord[]>([])
  // Only the latest list request may update the table (see loadImports)
  const importsRequest = useRef(0)
  const [busy, setBusy] = useState<'download' | 'upload' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const showOffice = entity?.filters !== 'none'
  const showStaff =
    entity?.filters === 'officeStaff' || entity?.filters === 'client'
  const isClients = entity?.filters === 'client'

  const loadImports = useCallback(async () => {
    if (!entity) return
    const request = ++importsRequest.current
    try {
      const res = await fineract.get<ImportRecord[]>('v1/imports', {
        params: { entityType: entity.entityType },
      })
      // A slower, older request must not replace a newer list
      if (request !== importsRequest.current) return
      // Newest first. For clients Fineract returns the entity imports followed by
      // the person imports, so the combined list has to be sorted again.
      setImports(
        [...(res.data ?? [])].sort(
          (a, b) => (b.importId ?? 0) - (a.importId ?? 0)
        )
      )
    } catch (err) {
      if (request !== importsRequest.current) return
      setError(errorMessage(err, t('bulkImport.errors.loadImports')))
    }
  }, [entity, t])

  useEffect(() => {
    loadImports()
  }, [loadImports])

  useEffect(() => {
    if (!showOffice) return
    ;(async () => {
      try {
        const res = await fineract.get<Named[]>('v1/offices')
        setOffices(res.data ?? [])
      } catch (err) {
        setError(errorMessage(err, t('bulkImport.errors.loadOffices')))
      }
    })()
  }, [showOffice, t])

  // The staff list depends on the office
  useEffect(() => {
    setStaffId('')
    setStaff([])
    if (!showStaff || !officeId) return
    // Ignore the answer for an office that is no longer selected
    let stale = false
    ;(async () => {
      try {
        const res = await fineract.get<Named[]>('v1/staff', {
          params: { officeId },
        })
        if (!stale) setStaff(res.data ?? [])
      } catch (err) {
        if (!stale)
          setError(errorMessage(err, t('bulkImport.errors.loadStaff')))
      }
    })()
    return () => {
      stale = true
    }
  }, [showStaff, officeId, t])

  if (!entity) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
        <p>{t('bulkImport.unknownType', { name: importName })}</p>
      </div>
    )
  }

  const handleDownloadTemplate = async () => {
    if (busy) return
    if (isClients && !legalForm) {
      setError(t('bulkImport.errors.templateLegalForm'))
      return
    }
    setBusy('download')
    setError(null)
    try {
      const res = await fineract.get<Blob>(
        `v1${entity.urlSuffix}/downloadtemplate`,
        {
          params: {
            dateFormat: DATE_FORMAT,
            locale: LOCALE,
            ...(officeId ? { officeId } : {}),
            ...(staffId ? { staffId } : {}),
            ...(isClients ? { legalFormType: legalForm } : {}),
          },
          responseType: 'blob',
          // This endpoint returns the raw file and refuses Accept: application/json
          headers: { Accept: '*/*' },
        }
      )
      saveBlob(res.data, `${entity.slug}-template.xls`)
    } catch {
      setError(t('bulkImport.errors.downloadTemplate'))
    } finally {
      setBusy(null)
    }
  }

  const handleUpload = async () => {
    if (!file || busy) return
    if (isClients && !legalForm) {
      setError(t('bulkImport.errors.uploadLegalForm'))
      return
    }
    setBusy('upload')
    setError(null)
    setNotice(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('locale', LOCALE)
      form.append('dateFormat', DATE_FORMAT)
      await fineract.post(`v1${entity.urlSuffix}/uploadtemplate`, form, {
        params: isClients ? { legalFormType: legalForm } : undefined,
        // The shared client defaults to JSON; Fineract only takes the file as multipart
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setNotice(t('bulkImport.upload.uploaded', { fileName: file.name }))
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadImports()
    } catch (err) {
      setError(errorMessage(err, t('bulkImport.errors.upload')))
    } finally {
      setBusy(null)
    }
  }

  const handleDownloadOutput = async (record: ImportRecord) => {
    if (record.importId === undefined) return
    setError(null)
    try {
      const res = await fineract.get<Blob>(
        'v1/imports/downloadOutputTemplate',
        {
          params: { importDocumentId: record.importId },
          responseType: 'blob',
          headers: { Accept: '*/*' },
        }
      )
      saveBlob(res.data, record.name || `import-${record.importId}.xls`)
    } catch {
      setError(t('bulkImport.errors.downloadFile'))
    }
  }

  const entityName = t(`bulkImport.types.${entity.labelKey}`)

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('common:actions.bulkImport'),
            href: '/organization/bulk-import',
          },
          { label: entityName, current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mb-4">
        {t('bulkImport.importTitle', { name: entityName })}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow space-y-4">
          <h2 className="text-lg font-semibold">
            {t('bulkImport.download.heading')}
          </h2>
          {showOffice && (
            <AppSelect
              selectLabel={t('bulkImport.download.office')}
              selectPlaceholder={t('bulkImport.download.allOffices')}
              selectValue={officeId}
              selectOnChange={setOfficeId}
              selectOptions={offices.map(o => ({
                id: o.id ?? '',
                name: o.name ?? '',
              }))}
              selectClassname="w-full space-y-2"
            />
          )}
          {showStaff && (
            <AppSelect
              selectLabel={t('bulkImport.download.staff')}
              selectPlaceholder={
                officeId
                  ? t('bulkImport.download.allStaff')
                  : t('bulkImport.download.selectOfficeFirst')
              }
              selectValue={staffId}
              selectOnChange={setStaffId}
              selectOptions={staff.map(s => ({
                id: s.id ?? '',
                name: s.displayName ?? '',
              }))}
              selectEmptyMessage={t('bulkImport.download.noStaff')}
              selectClassname="w-full space-y-2"
            />
          )}
          {isClients && (
            <AppSelect
              selectLabel={t('bulkImport.download.legalForm')}
              selectPlaceholder={t('bulkImport.download.selectLegalForm')}
              selectValue={legalForm}
              selectOnChange={value => {
                setLegalForm(value)
                // A missing-legal-form error no longer applies once one is chosen
                setError(null)
              }}
              selectOptions={CLIENT_LEGAL_FORMS.map(form => ({
                id: form.id,
                name: t(`bulkImport.legalForms.${form.labelKey}`),
              }))}
              selectClassname="w-full space-y-2"
            />
          )}
          <Button
            type="button"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={busy !== null}
            onClick={handleDownloadTemplate}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            {busy === 'download'
              ? t('bulkImport.download.downloading')
              : t('bulkImport.download.button')}
          </Button>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow space-y-4">
          <h2 className="text-lg font-semibold">
            {t('bulkImport.upload.heading')}
          </h2>
          <div className="space-y-2">
            <Label htmlFor="importFile">{t('bulkImport.upload.file')}</Label>
            <Input
              id="importFile"
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel"
              onChange={e => {
                setFile(e.target.files?.[0] ?? null)
                setNotice(null)
                setError(null)
              }}
            />
          </div>
          {isClients && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t('bulkImport.upload.legalFormNote')}
            </p>
          )}
          <Button
            type="button"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={!file || busy !== null}
            onClick={handleUpload}
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            {busy === 'upload'
              ? t('bulkImport.upload.uploading')
              : t('bulkImport.upload.button')}
          </Button>
        </section>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          {notice}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {t('bulkImport.imports.heading')}
        </h2>
        <Button type="button" variant="outline" onClick={loadImports}>
          <FontAwesomeIcon icon={faRotate} className="mr-2" />
          {t('bulkImport.imports.refresh')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {imports.length
              ? t('bulkImport.imports.count', { count: imports.length })
              : t('bulkImport.imports.empty')}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.name')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.importTime')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.endTime')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.completed')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.total')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.success')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.failed')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('bulkImport.imports.columns.file')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map(record => (
              <TableRow key={record.importId}>
                <TableCell className="px-4 py-3">{record.name}</TableCell>
                <TableCell className="px-4 py-3">
                  {formatDate(record.importTime, i18n.language)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {formatDate(record.endTime, i18n.language)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {record.completed
                    ? t('common:actions.yes')
                    : t('common:actions.no')}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {record.totalRecords ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {record.successCount ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {record.failureCount ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t('bulkImport.imports.downloadFile', {
                      name: record.name,
                    })}
                    onClick={() => handleDownloadOutput(record)}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ViewBulkImport
