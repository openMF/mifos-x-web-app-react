/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const MODULES = [
  'global',
  'client',
  'loan',
  'savings',
  'shares',
] as const

export type WidgetModule = (typeof MODULES)[number]

export const WIDGETS = [
  { id: 'clients', module: 'client' },
  { id: 'loans', module: 'loan' },
  { id: 'deposits', module: 'savings' },
  { id: 'shares', module: 'shares' },
  { id: 'trend', module: 'global' },
  { id: 'accountMix', module: 'global' },
] as const satisfies readonly { id: string; module: WidgetModule }[]

export type WidgetId = (typeof WIDGETS)[number]['id']

/**
 * Fineract has no API for dashboard settings, so which widgets are hidden is
 * kept in this browser only.
 */
const STORAGE_KEY = 'mifos.manageDashboards.hiddenWidgets'

export const loadHiddenWidgets = (): WidgetId[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(stored)
      ? WIDGETS.map(w => w.id).filter(id => stored.includes(id))
      : []
  } catch {
    return []
  }
}

export const saveHiddenWidgets = (hidden: WidgetId[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden))
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts until reload
  }
}
