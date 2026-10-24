/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'
import type { PostRunaccrualsRequest } from '@/fineract-api'
import { todayInputValue } from '@/lib/date-utils'

export type FineractApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
    userMessageGlobalisationCode?: string
  }>
}

/**
 * Validates the tillDate parameter for periodic accrual accounting.
 * Ensures the date is provided and not in the future.
 */
export function validateAccrueTillDate(
  tillDate?: string | null,
  maxDate: string = todayInputValue()
): string | null {
  if (!tillDate || !tillDate.trim()) {
    return 'Accrue Till Date is required.'
  }

  if (tillDate > maxDate) {
    return 'Accrue Till Date cannot be in the future.'
  }

  return null
}

/**
 * Builds the PostRunaccrualsRequest payload required by Fineract API.
 */
export function buildPeriodicAccrualPayload(
  tillDate: string,
  locale = 'en',
  dateFormat = 'yyyy-MM-dd'
): PostRunaccrualsRequest {
  return {
    tillDate,
    dateFormat,
    locale,
  }
}

/**
 * Extracts a user-friendly error message from Fineract API response or generic error.
 */
export function getPeriodicAccrualErrorMessage(
  error: unknown,
  fallback = 'Failed to execute periodic accrual accounting.'
): string {
  const axiosError = error as AxiosError<FineractApiErrorResponse>
  const responseData = axiosError?.response?.data

  return (
    responseData?.errors?.[0]?.defaultUserMessage ||
    responseData?.defaultUserMessage ||
    (error instanceof Error && error.message ? error.message : fallback)
  )
}
