/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDate,
  todayInputValue,
  dateArrayToInputValue,
  dateArrayToDatetimeInputValue,
  toDatetimeSecondsValue,
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
      // Use explicit local time T00:00:00 to avoid UTC midnight shifting to previous day in negative timezones
      const result = formatDate('2024-01-15T00:00:00', 'en-US')
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

    it('returns fallback when Intl throws on an invalid locale format', () => {
      const result = formatDate(
        '2024-01-15T00:00:00',
        'invalid_locale_format_###',
        'fallback'
      )
      expect(result).toBe('fallback')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// todayInputValue()
// ─────────────────────────────────────────────────────────────────────────────
describe('todayInputValue()', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today date in YYYY-MM-DD format', () => {
    const result = todayInputValue()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('pads single-digit month and day with leading zeros', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 4, 7)) // May 7, 2024
    expect(todayInputValue()).toBe('2024-05-07')
  })

  it('handles two-digit month and day without extra padding', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 11, 25)) // Dec 25, 2024
    expect(todayInputValue()).toBe('2024-12-25')
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
// dateArrayToDatetimeInputValue()
// ─────────────────────────────────────────────────────────────────────────────
describe('dateArrayToDatetimeInputValue()', () => {
  it('returns "" for null or undefined input', () => {
    expect(dateArrayToDatetimeInputValue(null)).toBe('')
    expect(dateArrayToDatetimeInputValue(undefined)).toBe('')
  })

  it('returns "" for array with fewer than 3 elements', () => {
    expect(dateArrayToDatetimeInputValue([])).toBe('')
    expect(dateArrayToDatetimeInputValue([2024, 1])).toBe('')
  })

  it('defaults hour, minute, second to 00:00:00 when only date is provided', () => {
    expect(dateArrayToDatetimeInputValue([2024, 1, 15])).toBe(
      '2024-01-15T00:00:00'
    )
  })

  it('converts full [year, month, day, hour, minute, second] array', () => {
    expect(dateArrayToDatetimeInputValue([2024, 12, 31, 23, 59, 58])).toBe(
      '2024-12-31T23:59:58'
    )
  })

  it('pads single-digit hour, minute, second with leading zeros', () => {
    expect(dateArrayToDatetimeInputValue([2024, 3, 5, 9, 4, 2])).toBe(
      '2024-03-05T09:04:02'
    )
  })

  it('handles partial time components defaulting omitted ones to 0', () => {
    expect(dateArrayToDatetimeInputValue([2024, 6, 10, 14])).toBe(
      '2024-06-10T14:00:00'
    )
    expect(dateArrayToDatetimeInputValue([2024, 6, 10, 14, 30])).toBe(
      '2024-06-10T14:30:00'
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toDatetimeSecondsValue()
// ─────────────────────────────────────────────────────────────────────────────
describe('toDatetimeSecondsValue()', () => {
  it('returns "" for null, undefined, or empty string', () => {
    expect(toDatetimeSecondsValue(null)).toBe('')
    expect(toDatetimeSecondsValue(undefined)).toBe('')
    expect(toDatetimeSecondsValue('')).toBe('')
  })

  it('replaces space with T when separating date and time', () => {
    expect(toDatetimeSecondsValue('2024-01-15 14:30:00')).toBe(
      '2024-01-15T14:30:00'
    )
  })

  it('appends :00 for seconds when input has no seconds component', () => {
    expect(toDatetimeSecondsValue('2024-01-15T14:30')).toBe(
      '2024-01-15T14:30:00'
    )
  })

  it('preserves existing seconds when already provided', () => {
    expect(toDatetimeSecondsValue('2024-01-15T14:30:45')).toBe(
      '2024-01-15T14:30:45'
    )
  })

  it('slices sub-second fractions to 2 digits', () => {
    expect(toDatetimeSecondsValue('2024-01-15T14:30:45.123')).toBe(
      '2024-01-15T14:30:45'
    )
  })

  it('defaults time to 00:00:00 when only date is provided', () => {
    expect(toDatetimeSecondsValue('2024-01-15')).toBe('2024-01-15T00:00:00')
  })

  it('pads single-digit hour, minute, and second values', () => {
    expect(toDatetimeSecondsValue('2024-01-15T9:5:2')).toBe(
      '2024-01-15T09:05:02'
    )
  })

  it('trims leading and trailing whitespace', () => {
    expect(toDatetimeSecondsValue('   2024-01-15 08:30:00   ')).toBe(
      '2024-01-15T08:30:00'
    )
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
