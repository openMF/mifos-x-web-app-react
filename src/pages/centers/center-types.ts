/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { GetCentersCenterIdResponse } from '@/fineract-api'
import { dateArrayToInputValue } from '@/lib/date-utils'

// Module augmentation: add activationDate to generated PostCentersCenterIdRequest
// and externalId/staffId to PutCentersCenterIdRequest to ensure type safety
// without unsafe casts when calling centersApi.activate2 and centersApi.update12
declare module '@/fineract-api' {
  interface PostCentersCenterIdRequest {
    activationDate?: string
  }
  interface PutCentersCenterIdRequest {
    externalId?: string
    staffId?: number
  }
}

export interface ExtendedCenterResponse extends GetCentersCenterIdResponse {
  externalId?: string
  staffId?: number
  staffName?: string
  staffOptions?: Array<{
    id?: number
    displayName?: string
  }>
  activationDate?: number[] | string
  timeline?: {
    submittedOnDate?: number[] | string
    activatedOnDate?: number[] | string
    closedOnDate?: number[] | string
  }
}

export type NarrationOption = {
  id: number
  name?: string
  value?: string
  description?: string
}

export type CenterApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

export const toDateInput = (val?: unknown): string => {
  if (Array.isArray(val)) return dateArrayToInputValue(val as number[])
  if (typeof val === 'string') return val.split('T')[0]
  return ''
}

export const buildCenterUpdatePayload = (
  name: string,
  externalId?: string,
  staffId?: string
) => ({
  name: name.trim(),
  externalId: externalId?.trim(),
  staffId: staffId ? Number(staffId) : undefined,
})
