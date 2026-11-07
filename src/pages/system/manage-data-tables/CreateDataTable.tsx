/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablesApi, type PostColumnHeaderData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import AddColumnForm from './AddColumnForm'
import {
  type DataTablesApiErrorResponse,
  useDataTableOptions,
} from './dataTableOptions'
import { useCodeOptions } from './useCodeOptions'

const dataTablesApi = new DataTablesApi(getConfiguration())

/** Creates a data table (POST /datatables), the Create Data Table page of the Angular web app */
const CreateDataTable = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['datatables', 'common'])
  const { appTables, entitySubTypes, savingsSubTypes, typeName } =
    useDataTableOptions()
  const [datatableName, setDatatableName] = useState('')
  const [apptableName, setApptableName] = useState('')
  const [entitySubType, setEntitySubType] = useState('')
  const [multiRow, setMultiRow] = useState(false)
  const [columns, setColumns] = useState<PostColumnHeaderData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { codes, error: codesError } = useCodeOptions()

  const subTypeOptions =
    apptableName === 'm_client'
      ? entitySubTypes
      : apptableName === 'm_savings_product'
        ? savingsSubTypes
        : null
  // Fineract rejects a client data table without a sub type
  const subTypeRequired = apptableName === 'm_client'

  const yesNo = (value?: boolean) =>
    value ? t('common:actions.yes') : t('common:actions.no')

  const handleRemoveColumn = (name: string) =>
    setColumns(prev => prev.filter(c => c.name !== name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = datatableName.trim()
    if (!name || !apptableName || columns.length === 0) {
      setError(t('manage.errors.missingFields'))
      return
    }
    if (subTypeRequired && !entitySubType) {
      setError(t('manage.errors.subTypeRequired'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await dataTablesApi.createDatatable({
        datatableName: name,
        apptableName,
        multiRow,
        columns,
        ...(subTypeOptions && entitySubType ? { entitySubType } : {}),
      })
      const created = res.data?.resourceIdentifier ?? name
      navigate(`/system/data-tables/${encodeURIComponent(created)}`)
    } catch (err) {
      const data = (err as AxiosError<DataTablesApiErrorResponse>).response
        ?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('manage.errors.createFailed')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manage.title'), href: '/system/data-tables' },
          { label: t('manage.createTitle'), current: true },
        ]}
      />

      <form
        className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow space-y-8"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold">{t('manage.createTitle')}</h2>

        <div className="flex flex-wrap gap-6">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="datatableName">
              {t('manage.dataTableNameRequired')}
            </Label>
            <Input
              id="datatableName"
              value={datatableName}
              onChange={e => {
                setDatatableName(e.target.value)
                setError(null)
              }}
              required
            />
          </div>
          <AppSelect
            selectLabel={t('manage.applicationTableNameRequired')}
            selectPlaceholder={t('manage.selectApplicationTable')}
            selectValue={apptableName}
            selectOnChange={value => {
              setApptableName(value)
              setEntitySubType('')
              setError(null)
            }}
            selectOptions={appTables}
          />
          {subTypeOptions && (
            <AppSelect
              selectLabel={
                subTypeRequired
                  ? t('manage.entitySubTypeRequired')
                  : t('manage.savingsSubType')
              }
              selectPlaceholder={t('manage.selectSubType')}
              selectValue={entitySubType}
              selectOnChange={setEntitySubType}
              selectOptions={subTypeOptions}
            />
          )}
          <label className="flex w-full items-center gap-2">
            <Checkbox
              checked={multiRow}
              onCheckedChange={c => setMultiRow(!!c)}
            />
            <span>{t('manage.multiRow')}</span>
          </label>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t('manage.columns')}</h3>

          <AddColumnForm
            existingNames={columns.map(c => c.name)}
            codes={codes}
            onAdd={c => setColumns(prev => [...prev, c])}
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
                {columns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      {t('manage.noColumns')}
                    </TableCell>
                  </TableRow>
                ) : (
                  columns.map(c => (
                    <TableRow key={c.name}>
                      <TableCell>{c.name}</TableCell>
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
                          onClick={() => handleRemoveColumn(c.name)}
                        >
                          {t('manage.remove')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {(error || codesError) && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error ?? codesError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/system/data-tables')}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={
              !datatableName.trim() ||
              !apptableName ||
              columns.length === 0 ||
              (subTypeRequired && !entitySubType) ||
              submitting
            }
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateDataTable
