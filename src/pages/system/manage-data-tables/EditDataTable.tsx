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

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTablesApi,
  type PostColumnHeaderData,
  type PutDataTablesRequest,
  type PutDataTablesRequestChangeColumns,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import AddColumnForm from './AddColumnForm'
import {
  type DataTablesApiErrorResponse,
  isSystemColumn,
  useDataTableOptions,
} from './dataTableOptions'
import { useCodeOptions } from './useCodeOptions'

const dataTablesApi = new DataTablesApi(getConfiguration())

/** Fineract also takes a length when a column changes (see ISSUES.md) */
type ChangeColumn = PutDataTablesRequestChangeColumns & { length?: number }

/** An existing column and the edits made to it on this page */
type ExistingColumn = {
  name: string
  /** The type id, as in COLUMN_TYPES */
  displayType: string
  length?: number
  code?: string
  mandatory: boolean
  unique: boolean
  indexed: boolean
  system: boolean
  newName: string
  newLength: string
  newMandatory: boolean
  dropped: boolean
}

/** The COLUMN_TYPES id of a column read from GET /datatables/{name} */
const displayTypeId = (displayType?: string, columnType?: string) => {
  if (columnType?.toLowerCase() === 'json') return 'json'
  switch (displayType) {
    case 'INTEGER':
      return 'Number'
    case 'CODELOOKUP':
      return 'Dropdown'
    case undefined:
      return ''
    default:
      return displayType[0] + displayType.slice(1).toLowerCase()
  }
}

