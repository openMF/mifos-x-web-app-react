/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import {
  IDLE_MOTION_MS,
  ORB_AT_REST,
  ORB_MOTION,
  REST_SPEED,
  ease,
  easeMotion,
  orbStateFor,
} from '../orb/orb-state'

describe('orbStateFor', () => {
  it('follows the assistant while a turn runs, whatever is being typed', () => {
    expect(orbStateFor('thinking', false)).toBe('thinking')
    expect(orbStateFor('thinking', true)).toBe('thinking')
    expect(orbStateFor('streaming', true)).toBe('speaking')
  })

  it('listens while there is a draft, and idles otherwise', () => {
    expect(orbStateFor('idle', true)).toBe('listening')
    expect(orbStateFor('idle', false)).toBe('idle')
    expect(orbStateFor('error', false)).toBe('idle')
    expect(orbStateFor('awaitingApproval', false)).toBe('idle')
  })
})

describe('ease', () => {
  it('moves towards the target without passing it', () => {
    const next = ease(0, 1, 0.1)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
    expect(ease(0, 1, 60)).toBeCloseTo(1, 6)
  })

  it('covers the same ground in one long frame as in many short ones', () => {
    let stepped = 0
    for (let i = 0; i < 10; i++) stepped = ease(stepped, 1, 0.016)
    expect(stepped).toBeCloseTo(ease(0, 1, 0.16), 6)
  })

  it('does not move when no time has passed', () => {
    expect(ease(0.3, 1, 0)).toBe(0.3)
  })
})

describe('orb motion', () => {
  it('is busiest while thinking and calmest while idle', () => {
    for (const key of ['amplitude', 'frequency', 'speed'] as const) {
      expect(ORB_MOTION.thinking[key]).toBeGreaterThan(ORB_MOTION.idle[key])
      expect(ORB_MOTION.listening[key]).toBeGreaterThan(ORB_MOTION.idle[key])
    }
  })

  it('comes to a stop at rest, within the five seconds WCAG 2.2.2 allows', () => {
    expect(IDLE_MOTION_MS).toBeLessThanOrEqual(5000)
    expect(ORB_AT_REST.speed).toBe(0)

    // From idle, the surface is still well within a couple of seconds.
    let motion = ORB_MOTION.idle
    for (let i = 0; i < 120; i++)
      motion = easeMotion(motion, ORB_AT_REST, 1 / 60)
    expect(motion.speed).toBeLessThan(REST_SPEED)
    // Only the flow stops; the shape it settles into is the idle one.
    expect(motion.amplitude).toBeCloseTo(ORB_MOTION.idle.amplitude, 6)
  })
})
