/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

/** One provisioning category row, as GET /provisioningcriteria/{id} returns it */
export type CriteriaDefinition = {
  categoryId?: number
  categoryName?: string
  minAge?: number
  maxAge?: number
  provisioningPercentage?: number
  liabilityAccount?: number
  liabilityName?: string
  expenseAccount?: number
  expenseName?: string
}

export type CriteriaLoanProduct = { id?: number; name?: string }

export type GlAccount = {
  id?: number
  name?: string
  glCode?: string
  type?: { value?: string }
}

/** GET /provisioningcriteria/{id} (with ?template=true for edit) */
export type ProvisioningCriteria = {
  criteriaId?: number
  criteriaName?: string
  createdBy?: string
  loanProducts?: CriteriaLoanProduct[]
  /** Only with ?template=true: the products already on this criteria */
  selectedLoanProducts?: CriteriaLoanProduct[]
  definitions?: CriteriaDefinition[]
  glAccounts?: GlAccount[]
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

/** Fineract sends category names in upper case, e.g. SUB-STANDARD */
export const categoryLabel = (name?: string) =>
  (name ?? '').toLowerCase().replace(/(^|[\s-])\w/g, c => c.toUpperCase())
