/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

/** Value AppSelect uses for "no filter" (Radix Select rejects '') */
export const ANY = 'any'

export type CheckerInboxFilters = {
  makerId: string
  actionName: string
  entityName: string
  resourceId: string
  fromDate: string
  toDate: string
}

export const emptyFilters: CheckerInboxFilters = {
  makerId: ANY,
  actionName: ANY,
  entityName: ANY,
  resourceId: '',
  fromDate: '',
  toDate: '',
}

const orUndefined = (value: string) =>
  value === ANY || value.trim() === '' ? undefined : value.trim()

const toId = (value: string) => {
  const text = orUndefined(value)
  return text === undefined ? undefined : Number(text)
}

/**
 * The GET /makercheckers query for the filters. Fineract compares the dates
 * by day, so a yyyy-MM-dd value includes the whole day on both ends.
 */
export const checkerInboxQuery = (filters: CheckerInboxFilters) => ({
  actionName: orUndefined(filters.actionName),
  entityName: orUndefined(filters.entityName),
  resourceId: toId(filters.resourceId),
  makerId: toId(filters.makerId),
  makerDateTimeFrom: orUndefined(filters.fromDate),
  makerDateTimeTo: orUndefined(filters.toDate),
})

/** Why the filters can't be searched, or null when they can */
export const filtersError = (filters: CheckerInboxFilters): string | null =>
  filters.fromDate && filters.toDate && filters.fromDate > filters.toDate
    ? 'From Date must be on or before To Date.'
    : null

export type CheckerAction = 'approve' | 'reject' | 'delete'

export const actionLabels: Record<
  CheckerAction,
  { verb: string; past: string; progress: string }
> = {
  approve: { verb: 'Approve', past: 'Approved', progress: 'Approving...' },
  reject: { verb: 'Reject', past: 'Rejected', progress: 'Rejecting...' },
  delete: { verb: 'Delete', past: 'Deleted', progress: 'Deleting...' },
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** The message Fineract sent with the error, or the fallback */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as AxiosError<ApiErrorResponse> | undefined)?.response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    data?.developerMessage ||
    fallback
  )
}

export type BulkActionResult = {
  action: CheckerAction
  succeeded: number
  failed: Array<{ id: number; message: string }>
}

/**
 * Runs the action on each entry one after another, so one entry Fineract
 * rejects doesn't stop the others, and reports which ones failed and why.
 */
export const runBulkAction = async (
  action: CheckerAction,
  ids: number[],
  request: (id: number) => Promise<unknown>
): Promise<BulkActionResult> => {
  const result: BulkActionResult = { action, succeeded: 0, failed: [] }
  for (const id of ids) {
    try {
      await request(id)
      result.succeeded += 1
    } catch (err) {
      result.failed.push({
        id,
        message: apiErrorMessage(err, `Failed to ${action} the entry.`),
      })
    }
  }
  return result
}
