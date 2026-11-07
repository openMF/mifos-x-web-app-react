/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ParseKeys } from 'i18next'

import {
  ResultsetColumnHeaderDataColumnDisplayTypeEnum as DisplayType,
  type ResultsetColumnHeaderData,
} from '@/fineract-api'
import {
  codeValuesOf,
  isSystemColumn,
  type RegisteredDatatable,
} from '@/lib/datatables-api'
import {
  isJsonColumn,
  summarizeJson,
  unwrapJsonCell,
} from '@/lib/datatable-json'

import { parseFineractDate } from './dates'
import type { LoanCurrency, LoanRow } from './loan-row'

export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select'

/** One datatable row, keyed by column name, as the query endpoint returns it */
export type DatatableRow = Record<string, unknown>

/** What a cell shows, and the value it is sorted and filtered by */
export interface Cell {
  text: string
  /**
   * A number for amounts, counts, dates (milliseconds) and yes/no (1 or 0),
   * lowercased text otherwise, and null when the cell is empty.
   */
  value: number | string | null
}

/** Formatting that depends on the page: the language, offices and datatables */
export interface CellFormat {
  money: (value: number | undefined, currency?: LoanCurrency) => string
  number: (value: number) => string
  date: (value: Date, withTime?: boolean) => string
  yesNo: (value: boolean) => string
  officeName: (officeId?: number) => string
  datatableRow: (table: string, loanId: number) => DatatableRow | undefined
}

export interface ColumnDef {
  id: string
  label: string
  filterType: FilterType
  /** Whether "Add Filter" offers the column */
  filterable: boolean
  /** The datatable a datatable column is loaded from */
  table?: string
  /** Numbers and account numbers are set in a monospace font */
  mono?: boolean
  /** The values a select filter offers */
  options?: string[]
  cell: (loan: LoanRow, format: CellFormat) => Cell
}

/** The borrower column is always shown first, so it is not in the picker */
export const BORROWER_COLUMN_ID = 'borrower'

/** The columns a first visit shows, in order */
export const DEFAULT_COLUMN_IDS = [
  'status',
  'accountNo',
  'principal',
  'product',
]

const STORAGE_KEY = 'mifosXLoansListColumns'

const EMPTY: Cell = { text: '', value: null }

const textCell = (text?: string | null): Cell => {
  const trimmed = (text ?? '').trim()
  return trimmed ? { text: trimmed, value: trimmed.toLowerCase() } : EMPTY
}

const numberCell = (value: unknown, text: (n: number) => string): Cell => {
  if (value === null || value === undefined || value === '') return EMPTY
  const n = Number(value)
  return Number.isNaN(n) ? textCell(String(value)) : { text: text(n), value: n }
}

const dateCell = (value: unknown, format: CellFormat, withTime = false) => {
  const date = parseFineractDate(value)
  if (!date) return value ? textCell(String(value)) : EMPTY
  return { text: format.date(date, withTime), value: date.getTime() }
}

const yesNoCell = (value: boolean, format: CellFormat): Cell => ({
  text: format.yesNo(value),
  value: value ? 1 : 0,
})

interface LoanFieldSpec {
  id: string
  labelKey: ParseKeys<'loans'>
  filterType: FilterType
  filterable?: boolean
  mono?: boolean
  cell: (loan: LoanRow, format: CellFormat) => Cell
}

/**
 * The four built-in columns, then the optional loan fields. Every value is
 * read from the loans list response the page already loads.
 */
