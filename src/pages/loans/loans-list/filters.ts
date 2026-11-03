/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Cell, FilterType } from './columns'
import { parseFineractDate } from './dates'

/**
 * One filter added with "Add Filter". Only the fields for its type are used,
 * and a filter whose fields are all empty matches every loan, so adding one
 * hides nothing until a value is entered.
 */
export interface ActiveFilter {
  uid: number
  columnId: string
  type: FilterType
  /** text: the part the value must contain */
  text: string
  /** number: the inclusive bounds, as typed */
  min: string
  max: string
  /** date: the inclusive bounds, as yyyy-MM-dd */
  from: string
  to: string
  /** boolean: '' for either */
  bool: '' | 'yes' | 'no'
  /** select: the values to keep */
  values: string[]
}

export const newFilter = (
  uid: number,
  columnId: string,
  type: FilterType
): ActiveFilter => ({
  uid,
  columnId,
  type,
  text: '',
  min: '',
  max: '',
  from: '',
  to: '',
  bool: '',
  values: [],
})

/** Whether the filter has a value, and so can hide loans */
export const isFilterSet = (filter: ActiveFilter): boolean => {
  switch (filter.type) {
    case 'text':
      return filter.text.trim() !== ''
    case 'number':
      return filter.min.trim() !== '' || filter.max.trim() !== ''
    case 'date':
      return filter.from !== '' || filter.to !== ''
    case 'boolean':
      return filter.bool !== ''
    case 'select':
      return filter.values.length > 0
  }
}

const bound = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isNaN(n) ? null : n
}

export const matchesFilter = (cell: Cell, filter: ActiveFilter): boolean => {
  if (!isFilterSet(filter)) return true

  switch (filter.type) {
    case 'text':
      return cell.text.toLowerCase().includes(filter.text.trim().toLowerCase())

    case 'number': {
      if (typeof cell.value !== 'number') return false
      const min = bound(filter.min)
      const max = bound(filter.max)
      return (
        (min === null || cell.value >= min) &&
        (max === null || cell.value <= max)
      )
    }

    case 'date': {
      if (typeof cell.value !== 'number') return false
      const from = parseFineractDate(filter.from)
      const to = parseFineractDate(filter.to)
      // the "to" day counts in full, so compare with the start of the next day
      const end =
        to &&
        new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1).getTime()
      return (
        (!from || cell.value >= from.getTime()) && (!end || cell.value < end)
      )
    }

    case 'boolean':
      return cell.value === (filter.bool === 'yes' ? 1 : 0)

    case 'select':
      return filter.values.includes(cell.text)
  }
}
