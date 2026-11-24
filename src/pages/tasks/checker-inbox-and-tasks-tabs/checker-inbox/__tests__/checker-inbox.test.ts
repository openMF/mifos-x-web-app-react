/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it, vi } from 'vitest'

import {
  ANY,
  apiErrorMessage,
  checkerInboxQuery,
  emptyFilters,
  filtersError,
  runBulkAction,
} from '../checker-inbox'

const fineractError = (data: unknown) => ({ response: { data } })

describe('checkerInboxQuery', () => {
  it('sends no filters for the empty form', () => {
    expect(checkerInboxQuery(emptyFilters)).toEqual({
      actionName: undefined,
      entityName: undefined,
      resourceId: undefined,
      makerId: undefined,
      makerDateTimeFrom: undefined,
      makerDateTimeTo: undefined,
    })
  })

  it('sends the chosen filters, with ids as numbers', () => {
    expect(
      checkerInboxQuery({
        makerId: '4',
        actionName: 'CREATE',
        entityName: 'CLIENT',
        resourceId: ' 12 ',
        fromDate: '2026-11-01',
        toDate: '2026-11-20',
      })
    ).toEqual({
      actionName: 'CREATE',
      entityName: 'CLIENT',
      resourceId: 12,
      makerId: 4,
      makerDateTimeFrom: '2026-11-01',
      makerDateTimeTo: '2026-11-20',
    })
  })

  it('treats "any" and blank values as no filter', () => {
    const query = checkerInboxQuery({
      ...emptyFilters,
      makerId: ANY,
      resourceId: '   ',
    })
    expect(query.makerId).toBeUndefined()
    expect(query.resourceId).toBeUndefined()
  })
})

describe('filtersError', () => {
  it('accepts an empty or ordered date range', () => {
    expect(filtersError(emptyFilters)).toBeNull()
    expect(
      filtersError({
        ...emptyFilters,
        fromDate: '2026-11-20',
        toDate: '2026-11-20',
      })
    ).toBeNull()
  })

  it('rejects a From Date after the To Date', () => {
    expect(
      filtersError({
        ...emptyFilters,
        fromDate: '2026-11-21',
        toDate: '2026-11-20',
      })
    ).toBe('From Date must be on or before To Date.')
  })
})

describe('apiErrorMessage', () => {
  it('prefers the first validation error', () => {
    expect(
      apiErrorMessage(
        fineractError({
          defaultUserMessage: 'Validation errors exist.',
          errors: [{ defaultUserMessage: 'Maker and checker must differ.' }],
        }),
        'fallback'
      )
    ).toBe('Maker and checker must differ.')
  })

  it('falls back to the general message, then to the given text', () => {
    expect(
      apiErrorMessage(
        fineractError({ defaultUserMessage: 'Not allowed.' }),
        'fallback'
      )
    ).toBe('Not allowed.')
    expect(apiErrorMessage(new Error('Network Error'), 'fallback')).toBe(
      'fallback'
    )
  })
})

describe('runBulkAction', () => {
  it('runs the request for every id in order', async () => {
    const calls: number[] = []
    const request = vi.fn(async (id: number) => {
      calls.push(id)
    })

    const result = await runBulkAction('approve', [62, 63, 64], request)

    expect(calls).toEqual([62, 63, 64])
    expect(result).toEqual({ action: 'approve', succeeded: 3, failed: [] })
  })

  it('keeps going after a failure and reports why it failed', async () => {
    const request = vi.fn(async (id: number) => {
      if (id === 63) {
        throw fineractError({ defaultUserMessage: 'Entry not found.' })
      }
    })

    const result = await runBulkAction('reject', [62, 63, 64], request)

    expect(request).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      action: 'reject',
      succeeded: 2,
      failed: [{ id: 63, message: 'Entry not found.' }],
    })
  })

  it('uses a generic message when Fineract sends none', async () => {
    const result = await runBulkAction('delete', [7], async () => {
      throw new Error('Network Error')
    })

    expect(result.failed).toEqual([
      { id: 7, message: 'Failed to delete the entry.' },
    ])
  })
})
