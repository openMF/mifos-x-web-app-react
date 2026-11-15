/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { memo, type CSSProperties, type ElementType } from 'react'

import { cn } from '@/lib/utils'

export interface TextShimmerProps {
  children: string
  as?: ElementType
  className?: string
  /** Seconds for one sweep. */
  duration?: number
  /** Width of the highlight, in pixels per character. */
  spread?: number
}

/**
 * Text with a light sweeping across it, for "working on it" states. With
 * reduced motion it is plain muted text.
 */
const ShimmerComponent = ({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => (
  <Component
    className={cn(
      'relative inline-block text-muted-foreground',
      'motion-safe:animate-[ai-shimmer_var(--duration)_linear_infinite] motion-safe:bg-[length:250%_100%,auto] motion-safe:bg-clip-text motion-safe:text-transparent',
      'motion-safe:[background-repeat:no-repeat,padding-box]',
      'motion-safe:[background-image:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread))),linear-gradient(var(--color-muted-foreground),var(--color-muted-foreground))]',
      className
    )}
    style={
      {
        '--spread': `${children.length * spread}px`,
        '--duration': `${duration}s`,
      } as CSSProperties
    }
  >
    {children}
  </Component>
)

export const Shimmer = memo(ShimmerComponent)
