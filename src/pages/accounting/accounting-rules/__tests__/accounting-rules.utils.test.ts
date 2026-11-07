/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import { formatTags, formatAccounts } from '../accounting-rules.utils'

describe('accounting-rules.utils', () => {
  describe('formatTags', () => {
    it('returns "—" when tags array is undefined or null', () => {
      expect(formatTags(undefined)).toBe('—')
    })

    it('returns "—" when tags array is empty', () => {
      expect(formatTags([])).toBe('—')
    })

    it('extracts tag names and does not render [object Object]', () => {
      const mockTags = [
        { id: 1, tag: { id: 101, name: 'Loans' } },
        { id: 2, tag: { id: 102, name: 'Savings' } },
      ]
      const result = formatTags(mockTags)
      expect(result).toBe('Loans, Savings')
      expect(result).not.toContain('[object Object]')
    })

    it('filters out undefined or missing names gracefully', () => {
      const mockTags = [
        { id: 1, tag: { id: 101, name: 'Shares' } },
        { id: 2, tag: {} },
      ]
      expect(formatTags(mockTags)).toBe('Shares')
    })

    it('returns "—" if all tag objects lack names', () => {
      const mockTags = [{ id: 1, tag: {} }, { id: 2 }]
      expect(formatTags(mockTags)).toBe('—')
    })
  })

  describe('formatAccounts', () => {
    it('returns "—" when accounts array is undefined', () => {
      expect(formatAccounts(undefined)).toBe('—')
    })

    it('returns "—" when accounts array is empty', () => {
      expect(formatAccounts([])).toBe('—')
    })

    it('joins account names with comma separation', () => {
      const mockAccounts = [
        { id: 1, name: 'Petty Cash' },
        { id: 2, name: 'Main Vault' },
      ]
      expect(formatAccounts(mockAccounts)).toBe('Petty Cash, Main Vault')
    })

    it('filters out accounts without names', () => {
      const mockAccounts = [{ id: 1, name: 'Petty Cash' }, { id: 2 }]
      expect(formatAccounts(mockAccounts)).toBe('Petty Cash')
    })
  })
})
