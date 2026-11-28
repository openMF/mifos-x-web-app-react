/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import i18next from 'i18next'
import { beforeAll, expect, it } from 'vitest'

import common from '@/locales/fr-FR/common.json'
import { buildAccountBreadcrumbs } from './accountBreadcrumbs'

beforeAll(async () => {
  await i18next.init({
    lng: 'fr-FR',
    defaultNS: 'common',
    resources: { 'fr-FR': { common } },
  })
})

it.each([
  ['interest-rate-chart', "Grille des taux d'intérêt"],
  ['standing-instructions', 'Ordres permanents'],
])('localizes fixed deposit breadcrumbs for %s', (tab, label) => {
  const accountPath = '/clients/7/fixed-deposits-accounts/19'
  const crumbs = buildAccountBreadcrumbs(`${accountPath}/${tab}`)

  expect(crumbs.slice(-2)).toEqual([
    { label: 'Compte de dépôt à terme', href: `${accountPath}/general` },
    { label },
  ])
})