const LOAN_FIELD_SPECS: LoanFieldSpec[] = [
  {
    id: 'status',
    labelKey: 'list.status',
    filterType: 'select',
    cell: loan => textCell(loan.statusValue),
  },
  {
    id: 'accountNo',
    labelKey: 'list.loanAccount',
    filterType: 'text',
    mono: true,
    cell: loan => textCell(loan.accountNo),
  },
  {
    id: 'principal',
    labelKey: 'list.principal',
    filterType: 'number',
    mono: true,
    cell: (loan, f) =>
      numberCell(loan.principal, n => f.money(n, loan.currency)),
  },
  {
    // the Loan Product default filter covers this one
    id: 'product',
    labelKey: 'list.loanProduct',
    filterType: 'text',
    filterable: false,
    cell: loan => textCell(loan.productName),
  },
  {
    id: 'std:externalId',
    labelKey: 'list.fields.externalId',
    filterType: 'text',
    mono: true,
    cell: ({ source }) =>
      textCell(
        typeof source.externalId === 'object'
          ? source.externalId?.value
          : source.externalId
      ),
  },
  {
    // the Office default filter covers this one
    id: 'std:office',
    labelKey: 'list.office',
    filterType: 'text',
    filterable: false,
    cell: (loan, f) => textCell(f.officeName(loan.officeId)),
  },
  {
    id: 'std:loanOfficer',
    labelKey: 'list.fields.loanOfficer',
    filterType: 'text',
    cell: ({ source }) => textCell(source.loanOfficerName),
  },
  {
    id: 'std:interestRate',
    labelKey: 'list.fields.interestRate',
    filterType: 'number',
    mono: true,
    cell: ({ source }, f) =>
      numberCell(
        source.annualInterestRate ?? source.interestRatePerPeriod,
        n => `${f.number(n)}%`
      ),
  },
  {
    id: 'std:numberOfRepayments',
    labelKey: 'list.fields.numberOfRepayments',
    filterType: 'number',
    mono: true,
    cell: ({ source }) => numberCell(source.numberOfRepayments, String),
  },
  {
    id: 'std:submittedDate',
    labelKey: 'list.fields.submittedDate',
    filterType: 'date',
    cell: ({ source }, f) => dateCell(source.timeline?.submittedOnDate, f),
  },
  {
    id: 'std:disbursementDate',
    labelKey: 'list.fields.disbursementDate',
    filterType: 'date',
    cell: ({ source }, f) =>
      dateCell(
        source.timeline?.actualDisbursementDate ??
          source.timeline?.expectedDisbursementDate,
        f
      ),
  },
  {
    id: 'std:maturityDate',
    labelKey: 'list.fields.maturityDate',
    filterType: 'date',
    cell: ({ source }, f) =>
      dateCell(
        source.timeline?.actualMaturityDate ??
          source.timeline?.expectedMaturityDate,
        f
      ),
  },
  {
    id: 'std:closedDate',
    labelKey: 'list.fields.closedDate',
    filterType: 'date',
    cell: ({ source }, f) => dateCell(source.timeline?.closedOnDate, f),
  },
  {
    id: 'std:principalOutstanding',
    labelKey: 'list.fields.principalOutstanding',
    filterType: 'number',
    mono: true,
    cell: (loan, f) =>
      numberCell(loan.source.summary?.principalOutstanding, n =>
        f.money(n, loan.currency)
      ),
  },
  {
    id: 'std:totalOutstanding',
    labelKey: 'list.fields.totalOutstanding',
    filterType: 'number',
    mono: true,
    cell: (loan, f) =>
      numberCell(loan.source.summary?.totalOutstanding, n =>
        f.money(n, loan.currency)
      ),
  },
  {
    id: 'std:totalOverdue',
    labelKey: 'list.fields.totalOverdue',
    filterType: 'number',
    mono: true,
    cell: (loan, f) =>
      numberCell(loan.source.summary?.totalOverdue, n =>
        f.money(n, loan.currency)
      ),
  },
  {
    id: 'std:inArrears',
    labelKey: 'list.fields.inArrears',
    filterType: 'boolean',
    cell: ({ source }, f) => yesNoCell(!!source.inArrears, f),
  },
  {
    id: 'std:currency',
    labelKey: 'list.fields.currency',
    filterType: 'text',
    cell: loan => textCell(loan.currency?.code),
  },
]

/** The built-in and optional loan columns, labelled in the current language */
export const loanFieldColumns = (
  label: (key: ParseKeys<'loans'>) => string,
  statusOptions: string[]
): ColumnDef[] =>
  LOAN_FIELD_SPECS.map(({ labelKey, filterable = true, ...spec }) => ({
    ...spec,
    label: label(labelKey),
    filterable,
    options: spec.id === 'status' ? statusOptions : undefined,
  }))

