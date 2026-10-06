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
import {
  dateArrayToDatetimeInputValue,
  dateArrayToInputValue,
  inputToFineractDate,
  toDatetimeSecondsValue,
} from '@/lib/date-utils'
import {
  isJsonColumn,
  parseJson,
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
/**
 * Datetimes are parsed against `dateTimeFormat`, not `dateFormat`. Seconds are
 * included so saving an entry does not truncate a stored timestamp.
 */
const FINERACT_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss"
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

  const isDatetime = header.columnDisplayType === DisplayType.Datetime

  // Fineract sends a date as [y, m, d] and a datetime as [y, m, d, h, min, s].
  // The time has to survive the round trip: `datetime-local` rejects a
  // date-only value outright, and an untouched edit would then post the day
  // without the hour it was stored with.
  if (Array.isArray(cell)) {
    return isDatetime
      ? dateArrayToDatetimeInputValue(cell as number[])
      : dateArrayToInputValue(cell as number[])
  }

  if (typeof cell === 'string') {
    // `date` takes YYYY-MM-DD and `datetime-local` takes YYYY-MM-DDTHH:mm:ss;
    // anything longer is discarded by the control.
    if (header.columnDisplayType === DisplayType.Date) return cell.slice(0, 10)
    if (isDatetime) return toDatetimeSecondsValue(cell)
  }

  return String(cell)
}

/**
 * The JSON columns whose current text cannot be sent.
 *
 * Derived from the values themselves rather than read from the editors'
 * reported validity, so the check cannot lag behind the last keystroke.
 */
const invalidJsonColumns = (
  headers: ResultsetColumnHeaderData[],
  values: Record<string, string>
): string[] =>
  editableColumns(headers)
    .filter(header => isJsonColumn(header) && header.columnName)
    .filter(header => {
      const parsed = parseJson(values[header.columnName as string] ?? '')
      if (parsed.error) return true
      return parsed.empty && header.isColumnNullable === false
    })
    .map(header => header.columnName as string)

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
    let hasDatetime = false

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
          // A stored null loads as '' and stays that way until the checkbox is
          // touched, so an edit elsewhere does not turn it into false.
          payload[name] =
            raw === '' && header.isColumnNullable !== false
              ? null
              : raw === 'true'
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
          // Normalized to seconds: the control omits them when they are zero,
          // which would not match the format declared below.
          payload[name] = raw === '' ? null : toDatetimeSecondsValue(raw)
          hasDatetime = true
          break
        default:
          payload[name] = raw === '' ? null : raw
      }
    }

    payload.locale = FINERACT_LOCALE
    if (hasDate) payload.dateFormat = FINERACT_DATE_FORMAT
    if (hasDatetime) payload.dateTimeFormat = FINERACT_DATETIME_FORMAT
    return payload
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    // Re-checked here instead of trusting `invalidColumns`, which an effect in
    // the editor fills in: `toJsonPayloadValue` passes text it cannot parse
    // through untouched, so a stale mirror would be enough to post a malformed
    // document and get back the database's own error.
    const invalid = invalidJsonColumns(columnHeaders, values)
    if (invalid.length > 0) {
      setInvalidColumns(new Set(invalid))
      return
    }

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
