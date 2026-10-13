/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import {
  CodesApi,
  DataTablesApi,
  type PostColumnHeaderData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const dataTablesApi = new DataTablesApi(getConfiguration())
const codesApi = new CodesApi(getConfiguration())

/** Entities a data table can be attached to, as in the Angular web app */
const APP_TABLES = [
  { id: 'm_client', name: 'Client' },
  { id: 'm_group', name: 'Group' },
  { id: 'm_center', name: 'Center' },
  { id: 'm_office', name: 'Office' },
  { id: 'm_loan', name: 'Loan Account' },
  { id: 'm_wc_loan', name: 'Working Capital Loan Account' },
  { id: 'm_savings_account', name: 'Saving Account' },
  { id: 'm_product_loan', name: 'Loan Product' },
  { id: 'm_wc_loan_product', name: 'Working Capital Loan Product' },
  { id: 'm_savings_account_transaction', name: 'Saving Account Transaction' },
  { id: 'm_savings_product', name: 'Savings Product' },
  { id: 'm_share_product', name: 'Share Product' },
]

const ENTITY_SUB_TYPES = [
  { id: 'Person', name: 'Person' },
  { id: 'Entity', name: 'Entity' },
]

const SAVINGS_SUB_TYPES = [
  { id: 'Savings Product', name: 'Savings Product' },
  { id: 'Fixed Deposit', name: 'Fixed Deposit' },
  { id: 'Recurring Deposit', name: 'Recurring Deposit' },
]

const COLUMN_TYPES = [
  { id: 'Boolean', name: 'Boolean' },
  { id: 'Date', name: 'Date' },
  { id: 'Datetime', name: 'Date and Time' },
  { id: 'Decimal', name: 'Decimal' },
  { id: 'Dropdown', name: 'Dropdown' },
  { id: 'json', name: 'JSON' },
  { id: 'Number', name: 'Number' },
  { id: 'String', name: 'String' },
  { id: 'Text', name: 'Text' },
]

type ColumnForm = {
  name: string
  type: string
  length: string
  code: string
  mandatory: boolean
  unique: boolean
  indexed: boolean
}

const emptyColumn: ColumnForm = {
  name: '',
  type: '',
  length: '',
  code: '',
  mandatory: false,
  unique: false,
  indexed: false,
}

type DataTablesApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const typeName = (type: string) =>
  COLUMN_TYPES.find(t => t.id === type)?.name ?? type

/** Creates a data table (POST /datatables), the Create Data Table page of the Angular web app */
const CreateDataTable = () => {
  const navigate = useNavigate()
  const [datatableName, setDatatableName] = useState('')
  const [apptableName, setApptableName] = useState('')
  const [entitySubType, setEntitySubType] = useState('')
  const [multiRow, setMultiRow] = useState(false)
  const [columns, setColumns] = useState<PostColumnHeaderData[]>([])
  const [column, setColumn] = useState<ColumnForm>(emptyColumn)
  const [columnError, setColumnError] = useState<string | null>(null)
  const [codes, setCodes] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    const fetchCodes = async () => {
      try {
        const res = await codesApi.retrieveCodes()
        if (ignore) return
        setCodes(
          (res.data ?? [])
            .filter(code => code.name)
            .map(code => ({ id: code.name!, name: code.name! }))
        )
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch codes', err)
        setError('Failed to load codes for Dropdown columns.')
      }
    }
    fetchCodes()
    return () => {
      ignore = true
    }
  }, [])

  const subTypeOptions =
    apptableName === 'm_client'
      ? ENTITY_SUB_TYPES
      : apptableName === 'm_savings_product'
        ? SAVINGS_SUB_TYPES
        : null
  // Fineract rejects a client data table without a sub type
  const subTypeRequired = apptableName === 'm_client'

  const setColumnField = <K extends keyof ColumnForm>(
    key: K,
    value: ColumnForm[K]
  ) => {
    setColumn(prev => ({ ...prev, [key]: value }))
    setColumnError(null)
  }

  const handleAddColumn = () => {
    const name = column.name.trim()
    if (!name || !column.type) {
      setColumnError('Enter a column name and pick a type.')
      return
    }
    if (columns.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setColumnError(`There is already a column named "${name}".`)
      return
    }
    const length = Number(column.length)
    if (column.type === 'String' && !(Number.isInteger(length) && length > 0)) {
      setColumnError('A String column needs a length of at least 1.')
      return
    }
    if (column.type === 'Dropdown' && !column.code) {
      setColumnError('A Dropdown column needs a code.')
      return
    }
    setColumns(prev => [
      ...prev,
      {
        name,
        type: column.type,
        length: column.type === 'String' ? length : undefined,
        code: column.type === 'Dropdown' ? column.code : undefined,
        mandatory: column.mandatory,
        unique: column.unique,
        indexed: column.indexed,
      },
    ])
    setColumn(emptyColumn)
  }

  const handleRemoveColumn = (name: string) =>
    setColumns(prev => prev.filter(c => c.name !== name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = datatableName.trim()
    if (!name || !apptableName || columns.length === 0) {
      setError('Enter a name, pick an application table and add a column.')
      return
    }
    if (subTypeRequired && !entitySubType) {
      setError('Pick an entity sub type for a client data table.')
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
          'Failed to create data table.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Manage Data Tables', href: '/system/data-tables' },
          { label: 'Create Data Table', current: true },
        ]}
      />

      <form
        className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow space-y-8"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold">Create Data Table</h2>

        <div className="flex flex-wrap gap-6">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="datatableName">Data Table Name*</Label>
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
            selectLabel="Application Table Name*"
            selectPlaceholder="Select application table"
            selectValue={apptableName}
            selectOnChange={value => {
              setApptableName(value)
              setEntitySubType('')
              setError(null)
            }}
            selectOptions={APP_TABLES}
          />
          {subTypeOptions && (
            <AppSelect
              selectLabel={
                subTypeRequired ? 'Entity SubType*' : 'Savings SubType'
              }
              selectPlaceholder="Select sub type"
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
            <span>Multi Row</span>
          </label>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Columns</h3>

          <div className="rounded-md border p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-[23%] space-y-2">
                <Label htmlFor="columnName">Column Name*</Label>
                <Input
                  id="columnName"
                  value={column.name}
                  onChange={e => setColumnField('name', e.target.value)}
                />
              </div>
              <AppSelect
                selectLabel="Column Type*"
                selectPlaceholder="Select type"
                selectValue={column.type}
                selectOnChange={value => setColumnField('type', value)}
                selectClassname="w-full md:w-[23%] space-y-2"
                selectOptions={COLUMN_TYPES}
              />
              {column.type === 'String' && (
                <div className="w-full md:w-[23%] space-y-2">
                  <Label htmlFor="columnLength">Column Length*</Label>
                  <Input
                    id="columnLength"
                    type="number"
                    min={1}
                    value={column.length}
                    onChange={e => setColumnField('length', e.target.value)}
                  />
                </div>
              )}
              {column.type === 'Dropdown' && (
                <AppSelect
                  selectLabel="Column Code*"
                  selectPlaceholder="Select code"
                  selectValue={column.code}
                  selectOnChange={value => setColumnField('code', value)}
                  selectClassname="w-full md:w-[23%] space-y-2"
                  selectOptions={codes}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={column.mandatory}
                  onCheckedChange={c => setColumnField('mandatory', !!c)}
                />
                <span>Mandatory</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={column.unique}
                  onCheckedChange={c => setColumnField('unique', !!c)}
                />
                <span>Unique</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={column.indexed}
                  onCheckedChange={c => setColumnField('indexed', !!c)}
                />
                <span>Indexed</span>
              </label>
              <Button
                type="button"
                variant="outline"
                className="ml-auto"
                onClick={handleAddColumn}
              >
                Add Column
              </Button>
            </div>

            {columnError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {columnError}
              </p>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>Indexed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No columns yet. Add at least one.
                    </TableCell>
                  </TableRow>
                ) : (
                  columns.map(c => (
                    <TableRow key={c.name}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{typeName(c.type)}</TableCell>
                      <TableCell>{c.length ?? '-'}</TableCell>
                      <TableCell>{c.code ?? '-'}</TableCell>
                      <TableCell>{c.mandatory ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{c.unique ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{c.indexed ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveColumn(c.name)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/system/data-tables')}
          >
            Cancel
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
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateDataTable
