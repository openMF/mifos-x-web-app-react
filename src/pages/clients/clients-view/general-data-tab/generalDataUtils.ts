/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ResultsetColumnHeaderData } from '@/fineract-api'

/** One column value of a data table entry, labelled for matching. */
export interface RecordField {
  /** The column name made readable, e.g. `name_of_notary` → `name of notary`. */
  label: string
  value: unknown
}

export type DatatableRecord = RecordField[]

/** The generic result set Fineract returns for `genericResultSet=true`. */
export interface GenericResultSet {
  columnHeaders?: ResultsetColumnHeaderData[]
  data?: { row?: unknown[] }[]
}

type AnyRecord = Record<string, unknown>

export const hasValue = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== ''

/**
 * Lowercased, accent-free and reduced to words, so `Nombre del Notario`,
 * `name_of_notary` and `Name of the Notary` compare on their words alone.
 */
export const normalizeLabel = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** A code value or other option object, reduced to the text it stands for. */
export const readOptionValue = (value: unknown): unknown => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const option = value as AnyRecord
    return (
      option.name || option.value || option.code || option.displayName || ''
    )
  }
  return value
}

/** The first of `fields` that holds a value on `source`. */
export const readObjectValue = (source: unknown, fields: string[]): unknown => {
  if (!source || typeof source !== 'object') return ''
  for (const field of fields) {
    const value = (source as AnyRecord)[field]
    if (hasValue(value)) return readOptionValue(value)
  }
  return ''
}

/**
 * The value of the first field whose label matches one of `patterns`. An
 * exact match wins over a partial one, so `% Shares` is not read from a
 * `No. of Shares` column that merely contains it. Partial matches are tried
 * in pattern order, so a generic pattern listed last, like `name`, cannot
 * pick a `Middle Name` column that comes before `First Names`.
 */
export const readRecordValue = (
  fields: RecordField[],
  patterns: string[]
): unknown => {
  const normalizedPatterns = patterns.map(normalizeLabel)
  const labelled = fields.map(field => ({
    field,
    label: normalizeLabel(field.label),
  }))
  const match =
    labelled.find(({ label }) => normalizedPatterns.includes(label)) ??
    normalizedPatterns
      .map(pattern => labelled.find(({ label }) => label.includes(pattern)))
      .find(Boolean)
  const value = match?.field.value
  return hasValue(value) ? readOptionValue(value) : ''
}

/** `yes`, `no`, or `''` when the answer is missing or unrecognised. */
export const normalizeYesNoValue = (value: unknown): 'yes' | 'no' | '' => {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  const normalized = normalizeLabel(`${value ?? ''}`)
  if (['yes', 'y', 'true', 'si'].includes(normalized)) return 'yes'
  if (['no', 'n', 'false'].includes(normalized)) return 'no'
  return ''
}

/** Columns Fineract adds to every data table, which hold no client data. */
const SYSTEM_COLUMNS = new Set([
  'id',
  'created_at',
  'updated_at',
  'client_id',
  'savings_account_id',
  'savings_transaction_id',
  'loan_id',
  'wc_loan_id',
  'group_id',
  'center_id',
  'office_id',
  'product_loan_id',
  'wc_product_loan_id',
  'savings_product_id',
  'share_product_id',
])

/**
 * A column name made readable for matching. A dropdown column is named
 * `<code>_cd_<label>`, so only the part after `_cd_` describes it.
 */
export const columnLabel = (columnName: string): string => {
  const marker = columnName.indexOf('_cd_')
  const name = marker >= 0 ? columnName.slice(marker + 4) : columnName
  return name
    .split('_')
    .filter(word => word && word.toLowerCase() !== 'cd')
    .join(' ')
}

/** A dropdown column holds the code value's id; show its text instead. */
const resolveCodeValue = (
  header: ResultsetColumnHeaderData,
  value: unknown
): unknown => {
  const options = (header.columnValues ?? []) as {
    id?: number
    value?: string
  }[]
  if (!options.length || !hasValue(value)) return value
  return options.find(option => option.id === Number(value))?.value ?? value
}

/** The entries of a data table result set, without Fineract's own columns. */
export const toRecords = (resultSet: GenericResultSet): DatatableRecord[] => {
  const headers = resultSet.columnHeaders ?? []
  const columns = headers
    .map((header, index) => ({ header, index }))
    .filter(
      ({ header }) =>
        header.columnName && !SYSTEM_COLUMNS.has(header.columnName)
    )
  return (resultSet.data ?? []).map(({ row = [] }) =>
    columns.map(({ header, index }) => ({
      label: columnLabel(header.columnName as string),
      value: resolveCodeValue(header, row[index]),
    }))
  )
}

/**
 * True for a client whose legal form is Entity. The id is 2 in Fineract; the
 * code or text is checked too, as tenants may present it as a string.
 */
export const isLegalEntity = (client: unknown): boolean => {
  const legalForm = (client as { legalForm?: AnyRecord } | undefined)?.legalForm
  if (!legalForm) return false
  if (Number(legalForm.id) === 2) return true
  const text = `${legalForm.code || legalForm.value || legalForm.name || ''}`
  return text.toLowerCase().includes('entity')
}
