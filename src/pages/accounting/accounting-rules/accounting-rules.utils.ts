/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  AccountingTagRuleData,
  GLAccountDataForLookup,
} from '@/fineract-api'

/**
 * Safely formats debit/credit tag rules into a comma-separated list of tag names,
 * preventing `[object Object]` rendering in the UI.
 */
export const formatTags = (tags?: AccountingTagRuleData[]): string => {
  if (!tags || tags.length === 0) return '—'
  const names = tags.map(t => t.tag?.name).filter(Boolean)
  return names.length > 0 ? names.join(', ') : '—'
}

/**
 * Safely formats debit/credit accounts into a comma-separated list of account names.
 */
export const formatAccounts = (accounts?: GLAccountDataForLookup[]): string => {
  if (!accounts || accounts.length === 0) return '—'
  const names = accounts.map(a => a.name).filter(Boolean)
  return names.length > 0 ? names.join(', ') : '—'
}
