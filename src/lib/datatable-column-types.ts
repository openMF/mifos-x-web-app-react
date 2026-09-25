/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * The column types a data table can be given.
 *
 * `value` goes to `POST /datatables` as the column's `type`. Fineract lowercases
 * it before matching against its own list, so the capitalised form here is the
 * one the Angular web app has always sent.
 *
 * A JSON column must be sent without `length` and without `code`: the request
 * deserialiser rejects a `code` on anything that is not a dropdown, and a
 * length on a type that has none.
 */
export interface DatatableColumnTypeOption {
  value: string
  /** Key in the `datatables` namespace. */
  labelKey: string
  /** True for the types that also take a `length`. */
  hasLength?: boolean
  /** True for the types that also take a code, i.e. dropdowns. */
  hasCode?: boolean
}

export const DATATABLE_COLUMN_TYPES: DatatableColumnTypeOption[] = [
  { value: 'Boolean', labelKey: 'columnTypes.boolean' },
  { value: 'Date', labelKey: 'columnTypes.date' },
  { value: 'Datetime', labelKey: 'columnTypes.datetime' },
  { value: 'Decimal', labelKey: 'columnTypes.decimal' },
  { value: 'Dropdown', labelKey: 'columnTypes.dropdown', hasCode: true },
  { value: 'Json', labelKey: 'columnTypes.json' },
  { value: 'Number', labelKey: 'columnTypes.number' },
  { value: 'String', labelKey: 'columnTypes.string', hasLength: true },
  { value: 'Text', labelKey: 'columnTypes.text' },
]
