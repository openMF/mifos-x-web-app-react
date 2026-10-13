/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import { getIdleState, idleWarningMs } from '../idle-timeout'

const FIVE_MINUTES = 300_000

describe('idleWarningMs', () => {
  it('warns a minute ahead for the default timeout', () => {
    expect(idleWarningMs(FIVE_MINUTES)).toBe(60_000)
  })

  it('warns in the last quarter of a short timeout', () => {
    expect(idleWarningMs(20_000)).toBe(5_000)
  })
})

describe('getIdleState', () => {
  const start = 1_000_000

  it('is active right after activity', () => {
    expect(getIdleState(start, start, FIVE_MINUTES)).toEqual({
      kind: 'active',
    })
  })

  it('is active until the warning window', () => {
    expect(getIdleState(start + 239_000, start, FIVE_MINUTES)).toEqual({
      kind: 'active',
    })
  })

  it('warns with the whole seconds left in the last minute', () => {
    expect(getIdleState(start + 240_000, start, FIVE_MINUTES)).toEqual({
      kind: 'warning',
      secondsLeft: 60,
    })
    expect(getIdleState(start + 299_100, start, FIVE_MINUTES)).toEqual({
      kind: 'warning',
      secondsLeft: 1,
    })
  })

  it('expires at the timeout', () => {
    expect(getIdleState(start + FIVE_MINUTES, start, FIVE_MINUTES)).toEqual({
      kind: 'expired',
    })
  })

  it('counts activity from another tab', () => {
    // This tab saw nothing for 4.5 minutes, another tab was used 10 s ago
    const now = start + 270_000
    expect(getIdleState(now, now - 10_000, FIVE_MINUTES)).toEqual({
      kind: 'active',
    })
  })

  it('never expires when the timeout is off', () => {
    expect(getIdleState(start + 10 * FIVE_MINUTES, start, 0)).toEqual({
      kind: 'active',
    })
  })
})
