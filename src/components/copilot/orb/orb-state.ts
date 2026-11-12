/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TurnPhase } from '@/lib/copilot'

/**
 * What the orb is showing. It mirrors the assistant, so the officer can tell
 * at a glance whether it is waiting, reading what they type, working, or
 * answering.
 */
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

/** The shape and pace of the orb's surface in one state. */
export interface OrbMotion {
  /** How far the surface rises and falls, as a share of the radius. */
  amplitude: number
  /** How fine the ripples are. */
  frequency: number
  /** How fast the surface flows. */
  speed: number
  /** How much the whole orb breathes in and out. */
  pulse: number
}

export const ORB_MOTION: Record<OrbState, OrbMotion> = {
  idle: { amplitude: 0.07, frequency: 1.1, speed: 0.16, pulse: 0 },
  listening: { amplitude: 0.11, frequency: 1.45, speed: 0.42, pulse: 0.012 },
  thinking: { amplitude: 0.19, frequency: 1.9, speed: 0.95, pulse: 0 },
  speaking: { amplitude: 0.14, frequency: 1.3, speed: 0.62, pulse: 0.035 },
}

/** A still orb: where an idle orb settles once it has been seen. */
export const ORB_AT_REST: OrbMotion = { ...ORB_MOTION.idle, speed: 0 }

/**
 * How long an idle orb keeps moving before it starts to settle. Motion that
 * starts on its own and runs beside other content has to stop within five
 * seconds (WCAG 2.2.2); settling takes about another second at normal frame
 * rates, and `IDLE_STOP_MS` ends it on the clock when frames are slow.
 * After that the orb moves only to say something.
 */
export const IDLE_MOTION_MS = 3500

/** Below this the surface is still to the eye, and drawing can stop. */
export const REST_SPEED = 0.004

/**
 * The hard limit for an idle orb, measured on the clock rather than in
 * frames. Easing is slowed on slow frames, so on its own it could run past
 * five seconds; past this the orb stops wherever it is.
 */
export const IDLE_STOP_MS = 5000

/** The longest step one frame may take, so a stalled tab does not jump. */
export const MAX_FRAME_SECONDS = 0.1

/** The orb's state for what the assistant, and the officer, are doing. */
export function orbStateFor(phase: TurnPhase, typing: boolean): OrbState {
  if (phase === 'thinking') return 'thinking'
  if (phase === 'streaming') return 'speaking'
  return typing ? 'listening' : 'idle'
}

/**
 * Moves a value towards its target by the same share per second whatever the
 * frame rate, so a change of state glides instead of snapping.
 */
export function ease(
  current: number,
  target: number,
  deltaSeconds: number,
  rate = 4
): number {
  return current + (target - current) * (1 - Math.exp(-rate * deltaSeconds))
}

export function easeMotion(
  current: OrbMotion,
  target: OrbMotion,
  deltaSeconds: number
): OrbMotion {
  return {
    amplitude: ease(current.amplitude, target.amplitude, deltaSeconds),
    frequency: ease(current.frequency, target.frequency, deltaSeconds),
    speed: ease(current.speed, target.speed, deltaSeconds),
    pulse: ease(current.pulse, target.pulse, deltaSeconds),
  }
}

export interface MotionStep {
  motion: OrbMotion
  /** How far the surface flows on this frame, in seconds of motion. */
  delta: number
  /** True once the orb is still and drawing can stop. */
  stopped: boolean
}

/**
 * One frame of the orb: eases towards the state's motion and says when an
 * idle orb is done. Whatever the frame rate, an idle orb does not move once
 * `IDLE_STOP_MS` has passed.
 */
export function advanceMotion(
  motion: OrbMotion,
  state: OrbState,
  idleForMs: number,
  elapsedMs: number
): MotionStep {
  if (state === 'idle' && idleForMs >= IDLE_STOP_MS) {
    return { motion: { ...ORB_AT_REST }, delta: 0, stopped: true }
  }
  const resting = state === 'idle' && idleForMs > IDLE_MOTION_MS
  const delta = Math.min(Math.max(elapsedMs, 0) / 1000, MAX_FRAME_SECONDS)
  const next = easeMotion(
    motion,
    resting ? ORB_AT_REST : ORB_MOTION[state],
    delta
  )
  return { motion: next, delta, stopped: resting && next.speed < REST_SPEED }
}
