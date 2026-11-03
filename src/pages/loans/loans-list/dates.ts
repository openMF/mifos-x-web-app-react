/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * A date from Fineract: a [y, m, d] or [y, m, d, h, min, s] array, or a
 * "yyyy-MM-dd" or "yyyy-MM-dd HH:mm:ss" string. The parts are read
 * directly so a date is never shifted by the time zone, which
 * `new Date("2026-09-25")` would do since it parses as UTC.
 */
export const parseFineractDate = (value: unknown): Date | null => {
  let parts: number[] | undefined
  if (Array.isArray(value)) parts = value.map(Number)
  else if (typeof value === 'string') {
    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
    )
    if (match) parts = match.slice(1).map(part => Number(part ?? 0))
  }
  if (!parts || parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
    return null
  }
  const [y, m, d, h = 0, min = 0, s = 0] = parts
  const date = new Date(y, m - 1, d, h || 0, min || 0, s || 0)
  return Number.isNaN(date.getTime()) ? null : date
}