/** One datatable registered against loans, with the columns it can show */
export interface LoanDatatable {
  name: string
  label: string
  columns: ColumnDef[]
  /** The column names to request, which always include the loan id */
  resultColumns: string[]
}

export const datatableColumnId = (table: string, column: string) =>
  `dt:${table}:${column}`

/** "accrued_interest_cd_type" or "accruedInterest" -> "Accrued Interest" */
const humanize = (name: string) =>
  name
    .replace(/_cd_.*$/, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b[a-z]/g, char => char.toUpperCase())

const filterTypeOf = (header: ResultsetColumnHeaderData): FilterType => {
  if (isJsonColumn(header)) return 'text'
  switch (header.columnDisplayType) {
    case DisplayType.Date:
    case DisplayType.Datetime:
      return 'date'
    case DisplayType.Integer:
    case DisplayType.Decimal:
    case DisplayType.Float:
      return 'number'
    case DisplayType.Boolean:
      return 'boolean'
    case DisplayType.Codelookup:
    case DisplayType.Codevalue:
      return codeValuesOf(header).length ? 'select' : 'text'
    default:
      return 'text'
  }
}

const datatableColumn = (
  table: string,
  header: ResultsetColumnHeaderData
): ColumnDef => {
  const name = header.columnName ?? ''
  const filterType = filterTypeOf(header)
  const codeValues = new Map(
    codeValuesOf(header).map(option => [option.id, option.value])
  )
  const displayType = header.columnDisplayType

  const cell = (loan: LoanRow, f: CellFormat): Cell => {
    const value = f.datatableRow(table, loan.id)?.[name]
    if (value === null || value === undefined || value === '') return EMPTY
    if (isJsonColumn(header)) {
      return textCell(summarizeJson(unwrapJsonCell(value)))
    }
    switch (displayType) {
      case DisplayType.Date:
        return dateCell(value, f)
      case DisplayType.Datetime:
        return dateCell(value, f, true)
      case DisplayType.Integer:
      case DisplayType.Decimal:
      case DisplayType.Float:
        return numberCell(value, f.number)
      case DisplayType.Boolean:
        return yesNoCell(
          value === true || value === 'true' || value === 1 || value === '1',
          f
        )
      case DisplayType.Codelookup:
      case DisplayType.Codevalue:
        return textCell(codeValues.get(Number(value)) ?? String(value))
      default:
        return textCell(String(value))
    }
  }

  return {
    id: datatableColumnId(table, name),
    label: humanize(name),
    filterType,
    filterable: true,
    table,
    mono: filterType === 'number',
    options:
      filterType === 'select'
        ? [...codeValues.values()].sort((a, b) => a.localeCompare(b))
        : undefined,
    cell,
  }
}

/** The loan datatables that have at least one column worth showing */
export const toLoanDatatables = (
  registered: RegisteredDatatable[]
): LoanDatatable[] =>
  registered
    .filter(table => table.registeredTableName)
    .map(table => {
      const name = table.registeredTableName as string
      const headers = (table.columnHeaderData ?? []).filter(
        header =>
          header.columnName &&
          !isSystemColumn(header.columnName) &&
          header.columnDisplayType !== DisplayType.Binary
      )
      return {
        name,
        label: humanize(name),
        columns: headers.map(header => datatableColumn(name, header)),
        resultColumns: [
          'loan_id',
          ...headers.map(header => header.columnName as string),
        ],
      }
    })
    .filter(table => table.columns.length > 0)

/** The saved column selection, or the defaults when there is none */
export const loadVisibleColumns = (): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(saved)) {
      return saved.filter(
        (id): id is string =>
          typeof id === 'string' && id !== BORROWER_COLUMN_ID
      )
    }
  } catch {
    // storage may be unavailable or hold something unreadable
  }
  return [...DEFAULT_COLUMN_IDS]
}

export const saveVisibleColumns = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // the selection then lasts only for this visit
  }
}
