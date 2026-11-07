/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** How long before the sign-out the warning shows: a minute, or less for short timeouts */
export const idleWarningMs = (timeoutMs: number) =>
  Math.min(60_000, Math.floor(timeoutMs / 4))

export type IdleState =
  | { kind: 'active' }
  | { kind: 'warning'; secondsLeft: number }
  | { kind: 'expired' }

/**
 * Where a session stands `now`, given the last activity in any tab. A
 * timeout of 0 or less means the idle timeout is off.
 */
export const getIdleState = (
  now: number,
  lastActivity: number,
  timeoutMs: number
): IdleState => {
  if (timeoutMs <= 0) return { kind: 'active' }
  const remaining = timeoutMs - (now - lastActivity)
  if (remaining <= 0) return { kind: 'expired' }
  if (remaining <= idleWarningMs(timeoutMs))
    return { kind: 'warning', secondsLeft: Math.ceil(remaining / 1000) }
  return { kind: 'active' }
}
