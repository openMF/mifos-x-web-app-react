/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import { attachableOriginators, canChangeOriginators } from '../originators'

describe('canChangeOriginators', () => {
  it('allows changes only while the loan is pending approval', () => {
    expect(canChangeOriginators({ status: { pendingApproval: true } })).toBe(
      true
    )
    expect(canChangeOriginators({ status: { pendingApproval: false } })).toBe(
      false
    )
    expect(canChangeOriginators({})).toBe(false)
    expect(canChangeOriginators(undefined)).toBe(false)
  })
})

describe('attachableOriginators', () => {
  const shop = { id: 1, name: 'ShopCo', status: 'ACTIVE' }
  const broker = { id: 2, name: 'Broker', status: 'ACTIVE' }
  const old = { id: 3, name: 'Old Partner', status: 'INACTIVE' }
  const pending = { id: 4, name: 'New Partner', status: 'PENDING' }

  it('keeps only active originators', () => {
    expect(attachableOriginators([shop, old, pending], [])).toEqual([shop])
  })

  it('leaves out originators already attached to the loan', () => {
    expect(attachableOriginators([shop, broker], [{ id: 1 }])).toEqual([broker])
  })

  it('returns an empty list when nothing is left to attach', () => {
    expect(attachableOriginators([shop, old], [shop])).toEqual([])
    expect(attachableOriginators([], [])).toEqual([])
  })
})
