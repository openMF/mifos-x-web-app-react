/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { LoanOriginator } from '@/pages/organization/loan-originators/types'

/** GET /loans/{loanId}/originators wraps the list */
export type LoanOriginatorsResponse = { originators?: LoanOriginator[] }

/** The part of the loan the Outlet passes down to the Originators tab */
export type LoanOutletContext = { status?: { pendingApproval?: boolean } }

/** What LoansView passes to its tabs through the Outlet */
export type LoansViewOutletContext = {
  loan?: LoanOutletContext
  canDetachOriginator?: boolean
}

/**
 * Fineract only attaches or detaches an originator while the loan is
 * submitted and pending approval.
 */
export const canChangeOriginators = (loan?: LoanOutletContext) =>
  Boolean(loan?.status?.pendingApproval)

/**
 * Originators that can still be attached: Fineract rejects inactive ones and
 * a second mapping of the same originator, so leave both out of the select.
 */
export const attachableOriginators = (
  all: LoanOriginator[],
  attached: LoanOriginator[]
) => {
  const attachedIds = new Set(attached.map(o => o.id))
  return all.filter(o => o.status === 'ACTIVE' && !attachedIds.has(o.id))
}
