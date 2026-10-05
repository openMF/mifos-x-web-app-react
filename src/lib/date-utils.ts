/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Formats a date value using the given locale.
 *
 * Accepts:
 *  - A date array [year, month, day] as returned by the Fineract API
 *  - An ISO string "YYYY-MM-DD"
 *  - A Date object
 *  - undefined / null
 *
 * @param date     The raw date value (array, string, Date, or nullish)
 * @param locale   BCP-47 locale string (e.g. 'en-US', 'es-ES') — use i18n.language
 * @param fallback Value to return when date is missing/invalid (default: '—')
 */
export function formatDate(
  date: number[] | string | Date | undefined | null,
  locale = 'en',
  fallback = '—'
): string {
  if (!date) return fallback

  let d: Date

  if (Array.isArray(date)) {
    if (date.length < 3) return fallback
    d = new Date(date[0], (date[1] ?? 1) - 1, date[2] ?? 1)
  } else if (typeof date === 'string') {
    if (!date.trim()) return fallback
    d = new Date(date)
  } else {
    d = date
  }

  if (isNaN(d.getTime())) return fallback

  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return fallback
  }
}

/**
 * Converts a date array [year, month, day] to an HTML date input value "YYYY-MM-DD".
 */
export function dateArrayToInputValue(arr?: number[] | null): string {
  if (!arr || arr.length < 3) return ''
  const [y, m, d] = arr
  return `${y}-${String(m ?? 1).padStart(2, '0')}-${String(d ?? 1).padStart(2, '0')}`
}

/**
 * Converts a datetime array [year, month, day, hour, minute, second] to an
 * HTML datetime-local input value "YYYY-MM-DDTHH:mm:ss".
 */
export function dateArrayToDatetimeInputValue(arr?: number[] | null): string {
  const date = dateArrayToInputValue(arr)
  if (!date) return ''
  const [, , , hour = 0, minute = 0, second = 0] = arr ?? []
  return `${date}T${[hour, minute, second].map(part => String(part).padStart(2, '0')).join(':')}`
}

/**
 * Normalizes a datetime string to "YYYY-MM-DDTHH:mm:ss".
 *
 * `datetime-local` drops the seconds when they are zero and may add
 * fractions, and Fineract may send a space instead of the `T`; a single
 * fixed shape lets the value be parsed against one declared format.
 */
export function toDatetimeSecondsValue(value?: string | null): string {
  if (!value) return ''
  const [date, time = ''] = value.trim().replace(' ', 'T').split('T')
  const [hour = '00', minute = '00', second = '00'] = time.split(':')
  return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.slice(0, 2).padStart(2, '0')}`
}

/**
 * Converts an HTML date input value "YYYY-MM-DD" to a Fineract-formatted date string
 * "dd MMMM yyyy" using the Intl API (locale-independent English month names for the API).
 */
export function inputToFineractDate(iso?: string): string | undefined {
  if (!iso) return undefined
  const [yStr, mStr, dStr] = iso.split('-')
  const y = parseInt(yStr, 10)
  const m = parseInt(mStr, 10)
  const d = parseInt(dStr, 10)
  if (!y || !m || !d) return undefined
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(y, m - 1, d)
  )
  return `${String(d).padStart(2, '0')} ${monthName} ${y}`
}
