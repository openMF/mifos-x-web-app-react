/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import type { AxiosError } from 'axios'
import {
  buildPeriodicAccrualPayload,
  getPeriodicAccrualErrorMessage,
  validateAccrueTillDate,
  type FineractApiErrorResponse,
} from '../periodic-accruals.utils'

describe('periodic-accruals.utils', () => {
  describe('validateAccrueTillDate', () => {
    const today = '2026-10-24'

    it('returns error when date is empty or undefined', () => {
      expect(validateAccrueTillDate(undefined, today)).toBe(
        'Accrue Till Date is required.'
      )
      expect(validateAccrueTillDate('', today)).toBe(
        'Accrue Till Date is required.'
      )
      expect(validateAccrueTillDate('   ', today)).toBe(
        'Accrue Till Date is required.'
      )
      expect(validateAccrueTillDate(null, today)).toBe(
        'Accrue Till Date is required.'
      )
    })

    it('returns error when date is in the future', () => {
      expect(validateAccrueTillDate('2026-10-25', today)).toBe(
        'Accrue Till Date cannot be in the future.'
      )
      expect(validateAccrueTillDate('2027-01-01', today)).toBe(
        'Accrue Till Date cannot be in the future.'
      )
    })

    it('returns null when date is today', () => {
      expect(validateAccrueTillDate('2026-10-24', today)).toBeNull()
    })

    it('returns null when date is in the past', () => {
      expect(validateAccrueTillDate('2026-10-23', today)).toBeNull()
      expect(validateAccrueTillDate('2025-01-01', today)).toBeNull()
    })
  })

  describe('buildPeriodicAccrualPayload', () => {
    it('builds standard Fineract payload with default locale and dateFormat', () => {
      const payload = buildPeriodicAccrualPayload('2026-10-24')
      expect(payload).toEqual({
        tillDate: '2026-10-24',
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      })
    })

    it('allows overriding locale and dateFormat if specified', () => {
      const payload = buildPeriodicAccrualPayload(
        '24 October 2026',
        'fr',
        'dd MMMM yyyy'
      )
      expect(payload).toEqual({
        tillDate: '24 October 2026',
        dateFormat: 'dd MMMM yyyy',
        locale: 'fr',
      })
    })
  })

  describe('getPeriodicAccrualErrorMessage', () => {
    it('extracts error from nested errors array defaultUserMessage', () => {
      const mockError = {
        response: {
          data: {
            errors: [
              {
                defaultUserMessage:
                  'Accrual has already been run for this date',
              },
            ],
          },
        },
      } as unknown as AxiosError<FineractApiErrorResponse>

      expect(getPeriodicAccrualErrorMessage(mockError)).toBe(
        'Accrual has already been run for this date'
      )
    })

    it('extracts error from top-level defaultUserMessage', () => {
      const mockError = {
        response: {
          data: {
            defaultUserMessage: 'Invalid transaction parameters',
          },
        },
      } as unknown as AxiosError<FineractApiErrorResponse>

      expect(getPeriodicAccrualErrorMessage(mockError)).toBe(
        'Invalid transaction parameters'
      )
    })

    it('falls back to error.message for standard Error instances', () => {
      const mockError = new Error('Network timeout')
      expect(getPeriodicAccrualErrorMessage(mockError)).toBe('Network timeout')
    })

    it('falls back to default fallback message if no message is present', () => {
      expect(getPeriodicAccrualErrorMessage({})).toBe(
        'Failed to execute periodic accrual accounting.'
      )
      expect(
        getPeriodicAccrualErrorMessage(null, 'Custom fallback error')
      ).toBe('Custom fallback error')
    })
  })
})
