/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Data table entry access.
 *
 * This wrapper exists because the generated client cannot express two things
 * the entry screens need: `getDatatable1` has no `genericResultSet` parameter,
 * and it is typed `AxiosPromise<string>` although axios parses the body. The
 * generated sources are rewritten by `npm run build`, so the workarounds live
 * here instead of being patched into them.
 */
import { DataTablesApi } from '@/fineract-api'
import type {
  GetDataTablesResponse,
  ResultsetColumnHeaderData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

/** The shape returned when `genericResultSet=true`. */
export interface GenericResultSet {
  columnHeaders: ResultsetColumnHeaderData[]
  data: Array<{ row: unknown[] }>
}

/** One entry, keyed by column name. Cell values are still in wire form. */
export interface DatatableEntry {
  [columnName: string]: unknown
}

/** A dropdown option as Fineract sends it inside `columnValues`. */
export interface DatatableCodeValue {
  id: number
  value: string
}

/**
 * Built per call rather than once at module load: `getConfiguration()`
 * snapshots the auth headers, so a long-lived instance keeps sending whatever
 * credentials existed when this module was first evaluated.
 */
const api = () => new DataTablesApi(getConfiguration())

/** The data tables registered against an application table, e.g. `m_client`. */
export const fetchDatatablesFor = async (
  apptable: string
): Promise<GetDataTablesResponse[]> => {
  const res = await api().getDatatables(apptable)
  return (res.data as GetDataTablesResponse[]) ?? []
}

/**
 * The entries held for one entity.
 *
 * `genericResultSet` is passed through the request config because the
 * generated method has no parameter for it. Only `params` is set here: the
 * config is spread over the base options, so passing `headers` would drop the
 * tenant and authorization headers the base configuration supplies.
 */
export const fetchDatatableResultSet = async (
  datatable: string,
  apptableId: number,
  order?: string
): Promise<GenericResultSet> => {
  const res = await api().getDatatable1(datatable, apptableId, order, {
    params: { genericResultSet: true },
  })
  const body = res.data as unknown as Partial<GenericResultSet>
  return {
    columnHeaders: body?.columnHeaders ?? [],
    data: body?.data ?? [],
  }
}

/**
 * True for a table that holds many entries per entity.
 *
 * Fineract decides this by the presence of an `id` column
 * (`DatatableUtil.isMultirowDatatable`) and the registration response carries
 * no flag of its own. All headers are scanned rather than just the first,
 * which would break if the column order ever changed.
 */
export const isMultiRowResultSet = (
  headers: ResultsetColumnHeaderData[]
): boolean => headers.some(header => header.columnName === 'id')

/** Zips the headers with each row into objects keyed by column name. */
export const toEntries = (resultSet: GenericResultSet): DatatableEntry[] =>
  resultSet.data.map(({ row }) => {
    const entry: DatatableEntry = {}
    resultSet.columnHeaders.forEach((header, index) => {
      if (header.columnName) entry[header.columnName] = row?.[index]
    })
    return entry
  })

/** Columns Fineract maintains itself, which are shown but never edited. */
export const isSystemColumn = (columnName?: string): boolean => {
  if (!columnName) return false
  return (
    columnName === 'id' ||
    columnName === 'created_at' ||
    columnName === 'updated_at' ||
    columnName.endsWith('_id')
  )
}

/** The columns an entry form offers. */
export const editableColumns = (
  headers: ResultsetColumnHeaderData[]
): ResultsetColumnHeaderData[] =>
  headers.filter(header => !isSystemColumn(header.columnName))

/** `client_json_demo` -> `Client Json Demo`, for a tab or heading. */
export const formatDatatableLabel = (name?: string): string =>
  (name ?? '')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase())

/** A column's dropdown options, or an empty list for other column types. */
export const codeValuesOf = (
  header: ResultsetColumnHeaderData
): DatatableCodeValue[] => (header.columnValues ?? []) as DatatableCodeValue[]

/**
 * The write endpoints are declared as taking a string and the generated client
 * passes strings through untouched, so the body is serialised here — in one
 * place, where it cannot be forgotten.
 */
const body = (payload: Record<string, unknown>) => JSON.stringify(payload)

export const createEntry = async (
  datatable: string,
  apptableId: number,
  payload: Record<string, unknown>
): Promise<void> => {
  await api().createDatatableEntry(datatable, apptableId, body(payload))
}

export const updateSingleRowEntry = async (
  datatable: string,
  apptableId: number,
  payload: Record<string, unknown>
): Promise<void> => {
  await api().updateDatatableEntryOnetoOne(datatable, apptableId, body(payload))
}

export const updateMultiRowEntry = async (
  datatable: string,
  apptableId: number,
  entryId: number,
  payload: Record<string, unknown>
): Promise<void> => {
  await api().updateDatatableEntryOneToMany(
    datatable,
    apptableId,
    entryId,
    body(payload)
  )
}

export const deleteSingleRowEntry = async (
  datatable: string,
  apptableId: number
): Promise<void> => {
  await api().deleteDatatableEntries(datatable, apptableId)
}

export const deleteMultiRowEntry = async (
  datatable: string,
  apptableId: number,
  entryId: number
): Promise<void> => {
  await api().deleteDatatableEntry(datatable, apptableId, entryId)
}

/** The message Fineract returned, when it sent one worth showing. */
export const datatableErrorMessage = (error: unknown): string | null => {
  const data = (
    error as {
      response?: {
        data?: {
          defaultUserMessage?: string
          developerMessage?: string
          errors?: Array<{ defaultUserMessage?: string }>
        }
      }
    }
  )?.response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ??
    data?.defaultUserMessage ??
    data?.developerMessage ??
    null
  )
}
