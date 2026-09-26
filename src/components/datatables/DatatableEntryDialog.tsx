/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResultsetColumnHeaderDataColumnDisplayTypeEnum as DisplayType,
  type ResultsetColumnHeaderData,
} from '@/fineract-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { dateArrayToInputValue, inputToFineractDate } from '@/lib/date-utils'
import {
  isJsonColumn,
  toJsonPayloadValue,
  unwrapJsonCell,
} from '@/lib/datatable-json'
import {
  datatableErrorMessage,
  editableColumns,
  type DatatableEntry,
} from '@/lib/datatables-api'
import DatatableFormField from './DatatableFormField'

/** Fineract parses dates it is given against the format sent alongside them. */
const FINERACT_DATE_FORMAT = 'dd MMMM yyyy'
const FINERACT_LOCALE = 'en'

export interface DatatableEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  columnHeaders: ResultsetColumnHeaderData[]
  /** The entry being edited, or undefined when adding. */
  entry?: DatatableEntry
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
}

/** Turns a stored cell into the text its control edits. */
const toFieldValue = (
  header: ResultsetColumnHeaderData,
  cell: unknown
): string => {
  if (isJsonColumn(header)) return unwrapJsonCell(cell) ?? ''
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'boolean') return cell ? 'true' : 'false'
  if (Array.isArray(cell)) return dateArrayToInputValue(cell as number[])
  if (
    typeof cell === 'string' &&
    header.columnDisplayType === DisplayType.Date
  ) {
    return cell.slice(0, 10)
  }
  return String(cell)
}

const buildInitialValues = (
  headers: ResultsetColumnHeaderData[],
  entry?: DatatableEntry
): Record<string, string> => {
  const values: Record<string, string> = {}
  for (const header of editableColumns(headers)) {
    const name = header.columnName
    if (!name) continue
    values[name] =
      header.columnDisplayType === DisplayType.Boolean && !entry
        ? 'false'
        : toFieldValue(header, entry?.[name])
  }
  return values
}

/**
 * Add or edit one data table entry.
 *
 * Values are held as text while the form is open and converted once on submit,
 * which keeps every control uniform and puts the API's expectations — numbers
 * as numbers, JSON documents as strings, dates in Fineract's own format — in a
 * single place.
 */
const DatatableEntryDialog = ({
  open,
  onOpenChange,
  title,
  columnHeaders,
  entry,
  onSubmit,
}: DatatableEntryDialogProps) => {
  const { t } = useTranslation('datatables')

  const [values, setValues] = useState<Record<string, string>>({})
  /** Columns whose JSON does not parse; submission waits for them. */
  const [invalidColumns, setInvalidColumns] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset whenever the dialog opens, so a cancelled edit leaves nothing behind
  // for the next entry to inherit.
  useEffect(() => {
    if (!open) return
    setValues(buildInitialValues(columnHeaders, entry))
    setInvalidColumns(new Set())
    setError(null)
  }, [open, columnHeaders, entry])

  const setValidity = useCallback((columnName: string, valid: boolean) => {
    setInvalidColumns(current => {
      const next = new Set(current)
      if (valid) {
        if (!next.delete(columnName)) return current
      } else {
        if (next.has(columnName)) return current
        next.add(columnName)
      }
      return next
    })
  }, [])

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {}
    let hasDate = false

    for (const header of editableColumns(columnHeaders)) {
      const name = header.columnName
      if (!name) continue
      const raw = values[name] ?? ''

      if (isJsonColumn(header)) {
        payload[name] = toJsonPayloadValue(raw)
        continue
      }

      switch (header.columnDisplayType) {
        case DisplayType.Boolean:
          payload[name] = raw === 'true'
          break
        case DisplayType.Integer:
        case DisplayType.Decimal:
        case DisplayType.Float:
        case DisplayType.Codelookup:
        case DisplayType.Codevalue:
          payload[name] = raw === '' ? null : Number(raw)
          break
        case DisplayType.Date:
          payload[name] = inputToFineractDate(raw) ?? null
          hasDate = true
          break
        case DisplayType.Datetime:
          // `datetime-local` gives "YYYY-MM-DDTHH:mm", which Fineract accepts
          // as an ISO datetime; only plain dates need its own format.
          payload[name] = raw === '' ? null : raw
          break
        default:
          payload[name] = raw === '' ? null : raw
      }
    }

    payload.locale = FINERACT_LOCALE
    if (hasDate) payload.dateFormat = FINERACT_DATE_FORMAT
    return payload
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (invalidColumns.size > 0 || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(buildPayload())
      onOpenChange(false)
    } catch (submitError) {
      console.error('Failed to save data table entry', submitError)
      setError(datatableErrorMessage(submitError) ?? t('entry.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {editableColumns(columnHeaders).map(header => {
            const name = header.columnName as string
            return (
              <DatatableFormField
                key={name}
                header={header}
                value={values[name] ?? ''}
                disabled={submitting}
                onChange={value =>
                  setValues(current => ({ ...current, [name]: value }))
                }
                onValidityChange={valid => setValidity(name, valid)}
              />
            )
          })}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('entry.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting || invalidColumns.size > 0}
            >
              {submitting ? t('entry.saving') : t('entry.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DatatableEntryDialog
