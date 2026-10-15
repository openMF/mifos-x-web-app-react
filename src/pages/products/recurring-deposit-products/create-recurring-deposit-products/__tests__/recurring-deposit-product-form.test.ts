/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import {
  getSlabRangeError,
  type ChartSlabForm,
} from '../recurring-deposit-product-form'

const slab = (fields: Partial<ChartSlabForm>): ChartSlabForm => ({
  periodType: 2,
  annualInterestRate: 5,
  description: '',
  ...fields,
})

describe('getSlabRangeError', () => {
  it('accepts periods that follow on from each other', () => {
    const slabs = [
      slab({ fromPeriod: 1, toPeriod: 6 }),
      slab({ fromPeriod: 7, toPeriod: 12 }),
      slab({ fromPeriod: 13 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBeNull()
  })

  it('finds a gap between periods', () => {
    const slabs = [
      slab({ fromPeriod: 1, toPeriod: 6 }),
      slab({ fromPeriod: 8, toPeriod: 12 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBe('gap')
  })

  it('finds overlapping periods, whatever order they are entered in', () => {
    const slabs = [
      slab({ fromPeriod: 6, toPeriod: 12 }),
      slab({ fromPeriod: 1, toPeriod: 6 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBe('overlap')
  })

  it('treats a slab with no end as covering everything after it', () => {
    const slabs = [slab({ fromPeriod: 1 }), slab({ fromPeriod: 7 })]
    expect(getSlabRangeError(slabs, false)).toBe('overlap')
  })

  it('needs the same period type on every slab', () => {
    const slabs = [
      slab({ fromPeriod: 1, toPeriod: 6 }),
      slab({ periodType: 1, fromPeriod: 7 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBe('periodTypeMismatch')
  })

  it('checks the amount ranges inside each period group', () => {
    const valid = [
      slab({
        fromPeriod: 1,
        toPeriod: 6,
        amountRangeFrom: 1,
        amountRangeTo: 100,
      }),
      slab({ fromPeriod: 1, toPeriod: 6, amountRangeFrom: 101 }),
    ]
    expect(getSlabRangeError(valid, false)).toBeNull()
    const gap = [
      slab({
        fromPeriod: 1,
        toPeriod: 6,
        amountRangeFrom: 1,
        amountRangeTo: 100,
      }),
      slab({ fromPeriod: 1, toPeriod: 6, amountRangeFrom: 150 }),
    ]
    expect(getSlabRangeError(gap, false)).toBe('gap')
  })

  it('finds an overlap when one slab in a group has no amount range', () => {
    const slabs = [
      slab({ fromPeriod: 1, toPeriod: 6 }),
      slab({ fromPeriod: 1, toPeriod: 6, amountRangeFrom: 1 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBe('overlap')
  })

  it('groups by amount first when the chart says so', () => {
    const slabs = [
      slab({ periodType: undefined, amountRangeFrom: 1, amountRangeTo: 1000 }),
      slab({ periodType: undefined, amountRangeFrom: 1001 }),
    ]
    expect(getSlabRangeError(slabs, true)).toBeNull()
    expect(
      getSlabRangeError(
        [slabs[0], { ...slabs[1], amountRangeFrom: 1002 }],
        true
      )
    ).toBe('gap')
  })

  it('compares decimal amounts exactly', () => {
    const slabs = [
      slab({ fromPeriod: 1, amountRangeFrom: 0.1, amountRangeTo: 1000.33 }),
      slab({ fromPeriod: 1, amountRangeFrom: 1001.33 }),
    ]
    expect(getSlabRangeError(slabs, false)).toBeNull()
    expect(
      getSlabRangeError(
        [slabs[0], { ...slabs[1], amountRangeFrom: 1000.34 }],
        false
      )
    ).toBe('gap')
  })
})
