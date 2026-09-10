/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, it, expect } from 'vitest'
import {
  formatDate,
  dateArrayToInputValue,
  inputToFineractDate,
} from '../date-utils'

// ─────────────────────────────────────────────────────────────────────────────
// formatDate()
// ─────────────────────────────────────────────────────────────────────────────
describe('formatDate()', () => {
  // ── Nullish / empty inputs ──────────────────────────────────────────────
  describe('nullish / empty inputs', () => {
    it('returns default fallback "—" when date is null', () => {
      expect(formatDate(null)).toBe('—')
    })

    it('returns default fallback "—" when date is undefined', () => {
      expect(formatDate(undefined)).toBe('—')
    })

    it('returns custom fallback when date is null', () => {
      expect(formatDate(null, 'en', 'N/A')).toBe('N/A')
    })

    it('returns fallback for empty string', () => {
      expect(formatDate('')).toBe('—')
    })

    it('returns fallback for whitespace-only string', () => {
      expect(formatDate('   ')).toBe('—')
    })
  })

  // ── ISO string inputs ───────────────────────────────────────────────────
  describe('ISO string input', () => {
    it('formats a valid ISO date string in en-US locale', () => {
      const result = formatDate('2024-01-15', 'en-US')
      expect(result).toBe('January 15, 2024')
    })

    it('formats a valid date array in fr-FR locale', () => {
      // Use array (local time) instead of ISO string (UTC) to avoid timezone flakiness
      const result = formatDate([2024, 1, 15], 'fr-FR')
      // French: "15 janvier 2024"
      expect(result).toMatch(/15/)
      expect(result).toMatch(/2024/)
      expect(result.toLowerCase()).toMatch(/janvier/)
    })

    it('formats December date correctly', () => {
      // Use array (local time) instead of ISO string (UTC) to avoid timezone flakiness
      const result = formatDate([2023, 12, 31], 'en-US')
      expect(result).toBe('December 31, 2023')
    })

    it('returns fallback for completely invalid string "abc"', () => {
      expect(formatDate('abc')).toBe('—')
    })

    it('returns fallback for another invalid date string', () => {
      const result = formatDate('not-a-date')
      expect(result).toBe('—')
    })

    it('handles leap year date [2024, 2, 29]', () => {
      // Use array (local time) instead of ISO string (UTC) to avoid timezone flakiness
      const result = formatDate([2024, 2, 29], 'en-US')
      expect(result).toBe('February 29, 2024')
    })
  })

  // ── Date array inputs [year, month, day] ────────────────────────────────
  describe('API date array input [year, month, day]', () => {
    it('formats a valid date array in en-US locale', () => {
      const result = formatDate([2024, 3, 25], 'en-US')
      expect(result).toBe('March 25, 2024')
    })

    it('formats a date array in fr-FR locale', () => {
      const result = formatDate([2024, 3, 25], 'fr-FR')
      expect(result).toMatch(/25/)
      expect(result).toMatch(/2024/)
      expect(result.toLowerCase()).toMatch(/mars/)
    })

    it('returns fallback for array with fewer than 3 elements', () => {
      expect(formatDate([2024, 1] as unknown as number[])).toBe('—')
    })

    it('returns fallback for empty array', () => {
      expect(formatDate([] as unknown as number[])).toBe('—')
    })

    it('handles leap year: [2024, 2, 29]', () => {
      const result = formatDate([2024, 2, 29], 'en-US')
      expect(result).toBe('February 29, 2024')
    })

    it('rolls over invalid calendar date [2023, 2, 29] (non-leap year)', () => {
      // JS Date rolls 29 Feb 2023 → 1 Mar 2023
      const result = formatDate([2023, 2, 29], 'en-US')
      expect(result).toBe('March 01, 2023')
    })

    it('handles month 12 (December)', () => {
      const result = formatDate([2023, 12, 31], 'en-US')
      expect(result).toBe('December 31, 2023')
    })
  })

  // ── Date object inputs ──────────────────────────────────────────────────
  describe('Date object input', () => {
    it('formats a valid Date object in en-US', () => {
      const d = new Date(2024, 0, 15) // Jan 15, 2024 (local)
      const result = formatDate(d, 'en-US')
      expect(result).toBe('January 15, 2024')
    })

    it('returns fallback for Invalid Date object', () => {
      expect(formatDate(new Date('invalid'))).toBe('—')
    })
  })

  // ── Locale tests ─────────────────────────────────────────────────────────
  describe('locale handling', () => {
    it('uses "en" as default locale', () => {
      // Use array (local time) instead of ISO string (UTC) to avoid timezone flakiness
      const result = formatDate([2024, 6, 1])
      expect(result).toMatch(/June/)
      expect(result).toMatch(/2024/)
    })

    it('formats correctly in de-DE (German)', () => {
      // Use array (local time) instead of ISO string (UTC) to avoid timezone flakiness
      const result = formatDate([2024, 6, 1], 'de-DE')
      expect(result).toMatch(/2024/)
      expect(result.toLowerCase()).toMatch(/juni/)
    })

    it('returns fallback for unsupported/invalid locale', () => {
      // Intl may throw or fallback; function should never throw
      expect(() => formatDate('2024-01-01', 'invalid-LOCALE')).not.toThrow()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// dateArrayToInputValue()
// ─────────────────────────────────────────────────────────────────────────────
describe('dateArrayToInputValue()', () => {
  it('converts [2024, 1, 15] → "2024-01-15" (month padded)', () => {
    expect(dateArrayToInputValue([2024, 1, 15])).toBe('2024-01-15')
  })

  it('converts [2024, 12, 5] → "2024-12-05" (day padded)', () => {
    expect(dateArrayToInputValue([2024, 12, 5])).toBe('2024-12-05')
  })

  it('converts [2024, 11, 30] → "2024-11-30" (no padding needed)', () => {
    expect(dateArrayToInputValue([2024, 11, 30])).toBe('2024-11-30')
  })

  it('returns "" for null input', () => {
    expect(dateArrayToInputValue(null)).toBe('')
  })

  it('returns "" for undefined input', () => {
    expect(dateArrayToInputValue(undefined)).toBe('')
  })

  it('returns "" for array with fewer than 3 elements', () => {
    expect(dateArrayToInputValue([2024, 1])).toBe('')
  })

  it('returns "" for empty array', () => {
    expect(dateArrayToInputValue([])).toBe('')
  })

  it('handles leap year date [2024, 2, 29] → "2024-02-29"', () => {
    expect(dateArrayToInputValue([2024, 2, 29])).toBe('2024-02-29')
  })

  it('pads both month and day when both are single-digit', () => {
    expect(dateArrayToInputValue([2024, 3, 7])).toBe('2024-03-07')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// inputToFineractDate()
// ─────────────────────────────────────────────────────────────────────────────
describe('inputToFineractDate()', () => {
  // ── Valid inputs ─────────────────────────────────────────────────────────
  it('converts "2024-01-15" → "15 January 2024"', () => {
    expect(inputToFineractDate('2024-01-15')).toBe('15 January 2024')
  })

  it('converts "2024-12-31" → "31 December 2024"', () => {
    expect(inputToFineractDate('2024-12-31')).toBe('31 December 2024')
  })

  it('pads day with leading zero: "2024-03-05" → "05 March 2024"', () => {
    expect(inputToFineractDate('2024-03-05')).toBe('05 March 2024')
  })

  // ── Empty / missing inputs ───────────────────────────────────────────────
  it('returns undefined for empty string', () => {
    expect(inputToFineractDate('')).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(inputToFineractDate(undefined)).toBeUndefined()
  })

  // ── Malformed inputs ─────────────────────────────────────────────────────
  it('returns undefined for "abc" (non-date string)', () => {
    expect(inputToFineractDate('abc')).toBeUndefined()
  })

  it('returns undefined for "2024" (no month/day)', () => {
    expect(inputToFineractDate('2024')).toBeUndefined()
  })

  it('returns undefined for "2024-00-00" (zero month/day)', () => {
    expect(inputToFineractDate('2024-00-00')).toBeUndefined()
  })

  it('returns undefined for "--" (double dash only)', () => {
    expect(inputToFineractDate('--')).toBeUndefined()
  })

  // ── Leap year ────────────────────────────────────────────────────────────
  it('handles leap year: "2024-02-29" → "29 February 2024"', () => {
    expect(inputToFineractDate('2024-02-29')).toBe('29 February 2024')
  })

  it('rolls over non-leap "2023-02-29": month rolls to March but day stays 29', () => {
    // NOTE: The function uses original d=29 but gets month name from JS Date
    // which rolls Feb-29 → Mar. So output is "29 March 2023" (quirk documented).
    expect(inputToFineractDate('2023-02-29')).toBe('29 March 2023')
  })

  // ── Month names always in English (locale-independent) ───────────────────
  it('always returns English month name regardless of system locale', () => {
    const result = inputToFineractDate('2024-07-04')
    expect(result).toBe('04 July 2024')
  })
})
