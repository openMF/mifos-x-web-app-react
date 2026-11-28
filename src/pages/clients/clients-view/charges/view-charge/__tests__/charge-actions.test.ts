/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import {
  canDeleteCharge,
  canPayCharge,
  canWaiveCharge,
} from '../charge-actions'

describe('canPayCharge', () => {
  it('returns false when charge is undefined', () => {
    expect(canPayCharge(undefined)).toBe(false)
  })

  it('returns false when charge is already waived or paid', () => {
    expect(canPayCharge({ isWaived: true, isPaid: false })).toBe(false)
    expect(canPayCharge({ isWaived: false, isPaid: true })).toBe(false)
  })

  it('returns true when charge is neither waived nor paid', () => {
    expect(canPayCharge({ isWaived: false, isPaid: false })).toBe(true)
    expect(canPayCharge({})).toBe(true)
  })
})

describe('canWaiveCharge', () => {
  it('returns false when charge is undefined or null', () => {
    expect(canWaiveCharge(undefined)).toBe(false)
  })

  it('returns false when charge is already waived', () => {
    expect(canWaiveCharge({ isWaived: true, isPaid: false })).toBe(false)
  })

  it('returns false when charge is already paid', () => {
    expect(canWaiveCharge({ isWaived: false, isPaid: true })).toBe(false)
  })

  it('returns true when charge is neither waived nor paid', () => {
    expect(canWaiveCharge({ isWaived: false, isPaid: false })).toBe(true)
    expect(canWaiveCharge({})).toBe(true)
  })
})

describe('canDeleteCharge', () => {
  it('returns false when charge is undefined or null', () => {
    expect(canDeleteCharge(undefined)).toBe(false)
  })

  it('returns false when charge is already waived or paid', () => {
    expect(canDeleteCharge({ isWaived: true, isPaid: false })).toBe(false)
    expect(canDeleteCharge({ isWaived: false, isPaid: true })).toBe(false)
  })

  it('returns false when charge has partial payments (amountPaid > 0)', () => {
    expect(
      canDeleteCharge({ isWaived: false, isPaid: false, amountPaid: 25 })
    ).toBe(false)
  })

  it('returns true when charge has no payments and is not waived', () => {
    expect(
      canDeleteCharge({ isWaived: false, isPaid: false, amountPaid: 0 })
    ).toBe(true)
    expect(canDeleteCharge({ isWaived: false, isPaid: false })).toBe(true)
  })
})
