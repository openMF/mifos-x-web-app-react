/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { OrbScene } from './orb/orb-scene'
import type { OrbState } from './orb/orb-state'

const isDark = () => document.documentElement.classList.contains('dark')

/**
 * The Copilot's presence: a small 3D orb that is calm while it waits, stirs
 * as the officer types, churns while it thinks and breathes while it answers.
 *
 * It is decoration; every state it shows is also said in words elsewhere.
 * three.js loads on its own after the panel is on screen, and a still
 * gradient stands in until then, and for good where WebGL is unavailable.
 */
export function CopilotOrb({
  state,
  size,
  className,
}: {
  state: OrbState
  /** Edge of the orb's square, in CSS pixels. */
  size: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<OrbScene | null>(null)
  const stateRef = useRef(state)
  const [live, setLive] = useState(false)

  useEffect(() => {
    stateRef.current = state
    sceneRef.current?.setState(state)
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let scene: OrbScene | undefined

    void import('./orb/orb-scene')
      .then(({ createOrbScene }) => {
        if (cancelled) return
        scene = createOrbScene(canvas, {
          size,
          state: stateRef.current,
          dark: isDark(),
          animate: !window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches,
          onContextLost: () => setLive(false),
        })
        sceneRef.current = scene
        setLive(true)
      })
      // No WebGL, or the chunk did not load: the still gradient stays.
      .catch(() => undefined)

    // The app switches theme by toggling a class on <html>.
    const theme = new MutationObserver(() => scene?.setDark(isDark()))
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      cancelled = true
      theme.disconnect()
      scene?.dispose()
      sceneRef.current = null
    }
  }, [size])

  const busy = state === 'thinking' || state === 'speaking'

  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: size, height: size }}
      onPointerEnter={() => sceneRef.current?.wake()}
    >
      {/* A soft halo that brightens while the assistant is busy. Its
          spread follows the orb's size, so a small orb keeps a small glow. */}
      <span
        style={{ filter: `blur(${Math.round(size * 0.16)}px)` }}
        className={cn(
          'absolute inset-[10%] rounded-full bg-[#1074b9] transition-opacity duration-700 dark:bg-sky-400',
          busy ? 'opacity-45' : 'opacity-20'
        )}
      />
      <span
        className={cn(
          'absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_35%_28%,#9bd6f7,#1074b9_55%,#0a4f85)] transition-opacity duration-500',
          live && 'opacity-0'
        )}
      />
      <canvas
        // A canvas whose context was released cannot be drawn on again.
        key={size}
        ref={canvasRef}
        className={cn(
          'absolute inset-0 size-full transition-opacity duration-500',
          live ? 'opacity-100' : 'opacity-0'
        )}
      />
    </span>
  )
}
