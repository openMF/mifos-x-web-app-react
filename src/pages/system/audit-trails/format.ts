/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AuditDateTime } from './types'

/**
 * Formats an audit date and time. GET /audits sends epoch milliseconds and
 * GET /audits/{id} sends epoch seconds (with a fraction), so a number below
 * 1e11 is read as seconds. A [year, month, day, hour, minute, second] array
 * or an ISO string is also accepted.
 */
export function formatAuditDateTime(
  value: AuditDateTime | undefined,
  locale = 'en'
): string {
  if (value === undefined || value === null || value === '') return ''
  let d: Date
  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    d = new Date(year, month - 1, day, hour, minute, second)
  } else if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(value)) {
    const epoch = Number(value)
    d = new Date(epoch < 1e11 ? epoch * 1000 : epoch)
  } else {
    d = new Date(value)
  }
  if (isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}
