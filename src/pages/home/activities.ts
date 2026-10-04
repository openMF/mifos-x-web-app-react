/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type commonEn from '@/locales/en-US/common.json'

export type ActivityKey = keyof (typeof commonEn)['activities']

export interface Activity {
  key: ActivityKey
  path: string
}

// Pages that can be opened from the Home page activity search. Labels live
// under the `activities` key in common.json.
export const activities: Activity[] = [
  { key: 'dashboard', path: '/dashboard' },
  { key: 'navigation', path: '/navigation' },
  { key: 'clients', path: '/clients' },
  { key: 'createClient', path: '/clients/create' },
  { key: 'groups', path: '/groups' },
  { key: 'createGroup', path: '/groups/create' },
  { key: 'centers', path: '/centers' },
  { key: 'createCenter', path: '/centers/create' },
  {
    key: 'checkerInbox',
    path: '/checker-inbox-and-tasks/checker-inbox',
  },
  {
    key: 'individualCollectionSheet',
    path: '/individual-collection-sheet',
  },
  { key: 'notifications', path: '/notifications' },
  { key: 'profile', path: '/profile' },
  { key: 'settings', path: '/settings' },
  { key: 'users', path: '/appusers' },
  { key: 'createUser', path: '/appusers/create' },
  { key: 'templates', path: '/templates' },
  { key: 'reports', path: '/reports' },

  { key: 'accounting', path: '/accounting' },
  { key: 'chartOfAccounts', path: '/accounting/chart-of-accounts' },
  { key: 'journalEntries', path: '/accounting/journal-entries' },
  { key: 'createJournalEntry', path: '/accounting/journal-entries/create' },
  {
    key: 'frequentPostings',
    path: '/accounting/journal-entries/frequent-postings',
  },
  { key: 'accountingRules', path: '/accounting/accounting-rules' },
  { key: 'closingEntries', path: '/accounting/closing-entries' },
  {
    key: 'financialActivityMappings',
    path: '/accounting/financial-activity-mappings',
  },
  { key: 'periodicAccruals', path: '/accounting/accruals' },
  { key: 'provisioningEntries', path: '/accounting/provisioning-entries' },

  { key: 'organization', path: '/organization' },
  { key: 'offices', path: '/organization/offices' },
  { key: 'holidays', path: '/organization/holidays' },
  { key: 'employees', path: '/organization/employees' },
  { key: 'currencies', path: '/organization/currencies' },
  { key: 'funds', path: '/organization/manage-funds' },
  { key: 'bulkLoanReassignment', path: '/organization/bulkloan' },
  { key: 'tellers', path: '/organization/tellers' },
  { key: 'paymentTypes', path: '/organization/payment-types' },
  { key: 'workingDays', path: '/organization/working-days' },
  { key: 'adhocQuery', path: '/organization/adhoc-query' },
  { key: 'investors', path: '/organization/investors' },

  { key: 'products', path: '/products' },
  { key: 'loanProducts', path: '/products/loan-products' },
  { key: 'savingProducts', path: '/products/saving-products' },
  { key: 'shareProducts', path: '/products/share-products' },
  { key: 'charges', path: '/products/charges' },
  { key: 'collaterals', path: '/products/collaterals' },
  { key: 'productsMix', path: '/products/products-mix' },
  { key: 'fixedDepositProducts', path: '/products/fixed-deposit-products' },
  {
    key: 'recurringDepositProducts',
    path: '/products/recurring-deposit-products',
  },
  { key: 'taxConfigurations', path: '/products/tax-configurations' },
  { key: 'floatingRates', path: '/products/floating-rates' },
  {
    key: 'delinquencyBuckets',
    path: '/products/delinquency-bucket-configurations',
  },

  { key: 'system', path: '/system' },
  { key: 'dataTables', path: '/system/data-tables' },
  { key: 'codes', path: '/system/codes' },
  { key: 'manageReports', path: '/system/reports' },
  { key: 'rolesAndPermissions', path: '/system/roles-and-permissions' },
  { key: 'hooks', path: '/system/hooks' },
  { key: 'configurations', path: '/system/configurations' },
  {
    key: 'accountNumberPreferences',
    path: '/system/account-number-preferences',
  },
  { key: 'entityMapping', path: '/system/entity-mapping' },
  { key: 'externalEvents', path: '/system/external-events' },
]
