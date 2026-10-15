/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * The entities a data table check can be set on. The template lists more
 * entities, but only these four have statuses (statusClient, statusLoans,
 * statusGroup, statusSavings), the same four the Angular web app offers.
 */
export const CHECK_ENTITIES = [
  {
    value: 'm_client',
    labelKey: 'entityChecks.entities.client',
    statusKey: 'statusClient',
  },
  {
    value: 'm_loan',
    labelKey: 'entityChecks.entities.loan',
    statusKey: 'statusLoans',
  },
  {
    value: 'm_group',
    labelKey: 'entityChecks.entities.group',
    statusKey: 'statusGroup',
  },
  {
    value: 'm_savings_account',
    labelKey: 'entityChecks.entities.savingsAccount',
    statusKey: 'statusSavings',
  },
] as const

export type CheckEntity = (typeof CHECK_ENTITIES)[number]['value']

/** Entities whose checks can be limited to one product */
export const PRODUCT_ENTITIES: readonly string[] = [
  'm_loan',
  'm_savings_account',
]

/** The organization-namespace key of an entity's label, if it is one of these four */
export const entityLabelKey = (entity?: string) =>
  CHECK_ENTITIES.find(e => e.value === entity)?.labelKey
