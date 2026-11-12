/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Panel as PanelPrimitive } from '@xyflow/react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type PanelProps = ComponentProps<typeof PanelPrimitive>

export const Panel = ({ className, ...props }: PanelProps) => (
  <PanelPrimitive
    className={cn(
      'm-4 overflow-hidden rounded-md border bg-card p-1',
      className
    )}
    {...props}
  />
)
