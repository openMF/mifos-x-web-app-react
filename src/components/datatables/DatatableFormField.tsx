/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useId } from 'react'

import {
  ResultsetColumnHeaderDataColumnDisplayTypeEnum as DisplayType,
  type ResultsetColumnHeaderData,
} from '@/fineract-api'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import JsonFieldEditor from '@/components/custom/json/JsonFieldEditor'
import { isJsonColumn } from '@/lib/datatable-json'
import { codeValuesOf, formatDatatableLabel } from '@/lib/datatables-api'

export interface DatatableFormFieldProps {
  header: ResultsetColumnHeaderData
  /** Every control is edited as text; conversion happens at submit time. */
  value: string
  onChange: (value: string) => void
  /** Reported by the JSON editor so the dialog can block submission. */
  onValidityChange?: (valid: boolean) => void
  disabled?: boolean
}

/**
 * The input for one data table column.
 *
 * JSON columns are matched first: they arrive as `TEXT` display type and would
 * otherwise get a plain textarea with no validation behind it.
 */
const DatatableFormField = ({
  header,
  value,
  onChange,
  onValidityChange,
  disabled = false,
}: DatatableFormFieldProps) => {
  const fieldId = useId()
  const label = formatDatatableLabel(header.columnName)
  const required = header.isColumnNullable === false

  if (isJsonColumn(header)) {
    return (
      <JsonFieldEditor
        id={fieldId}
        label={label}
        value={value}
        onChange={onChange}
        onValidityChange={onValidityChange}
        required={required}
        disabled={disabled}
      />
    )
  }

  const labelNode = (
    <Label htmlFor={fieldId}>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </Label>
  )

  switch (header.columnDisplayType) {
    case DisplayType.Boolean:
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={fieldId}
            checked={value === 'true'}
            disabled={disabled}
            onCheckedChange={checked => onChange(checked ? 'true' : 'false')}
          />
          <Label htmlFor={fieldId}>{label}</Label>
        </div>
      )

    case DisplayType.Codelookup:
    case DisplayType.Codevalue:
      return (
        <div className="flex flex-col gap-2">
          {labelNode}
          <Select
            value={value}
            disabled={disabled}
            onValueChange={onChange}
            required={required}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {codeValuesOf(header).map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case DisplayType.Text:
      return (
        <div className="flex flex-col gap-2">
          {labelNode}
          <Textarea
            id={fieldId}
            value={value}
            rows={4}
            required={required}
            disabled={disabled}
            onChange={event => onChange(event.target.value)}
          />
        </div>
      )

    default: {
      const inputType =
        header.columnDisplayType === DisplayType.Date
          ? 'date'
          : header.columnDisplayType === DisplayType.Datetime
            ? 'datetime-local'
            : header.columnDisplayType === DisplayType.Integer ||
                header.columnDisplayType === DisplayType.Decimal ||
                header.columnDisplayType === DisplayType.Float
              ? 'number'
              : 'text'

      return (
        <div className="flex flex-col gap-2">
          {labelNode}
          <Input
            id={fieldId}
            type={inputType}
            value={value}
            required={required}
            disabled={disabled}
            maxLength={
              inputType === 'text' && header.columnLength
                ? Number(header.columnLength)
                : undefined
            }
            step={
              header.columnDisplayType === DisplayType.Integer
                ? 1
                : inputType === 'number'
                  ? 'any'
                  : undefined
            }
            onChange={event => onChange(event.target.value)}
          />
        </div>
      )
    }
  }
}

export default DatatableFormField