/** Edits a data table (PUT /datatables/{name}), the Edit Data Table page of the Angular web app */
const EditDataTable = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['datatables', 'common'])
  const { appTables, typeName } = useDataTableOptions()
  const [apptableName, setApptableName] = useState('')
  const [entitySubType, setEntitySubType] = useState('')
  const [existing, setExisting] = useState<ExistingColumn[]>([])
  const [added, setAdded] = useState<PostColumnHeaderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { codes, error: codesError } = useCodeOptions()

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError(null)
    setLoadFailed(false)
    setAdded([])
    const fetchDataTable = async () => {
      try {
        const res = await dataTablesApi.getDatatable(id)
        if (ignore) return
        const data = res.data
        const appTable = data.applicationTableName ?? ''
        setApptableName(appTable)
        setEntitySubType(
          (data as { entitySubType?: string }).entitySubType ?? ''
        )
        setExisting(
          (data.columnHeaderData ?? [])
            .filter(c => c.columnName && c.columnName !== 'id')
            .map(c => {
              const mandatory = !c.isColumnNullable
              return {
                name: c.columnName!,
                displayType: displayTypeId(c.columnDisplayType, c.columnType),
                length: c.columnLength,
                code: c.columnCode,
                mandatory,
                unique: !!c.isColumnUnique,
                indexed: !!c.isColumnIndexed,
                system: isSystemColumn(c.columnName!, appTable),
                newName: c.columnName!,
                newLength: c.columnLength ? String(c.columnLength) : '',
                newMandatory: mandatory,
                dropped: false,
              }
            })
        )
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch data table', err)
        setLoadFailed(true)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchDataTable()
    return () => {
      ignore = true
    }
  }, [id])

  const updateExisting = (name: string, patch: Partial<ExistingColumn>) => {
    setExisting(prev =>
      prev.map(c => (c.name === name ? { ...c, ...patch } : c))
    )
    setError(null)
  }

  const changeColumns: ChangeColumn[] = existing
    .filter(c => !c.system && !c.dropped)
    .flatMap(c => {
      const change: ChangeColumn = { name: c.name }
      const newName = c.newName.trim()
      if (newName && newName !== c.name) change.newName = newName
      const newLength = Number(c.newLength)
      if (c.displayType === 'String' && newLength !== c.length) {
        change.length = newLength
      }
      if (c.newMandatory !== c.mandatory) change.mandatory = c.newMandatory
      return Object.keys(change).length > 1 ? [change] : []
    })
  const dropColumns = existing
    .filter(c => c.dropped)
    .map(c => ({ name: c.name }))
  const hasChanges =
    changeColumns.length > 0 || dropColumns.length > 0 || added.length > 0

  const columnNames = [
    ...existing.filter(c => !c.dropped).map(c => c.newName.trim() || c.name),
    ...added.map(c => c.name),
  ]

  const validate = () => {
    const names = columnNames.map(n => n.toLowerCase())
    if (names.some((n, i) => names.indexOf(n) !== i)) {
      return t('manage.errors.duplicateNames')
    }
    const badLength = existing.find(
      c =>
        !c.system &&
        !c.dropped &&
        c.displayType === 'String' &&
        !(Number.isInteger(Number(c.newLength)) && Number(c.newLength) > 0)
    )
    if (badLength) {
      return t('manage.errors.columnLength', { name: badLength.name })
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    const body: PutDataTablesRequest = {
      ...(changeColumns.length ? { changeColumns } : {}),
      ...(dropColumns.length ? { dropColumns } : {}),
      ...(added.length ? { addColumns: added } : {}),
    }
    setSubmitting(true)
    setError(null)
    try {
      await dataTablesApi.updateDatatable(id, body)
      navigate(`/system/data-tables/${encodeURIComponent(id)}`)
    } catch (err) {
      const data = (err as AxiosError<DataTablesApiErrorResponse>).response
        ?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('manage.errors.updateFailed')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const appTableLabel =
    appTables.find(a => a.id === apptableName)?.name ?? apptableName
  const yesNo = (value?: boolean) =>
    value ? t('common:actions.yes') : t('common:actions.no')
  const message =
    error ?? (loadFailed ? t('manage.errors.loadFailed') : null) ?? codesError

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manage.title'), href: '/system/data-tables' },
          {
            label: id,
            href: `/system/data-tables/${encodeURIComponent(id)}`,
          },
          { label: t('common:actions.edit'), current: true },
        ]}
      />

      <form
        className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow space-y-8"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold">{t('manage.editTitle')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium">{t('manage.dataTableName')}</div>
            <div className="text-muted-foreground">{id}</div>
          </div>
          <div>
            <div className="font-medium">
              {t('manage.applicationTableName')}
            </div>
            <div className="text-muted-foreground">{appTableLabel || '—'}</div>
          </div>
          {entitySubType && (
            <div>
              <div className="font-medium">{t('manage.subType')}</div>
              <div className="text-muted-foreground">{entitySubType}</div>
            </div>
          )}
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t('manage.columns')}</h3>

          <AddColumnForm
            existingNames={columnNames}
            codes={codes}
            onAdd={c => {
              setAdded(prev => [...prev, c])
              setError(null)
            }}
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common:fields.name')}</TableHead>
                  <TableHead>{t('common:fields.type')}</TableHead>
                  <TableHead>{t('manage.length')}</TableHead>
                  <TableHead>{t('manage.code')}</TableHead>
                  <TableHead>{t('manage.mandatory')}</TableHead>
                  <TableHead>{t('manage.unique')}</TableHead>
                  <TableHead>{t('manage.indexed')}</TableHead>
                  <TableHead className="text-right">
                    {t('manage.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {t('common:actions.loading')}
                    </TableCell>
                  </TableRow>
                )}
                {existing.map(c => {
                  // Dropdown columns keep their name: Fineract ties it to the code
                  const editable = !c.system && !c.dropped
                  return (
                    <TableRow
                      key={c.name}
                      className={c.dropped ? 'opacity-50 line-through' : ''}
                    >
                      <TableCell>
                        {editable && c.displayType !== 'Dropdown' ? (
                          <Input
                            aria-label={t('manage.aria.name', { name: c.name })}
                            value={c.newName}
                            onChange={e =>
                              updateExisting(c.name, {
                                newName: e.target.value,
                              })
                            }
                            className="h-8 min-w-36"
                          />
                        ) : (
                          c.name
                        )}
                      </TableCell>
                      <TableCell>{typeName(c.displayType)}</TableCell>
                      <TableCell>
                        {editable && c.displayType === 'String' ? (
                          <Input
                            aria-label={t('manage.aria.length', {
                              name: c.name,
                            })}
                            type="number"
                            min={1}
                            value={c.newLength}
                            onChange={e =>
                              updateExisting(c.name, {
                                newLength: e.target.value,
                              })
                            }
                            className="h-8 w-20"
                          />
                        ) : c.displayType === 'String' ? (
                          c.length
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{c.code ?? '-'}</TableCell>
                      <TableCell>
                        {editable ? (
                          <Checkbox
                            aria-label={t('manage.aria.mandatory', {
                              name: c.name,
                            })}
                            checked={c.newMandatory}
                            onCheckedChange={v =>
                              updateExisting(c.name, { newMandatory: !!v })
                            }
                          />
                        ) : (
                          yesNo(c.mandatory)
                        )}
                      </TableCell>
                      <TableCell>{yesNo(c.unique)}</TableCell>
                      <TableCell>{yesNo(c.indexed)}</TableCell>
                      <TableCell className="text-right">
                        {c.system ? (
                          <span className="text-muted-foreground text-sm">
                            {t('manage.system')}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateExisting(c.name, { dropped: !c.dropped })
                            }
                          >
                            {c.dropped ? t('manage.undo') : t('manage.drop')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {added.map(c => (
                  <TableRow key={`new-${c.name}`}>
                    <TableCell>
                      {c.name}{' '}
                      <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {t('manage.new')}
                      </span>
                    </TableCell>
                    <TableCell>{typeName(c.type)}</TableCell>
                    <TableCell>{c.length ?? '-'}</TableCell>
                    <TableCell>{c.code ?? '-'}</TableCell>
                    <TableCell>{yesNo(c.mandatory)}</TableCell>
                    <TableCell>{yesNo(c.unique)}</TableCell>
                    <TableCell>{yesNo(c.indexed)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAdded(prev => prev.filter(a => a.name !== c.name))
                        }
                      >
                        {t('manage.remove')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {message && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(`/system/data-tables/${encodeURIComponent(id)}`)
            }
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={!hasChanges || loading || submitting}
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditDataTable
