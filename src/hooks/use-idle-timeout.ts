/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { getIdleState } from '@/lib/idle-timeout'

/** Shared by every tab, so activity in one keeps the others signed in too */
const LAST_ACTIVITY_KEY = 'mifosLastActivity'

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
] as const

const readLastActivity = () => {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0
  } catch {
    return 0
  }
}

const writeLastActivity = (time: number) => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(time))
  } catch {
    // Storage can be unavailable (private mode); this tab still times out on its own
  }
}

/**
 * Signs the user out after `timeoutMs` without activity in any tab, the
 * session idle timeout of the Angular web app. Shortly before that it reports
 * the seconds left, so the caller can warn and offer to stay signed in.
 * A timeout of 0 turns it off.
 */
export const useIdleTimeout = (timeoutMs: number, onTimeout: () => void) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const warningRef = useRef(false)
  const lastWriteRef = useRef(0)
  const timedOutRef = useRef(false)
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const markActive = useCallback(() => {
    const now = Date.now()
    // Movement fires constantly; one write a second is plenty
    if (now - lastWriteRef.current < 1000) return
    lastWriteRef.current = now
    writeLastActivity(now)
  }, [])

  const staySignedIn = useCallback(() => {
    lastWriteRef.current = 0
    markActive()
    warningRef.current = false
    setSecondsLeft(null)
  }, [markActive])

  useEffect(() => {
    if (timeoutMs <= 0) return
    timedOutRef.current = false
    lastWriteRef.current = 0
    markActive()

    // Once the warning shows, only the explicit "stay" choice counts, so a
    // stray mouse movement does not silently dismiss it
    const onActivity = () => {
      if (!warningRef.current) markActive()
    }
    ACTIVITY_EVENTS.forEach(e =>
      document.addEventListener(e, onActivity, { passive: true })
    )

    const tick = () => {
      if (timedOutRef.current) return
      const state = getIdleState(Date.now(), readLastActivity(), timeoutMs)
      if (state.kind === 'expired') {
        timedOutRef.current = true
        warningRef.current = false
        setSecondsLeft(null)
        onTimeoutRef.current()
      } else if (state.kind === 'warning') {
        warningRef.current = true
        setSecondsLeft(state.secondsLeft)
      } else if (warningRef.current) {
        // Another tab was used, which keeps this one signed in as well
        warningRef.current = false
        setSecondsLeft(null)
      }
    }
    const interval = window.setInterval(tick, 1000)

    return () => {
      window.clearInterval(interval)
      ACTIVITY_EVENTS.forEach(e => document.removeEventListener(e, onActivity))
    }
  }, [timeoutMs, markActive])

  return { secondsLeft, staySignedIn }
}
