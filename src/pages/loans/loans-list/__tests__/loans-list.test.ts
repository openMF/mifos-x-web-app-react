/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'

import type { Cell } from '../columns'
import { parseFineractDate } from '../dates'
import { matchesFilter, newFilter } from '../filters'
import { buildCsv, exportFileName, sanitizeCsvValue } from '../export-csv'

const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime()

describe('parseFineractDate', () => {
  it('reads a date array without shifting the day', () => {
    expect(parseFineractDate([2026, 9, 25])?.getTime()).toBe(at(2026, 9, 25))
  })

  it('reads ISO dates and datetimes', () => {
    expect(parseFineractDate('2026-09-25')?.getTime()).toBe(at(2026, 9, 25))
    expect(parseFineractDate('2026-09-25 14:30:00')?.getTime()).toBe(
      at(2026, 9, 25, 14, 30)
    )
  })

  it('returns null for anything else', () => {
    expect(parseFineractDate(undefined)).toBeNull()
    expect(parseFineractDate('not a date')).toBeNull()
    expect(parseFineractDate([2026])).toBeNull()
  })
})

describe('matchesFilter', () => {
  const empty: Cell = { text: '', value: null }

  it('matches every cell until a value is entered', () => {
    for (const type of [
      'text',
      'number',
      'date',
      'boolean',
      'select',
    ] as const) {
      expect(matchesFilter(empty, newFilter(1, 'x', type))).toBe(true)
    }
  })

  it('matches text case-insensitively', () => {
    const filter = { ...newFilter(1, 'x', 'text'), text: 'smith' }
    expect(
      matchesFilter({ text: 'Jane Smith', value: 'jane smith' }, filter)
    ).toBe(true)
    expect(matchesFilter({ text: 'Ada', value: 'ada' }, filter)).toBe(false)
  })

  it('keeps numbers within inclusive bounds and drops empty cells', () => {
    const filter = { ...newFilter(1, 'x', 'number'), min: '100', max: '500' }
    expect(matchesFilter({ text: '100', value: 100 }, filter)).toBe(true)
    expect(matchesFilter({ text: '500', value: 500 }, filter)).toBe(true)
    expect(matchesFilter({ text: '501', value: 501 }, filter)).toBe(false)
    expect(matchesFilter(empty, filter)).toBe(false)
  })

  it('counts the whole "to" day in a date range', () => {
    const filter = {
      ...newFilter(1, 'x', 'date'),
      from: '2026-09-01',
      to: '2026-09-30',
    }
    const cell = (time: number): Cell => ({ text: '', value: time })
    expect(matchesFilter(cell(at(2026, 9, 1)), filter)).toBe(true)
    expect(matchesFilter(cell(at(2026, 9, 30, 23, 59)), filter)).toBe(true)
    expect(matchesFilter(cell(at(2026, 10, 1)), filter)).toBe(false)
    expect(matchesFilter(cell(at(2026, 8, 31)), filter)).toBe(false)
  })

  it('matches yes/no and selected values', () => {
    const yes = { ...newFilter(1, 'x', 'boolean'), bool: 'yes' as const }
    expect(matchesFilter({ text: 'Yes', value: 1 }, yes)).toBe(true)
    expect(matchesFilter({ text: 'No', value: 0 }, yes)).toBe(false)

    const select = { ...newFilter(1, 'x', 'select'), values: ['Active'] }
    expect(matchesFilter({ text: 'Active', value: 'active' }, select)).toBe(
      true
    )
    expect(matchesFilter({ text: 'Closed', value: 'closed' }, select)).toBe(
      false
    )
  })
})

describe('CSV export', () => {
  it('keeps values that would start a formula as text', () => {
    expect(sanitizeCsvValue('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)")
    expect(sanitizeCsvValue('@cmd')).toBe("'@cmd")
    expect(sanitizeCsvValue('Ada Lovelace')).toBe('Ada Lovelace')
  })

  it('leaves plain signed numbers as numbers', () => {
    expect(sanitizeCsvValue('-500')).toBe('-500')
    expect(sanitizeCsvValue('-1,234.50')).toBe('-1,234.50')
    expect(sanitizeCsvValue('-1.234,50')).toBe('-1.234,50')
    expect(sanitizeCsvValue('+42')).toBe('+42')
    expect(sanitizeCsvValue('-1+1')).toBe("'-1+1")
    expect(sanitizeCsvValue('-2*3')).toBe("'-2*3")
    expect(sanitizeCsvValue('-A1')).toBe("'-A1")
  })

  it('quotes fields with commas, quotes and line breaks', () => {
    expect(
      buildCsv(
        ['Name', 'Note'],
        [
          ['Lovelace, Ada', 'said "hi"'],
          ['Line', 'one\ntwo'],
        ]
      )
    ).toBe('Name,Note\r\n"Lovelace, Ada","said ""hi"""\r\nLine,"one\ntwo"')
  })

  it('names the file after the local date and time', () => {
    expect(exportFileName(new Date(2026, 9, 14, 9, 5))).toBe(
      'Loans_2026-10-14_0905.csv'
    )
  })
})
