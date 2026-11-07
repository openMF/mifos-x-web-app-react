/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

/** A code value such as MERCHANT (originator type) or ONLINE (channel) */
export type CodeOption = { id?: number; name?: string }

/** GET /loan-originators and GET /loan-originators/{id} */
export type LoanOriginator = {
  id?: number
  externalId?: string
  name?: string
  status?: string
  originatorType?: CodeOption
  channelType?: CodeOption
}

/** GET /loan-originators/template */
export type LoanOriginatorTemplate = {
  externalId?: string
  statusOptions?: string[]
  originatorTypeOptions?: CodeOption[]
  channelTypeOptions?: CodeOption[]
}

/** The body of POST /loan-originators and PUT /loan-originators/{id} */
export type LoanOriginatorPayload = {
  externalId?: string
  name: string
  status: string
  /** null clears it on edit */
  originatorTypeId?: number | null
  channelTypeId?: number | null
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

/** Fineract sends upper-case codes such as IN_STORE; show them as "In Store" */
export const codeLabel = (code?: string) =>
  (code ?? '')
    .toLowerCase()
    .split('_')
    .map(w => (w === 'api' ? 'API' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
