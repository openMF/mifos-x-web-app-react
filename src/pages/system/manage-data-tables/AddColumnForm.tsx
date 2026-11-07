/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PostColumnHeaderData } from '@/fineract-api'

import { useDataTableOptions } from './dataTableOptions'

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

type AddColumnFormProps = {
  /** Column names already in the table, to refuse duplicates */
  existingNames: string[]
  codes: { id: string; name: string }[]
  onAdd: (column: PostColumnHeaderData) => void
}

/** Fields for one new data table column, as in the Angular column dialog */
const AddColumnForm = ({ existingNames, codes, onAdd }: AddColumnFormProps) => {
  const { t } = useTranslation('datatables')
  const { columnTypes } = useDataTableOptions()
  const [column, setColumn] = useState<ColumnForm>(emptyColumn)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof ColumnForm>(
    key: K,
    value: ColumnForm[K]
  ) => {
    setColumn(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleAdd = () => {
    const name = column.name.trim()
    if (!name || !column.type) {
      setError(t('manage.errors.missingColumnFields'))
      return
    }
    if (existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      setError(t('manage.errors.columnExists', { name }))
      return
    }
    const length = Number(column.length)
    if (column.type === 'String' && !(Number.isInteger(length) && length > 0)) {
      setError(t('manage.errors.stringLength'))
      return
    }
    if (column.type === 'Dropdown' && !column.code) {
      setError(t('manage.errors.dropdownCode'))
      return
    }
    onAdd({
      name,
      type: column.type,
      length: column.type === 'String' ? length : undefined,
      code: column.type === 'Dropdown' ? column.code : undefined,
      mandatory: column.mandatory,
      unique: column.unique,
      indexed: column.indexed,
    })
    setColumn(emptyColumn)
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-[23%] space-y-2">
          <Label htmlFor="columnName">{t('manage.columnNameRequired')}</Label>
          <Input
            id="columnName"
            value={column.name}
            onChange={e => setField('name', e.target.value)}
          />
        </div>
        <AppSelect
          selectLabel={t('manage.columnTypeRequired')}
          selectPlaceholder={t('manage.selectType')}
          selectValue={column.type}
          selectOnChange={value => setField('type', value)}
          selectClassname="w-full md:w-[23%] space-y-2"
          selectOptions={columnTypes}
        />
        {column.type === 'String' && (
          <div className="w-full md:w-[23%] space-y-2">
            <Label htmlFor="columnLength">
              {t('manage.columnLengthRequired')}
            </Label>
            <Input
              id="columnLength"
              type="number"
              min={1}
              value={column.length}
              onChange={e => setField('length', e.target.value)}
            />
          </div>
        )}
        {column.type === 'Dropdown' && (
          <AppSelect
            selectLabel={t('manage.columnCodeRequired')}
            selectPlaceholder={t('manage.selectCode')}
            selectValue={column.code}
            selectOnChange={value => setField('code', value)}
            selectClassname="w-full md:w-[23%] space-y-2"
            selectOptions={codes}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={column.mandatory}
            onCheckedChange={c => setField('mandatory', !!c)}
          />
          <span>{t('manage.mandatory')}</span>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={column.unique}
            onCheckedChange={c => setField('unique', !!c)}
          />
          <span>{t('manage.unique')}</span>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={column.indexed}
            onCheckedChange={c => setField('indexed', !!c)}
          />
          <span>{t('manage.indexed')}</span>
        </label>
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          onClick={handleAdd}
        >
          {t('manage.addColumn')}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default AddColumnForm
