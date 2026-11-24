/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import {
  buildRescheduleBatchRequests,
  formatRescheduleDate,
  getApiErrorMessage,
  getBatchErrorMessage,
  getFormattedDate,
  toggleSelectAll,
} from '../reschedule-loan-utils'

describe('reschedule-loan-utils', () => {
  describe('getFormattedDate', () => {
    it('formats a date into dd MMMM yyyy format', () => {
      const fixedDate = new Date(2026, 10, 24) // November 24, 2026
      const formatted = getFormattedDate(fixedDate)
      expect(formatted).toBe('24 November 2026')
    })
  })

  describe('buildRescheduleBatchRequests', () => {
    it('returns empty array when no schedule IDs provided', () => {
      const result = buildRescheduleBatchRequests(
        [],
        'approve',
        '24 November 2026'
      )
      expect(result).toEqual([])
    })

    it('builds approve batch requests with correct url and body', () => {
      const result = buildRescheduleBatchRequests(
        [101, 102],
        'approve',
        '24 November 2026'
      )

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        requestId: 1,
        method: 'POST',
        relativeUrl: 'rescheduleloans/101?command=approve',
        body: JSON.stringify({
          approvedOnDate: '24 November 2026',
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        }),
      })
      expect(result[1]).toEqual({
        requestId: 2,
        method: 'POST',
        relativeUrl: 'rescheduleloans/102?command=approve',
        body: JSON.stringify({
          approvedOnDate: '24 November 2026',
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        }),
      })
    })

    it('builds reject batch requests with correct url and body', () => {
      const result = buildRescheduleBatchRequests(
        [201],
        'reject',
        '24 November 2026'
      )

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        requestId: 1,
        method: 'POST',
        relativeUrl: 'rescheduleloans/201?command=reject',
        body: JSON.stringify({
          rejectedOnDate: '24 November 2026',
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        }),
      })
    })
  })

  describe('toggleSelectAll', () => {
    it('selects all visible items when none currently selected', () => {
      const next = toggleSelectAll([], [1, 2, 3])
      expect(next).toEqual([1, 2, 3])
    })

    it('unselects all visible items when all currently selected', () => {
      const next = toggleSelectAll([1, 2, 3], [1, 2, 3])
      expect(next).toEqual([])
    })

    it('selects all visible items when only partially selected', () => {
      const next = toggleSelectAll([1], [1, 2, 3])
      expect(next.sort()).toEqual([1, 2, 3])
    })

    it('preserves non-visible selected items when unselecting visible items', () => {
      const next = toggleSelectAll([1, 2, 99], [1, 2])
      expect(next).toEqual([99])
    })

    it('ignores null or undefined visible IDs', () => {
      const next = toggleSelectAll([], [1, undefined, null, 2])
      expect(next).toEqual([1, 2])
    })
  })

  describe('getBatchErrorMessage', () => {
    it('returns null when all batch items return 200', () => {
      const err = getBatchErrorMessage(
        [
          { requestId: 1, statusCode: 200, body: '{}' },
          { requestId: 2, statusCode: 200, body: '{}' },
        ],
        'Fallback error'
      )
      expect(err).toBeNull()
    })

    it('extracts errors[0].defaultUserMessage from a failing batch item', () => {
      const err = getBatchErrorMessage(
        [
          {
            requestId: 1,
            statusCode: 403,
            body: JSON.stringify({
              defaultUserMessage: 'Top-level error',
              errors: [{ defaultUserMessage: 'User has no permission' }],
            }),
          },
        ],
        'Fallback error'
      )
      expect(err).toBe('User has no permission')
    })

    it('falls back to top-level defaultUserMessage when errors array is missing', () => {
      const err = getBatchErrorMessage(
        [
          {
            requestId: 1,
            statusCode: 400,
            body: JSON.stringify({
              defaultUserMessage: 'Invalid reschedule state',
            }),
          },
        ],
        'Fallback error'
      )
      expect(err).toBe('Invalid reschedule state')
    })

    it('returns fallback when failing item has non-JSON or empty body', () => {
      const err = getBatchErrorMessage(
        [{ requestId: 1, statusCode: 500, body: 'Internal error' }],
        'Fallback error'
      )
      expect(err).toBe('Fallback error')
    })
  })

  describe('getApiErrorMessage', () => {
    it('extracts Fineract error message from Axios-like error', () => {
      const err = {
        response: {
          data: {
            errors: [{ defaultUserMessage: 'Validation failed' }],
          },
        },
      }
      expect(getApiErrorMessage(err, 'Fallback error')).toBe(
        'Validation failed'
      )
    })

    it('returns fallback when error has no Fineract message', () => {
      expect(getApiErrorMessage(new Error('Network'), 'Fallback error')).toBe(
        'Fallback error'
      )
    })
  })

  describe('formatRescheduleDate', () => {
    it('preserves date-only ISO strings as local calendar dates', () => {
      expect(formatRescheduleDate('2026-12-01', 'en-US')).toBe(
        'December 01, 2026'
      )
    })

    it('formats Fineract date arrays', () => {
      expect(formatRescheduleDate([2026, 12, 1], 'en-US')).toBe(
        'December 01, 2026'
      )
    })

    it('returns fallback for missing or empty values', () => {
      expect(formatRescheduleDate(undefined, 'en-US', '-')).toBe('-')
      expect(formatRescheduleDate('', 'en-US', '-')).toBe('-')
    })
  })
})
