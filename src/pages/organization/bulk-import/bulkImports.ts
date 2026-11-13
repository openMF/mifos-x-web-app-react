/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type organizationEn from '@/locales/en-US/organization.json'

/**
 * Which filters the template download offers: none, the office, the office
 * and its staff, or the office, staff and the client legal form.
 */
export type TemplateFilters = 'none' | 'office' | 'officeStaff' | 'client'

export type BulkImportLabelKey =
  keyof (typeof organizationEn)['bulkImport']['types']

type LegalFormLabelKey =
  keyof (typeof organizationEn)['bulkImport']['legalForms']

export type BulkImportEntity = {
  /** URL segment of the import page, e.g. /organization/bulk-import/loan-accounts */
  slug: string
  /** Key of the import type's label under `organization:bulkImport.types` */
  labelKey: BulkImportLabelKey
  /** `entityType` for GET /imports */
  entityType: string
  /** Prefix of `{prefix}/downloadtemplate` and `{prefix}/uploadtemplate` */
  urlSuffix: string
  filters: TemplateFilters
}

/** The import types of the Angular web app, with the same endpoints */
export const BULK_IMPORTS: BulkImportEntity[] = [
  {
    slug: 'offices',
    labelKey: 'offices',
    entityType: 'offices',
    urlSuffix: '/offices',
    filters: 'none',
  },
  {
    slug: 'users',
    labelKey: 'users',
    entityType: 'users',
    urlSuffix: '/users',
    filters: 'officeStaff',
  },
  {
    slug: 'groups',
    labelKey: 'groups',
    entityType: 'groups',
    urlSuffix: '/groups',
    filters: 'officeStaff',
  },
  {
    slug: 'centers',
    labelKey: 'centers',
    entityType: 'centers',
    urlSuffix: '/centers',
    filters: 'officeStaff',
  },
  {
    slug: 'clients',
    labelKey: 'clients',
    entityType: 'client',
    urlSuffix: '/clients',
    filters: 'client',
  },
  {
    slug: 'employees',
    labelKey: 'employees',
    entityType: 'staff',
    urlSuffix: '/staff',
    filters: 'office',
  },
  {
    slug: 'guarantors',
    labelKey: 'guarantors',
    entityType: 'guarantors',
    urlSuffix: '/loans/1/guarantors',
    filters: 'office',
  },
  {
    slug: 'journal-entries',
    labelKey: 'journalEntries',
    entityType: 'gljournalentries',
    urlSuffix: '/journalentries',
    filters: 'office',
  },
  {
    slug: 'loan-accounts',
    labelKey: 'loanAccounts',
    entityType: 'loans',
    urlSuffix: '/loans',
    filters: 'officeStaff',
  },
  {
    slug: 'savings-accounts',
    labelKey: 'savingsAccounts',
    entityType: 'savingsaccount',
    urlSuffix: '/savingsaccounts',
    filters: 'officeStaff',
  },
  {
    slug: 'fixed-deposit-accounts',
    labelKey: 'fixedDepositAccounts',
    entityType: 'fixeddepositaccounts',
    urlSuffix: '/fixeddepositaccounts',
    filters: 'officeStaff',
  },
  {
    slug: 'recurring-deposit-accounts',
    labelKey: 'recurringDepositAccounts',
    entityType: 'recurringdeposits',
    urlSuffix: '/recurringdepositaccounts',
    filters: 'officeStaff',
  },
  {
    slug: 'chart-of-accounts',
    labelKey: 'chartOfAccounts',
    entityType: 'chartofaccounts',
    urlSuffix: '/glaccounts',
    filters: 'officeStaff',
  },
  {
    slug: 'share-accounts',
    labelKey: 'shareAccounts',
    entityType: 'shareaccounts',
    urlSuffix: '/accounts/share',
    filters: 'office',
  },
  {
    slug: 'loan-repayments',
    labelKey: 'loanRepayments',
    entityType: 'loantransactions',
    urlSuffix: '/loans/repayments',
    filters: 'office',
  },
  {
    slug: 'savings-transactions',
    labelKey: 'savingsTransactions',
    entityType: 'savingstransactions',
    urlSuffix: '/savingsaccounts/transactions',
    filters: 'office',
  },
  {
    slug: 'fixed-deposit-transactions',
    labelKey: 'fixedDepositTransactions',
    entityType: 'fixeddeposittransactions',
    urlSuffix: '/fixeddepositaccounts/transaction',
    filters: 'office',
  },
  {
    slug: 'recurring-deposit-transactions',
    labelKey: 'recurringDepositTransactions',
    entityType: 'recurringdepositstransactions',
    urlSuffix: '/recurringdepositaccounts/transactions',
    filters: 'office',
  },
]

/** Values of the `legalFormType` parameter for client templates and uploads */
export const CLIENT_LEGAL_FORMS: { id: string; labelKey: LegalFormLabelKey }[] =
  [
    { id: 'CLIENTS_PERSON', labelKey: 'person' },
    { id: 'CLIENTS_ENTITY', labelKey: 'entity' },
  ]
