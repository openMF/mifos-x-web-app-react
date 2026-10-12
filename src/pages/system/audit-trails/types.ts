/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Epoch milliseconds from GET /audits, epoch seconds from GET /audits/{id} */
export type AuditDateTime = number | string | number[]

/**
 * One entry from GET /audits and GET /audits/{id}. The generated client
 * types the list as a string and the entry as AuditData (created/modified
 * fields only), so the real shape is declared here (listed in ISSUES.md).
 */
export interface AuditEntry {
  id?: number
  actionName?: string
  entityName?: string
  resourceId?: number
  subresourceId?: number
  maker?: string
  madeOnDate?: AuditDateTime
  checker?: string
  checkedOnDate?: AuditDateTime
  processingResult?: string
  commandAsJson?: string
  officeName?: string
  groupLevelName?: string
  groupName?: string
  clientName?: string
  loanAccountNo?: string
  savingsAccountNo?: string
  clientId?: number
  loanId?: number
  url?: string
  ip?: string
}

/** GET /audits?paged=true */
export interface AuditPage {
  totalFilteredRecords?: number
  pageItems?: AuditEntry[]
}

/** An entry of appUsers in GET /audits/searchtemplate (missing from AppUserData) */
export interface AuditAppUser {
  id?: number
  username?: string
}
