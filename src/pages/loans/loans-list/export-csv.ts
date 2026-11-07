/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * A spreadsheet runs a cell that starts with one of these characters as a
 * formula, so such a value is prefixed with a quote to keep it as text.
 */
const FORMULA_START = /^[=+\-@|%\t\r]/

/**
 * A signed number such as "-500" or "-1,234.50", with the grouping and
 * decimal separators a locale may use. It cannot run as a formula, so it is
 * left as it is and stays a number in the spreadsheet.
 */
const PLAIN_NUMBER = /^[+-]?\d[\d.,\u00a0\u202f ]*$/

export const sanitizeCsvValue = (value: string): string =>
  FORMULA_START.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value

/** Quotes a field when it holds a comma, a quote or a line break */
const field = (value: string) => {
  const safe = sanitizeCsvValue(value)
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export const buildCsv = (header: string[], rows: string[][]): string =>
  [header, ...rows].map(row => row.map(field).join(',')).join('\r\n')

/** "Loans_2026-10-14_1530.csv", in local time */
export const exportFileName = (now = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `Loans_${date}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`
}

export const downloadCsv = (fileName: string, csv: string) => {
  // the byte order mark makes Excel read the file as UTF-8, so names and
  // currency symbols are not garbled
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
