/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'
import type { TFunction } from 'i18next'

/** GET /tellers/{tellerId}/cashiers/{cashierId} and the list's cashiers */
export type Cashier = {
  id?: number
  tellerId?: number
  staffId?: number
  staffName?: string
  description?: string
  /** yyyy-MM-dd */
  startDate?: string
  endDate?: string
  isFullDay?: boolean
  /** "HH:mm", or a blank string for a full day */
  startTime?: string
  endTime?: string
}

/** GET /tellers/{tellerId}/cashiers */
export type CashiersOfTeller = {
  tellerId?: number
  tellerName?: string
  officeName?: string
  cashiers?: Cashier[]
}

/** GET /tellers/{tellerId}/cashiers/template */
export type CashierTemplate = {
  tellerName?: string
  officeName?: string
  staffOptions?: Array<{ id?: number; displayName?: string }>
}

/**
 * The body of POST and PUT /tellers/{tellerId}/cashiers. The generated
 * request types leave out startDate and the time fields (see ISSUES.md).
 */
export type CashierPayload = {
  staffId: number
  description?: string
  startDate: string
  endDate: string
  isFullDay: boolean
  hourStartTime?: string
  minStartTime?: string
  hourEndTime?: string
  minEndTime?: string
  startTime?: string
  endTime?: string
  dateFormat: string
  locale: string
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

export const apiErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

/** "09:00 - 17:30", or "Full day" */
export const shiftLabel = (c: Cashier, t: TFunction<'organization'>) =>
  c.isFullDay || !c.startTime?.trim()
    ? t('cashiers.shift.fullDay')
    : t('cashiers.shift.range', {
        start: c.startTime?.trim(),
        end: c.endTime?.trim(),
      })
