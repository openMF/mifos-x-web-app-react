/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface BulkImportItem {
  name: string
  entityType: string
  urlSuffix: string
  permission: string
  formFields: number
  description: string
}

export const BULK_IMPORTS: BulkImportItem[] = [
  {
    name: 'Offices',
    entityType: 'offices',
    urlSuffix: '/offices',
    permission: 'READ_OFFICE',
    formFields: 0,
    description: 'Bulk import offices into the system.',
  },
  {
    name: 'Users',
    entityType: 'users',
    urlSuffix: '/users',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import user accounts.',
  },
  {
    name: 'Groups',
    entityType: 'groups',
    urlSuffix: '/groups',
    permission: 'READ_GROUP',
    formFields: 2,
    description: 'Bulk import groups.',
  },
  {
    name: 'Centers',
    entityType: 'centers',
    urlSuffix: '/centers',
    permission: 'READ_CENTERS',
    formFields: 2,
    description: 'Bulk import centers.',
  },
  {
    name: 'Clients',
    entityType: 'client',
    urlSuffix: '/clients',
    permission: 'READ_CLIENT',
    formFields: 3,
    description: 'Bulk import client profiles (Person and Entity).',
  },
  {
    name: 'Employees',
    entityType: 'staff',
    urlSuffix: '/staff',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import staff and employees.',
  },
  {
    name: 'Guarantors',
    entityType: 'guarantors',
    urlSuffix: '/loans/1/guarantors',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import loan guarantors.',
  },
  {
    name: 'Journal Entries',
    entityType: 'gljournalentries',
    urlSuffix: '/journalentries',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import General Ledger journal entries.',
  },
  {
    name: 'Loan Accounts',
    entityType: 'loans',
    urlSuffix: '/loans',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import loan accounts.',
  },
  {
    name: 'Savings Accounts',
    entityType: 'savingsaccount',
    urlSuffix: '/savingsaccounts',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import savings accounts.',
  },
  {
    name: 'Fixed Deposit Accounts',
    entityType: 'fixeddepositaccounts',
    urlSuffix: '/fixeddepositaccounts',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import fixed deposit accounts.',
  },
  {
    name: 'Recurring Deposit Accounts',
    entityType: 'recurringdeposits',
    urlSuffix: '/recurringdepositaccounts',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import recurring deposit accounts.',
  },
  {
    name: 'Chart of Accounts',
    entityType: 'chartofaccounts',
    urlSuffix: '/glaccounts',
    permission: 'READ_CLIENT',
    formFields: 2,
    description: 'Bulk import chart of accounts.',
  },
  {
    name: 'Share Accounts',
    entityType: 'shareaccounts',
    urlSuffix: '/accounts/share',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import share accounts.',
  },
  {
    name: 'Loan Repayments',
    entityType: 'loantransactions',
    urlSuffix: '/loans/repayments',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import loan repayments.',
  },
  {
    name: 'Savings Transactions',
    entityType: 'savingstransactions',
    urlSuffix: '/savingsaccounts/transactions',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import savings transactions.',
  },
  {
    name: 'Fixed Deposit Transactions',
    entityType: 'fixeddeposittransactions',
    urlSuffix: '/fixeddepositaccounts/transaction',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import fixed deposit transactions.',
  },
  {
    name: 'Recurring Deposit Transactions',
    entityType: 'recurringdepositstransactions',
    urlSuffix: '/recurringdepositaccounts/transactions',
    permission: 'READ_CLIENT',
    formFields: 1,
    description: 'Bulk import recurring deposit transactions.',
  },
]
