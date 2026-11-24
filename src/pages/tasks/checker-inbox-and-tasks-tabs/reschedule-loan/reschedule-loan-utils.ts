/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'
import type { BatchRequest, BatchResponse } from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'

type FineractErrorBody = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const extractFineractMessage = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null
  const err = data as FineractErrorBody
  const nested = err.errors?.[0]?.defaultUserMessage?.trim()
  if (nested) return nested
  const top = err.defaultUserMessage?.trim()
  return top || null
}

/**
 * Inspect Fineract batch responses for any non-200 item and return its user message.
 * Returns null when every item succeeded.
 */
export function getBatchErrorMessage(
  responses: BatchResponse[] | undefined,
  fallback: string
): string | null {
  if (!Array.isArray(responses)) return null
  const failedItem = responses.find(item => item.statusCode !== 200)
  if (!failedItem) return null

  if (failedItem.body) {
    try {
      const parsed: unknown =
        typeof failedItem.body === 'string'
          ? JSON.parse(failedItem.body)
          : failedItem.body
      const msg = extractFineractMessage(parsed)
      if (msg) return msg
    } catch {
      // Fall back to generic message when body is not valid JSON
    }
  }
  return fallback
}

/**
 * Extract Fineract's user-facing message from an Axios error, or return the fallback.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as AxiosError<FineractErrorBody> | undefined)?.response
    ?.data
  return extractFineractMessage(data) ?? fallback
}

/**
 * Format a Date object to dd MMMM yyyy string (e.g. 24 November 2026).
 */
export function getFormattedDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Build batch request payload for approving or rejecting loan rescheduling requests.
 */
export function buildRescheduleBatchRequests(
  scheduleIds: number[],
  command: 'approve' | 'reject',
  formattedDate: string = getFormattedDate()
): BatchRequest[] {
  return scheduleIds.map((scheduleId, index) => ({
    requestId: index + 1,
    method: 'POST',
    relativeUrl: `rescheduleloans/${scheduleId}?command=${command}`,
    body: JSON.stringify(
      command === 'approve'
        ? {
            approvedOnDate: formattedDate,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
          }
        : {
            rejectedOnDate: formattedDate,
            dateFormat: 'dd MMMM yyyy',
            locale: 'en',
          }
    ),
  }))
}

/**
 * Calculate next selected IDs after master toggle.
 */
export function toggleSelectAll(
  currentSelected: number[],
  visibleIds: Array<number | undefined | null>
): number[] {
  const validIds = visibleIds.filter((id): id is number => id != null)
  const allSelected =
    validIds.length > 0 && validIds.every(id => currentSelected.includes(id))

  if (allSelected) {
    return currentSelected.filter(id => !validIds.includes(id))
  }
  return Array.from(new Set([...currentSelected, ...validIds]))
}

/**
 * Format a reschedule date value while preserving date-only ISO strings
 * ("YYYY-MM-DD") as local calendar dates across timezones.
 */
export function formatRescheduleDate(
  value: number[] | string | undefined | null,
  locale?: string,
  fallback = '-'
): string {
  if (!value) return fallback
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
    if (match) {
      return formatDate(
        [Number(match[1]), Number(match[2]), Number(match[3])],
        locale,
        fallback
      )
    }
  }
  return formatDate(value, locale, fallback)
}
