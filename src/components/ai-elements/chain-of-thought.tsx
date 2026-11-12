/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  memo,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react'
import { BrainIcon, ChevronDownIcon, DotIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export type ChainOfThoughtProps = ComponentProps<typeof Collapsible>

/** What the assistant did, folded into one line until opened. */
export const ChainOfThought = memo(
  ({ className, ...props }: ChainOfThoughtProps) => (
    <Collapsible
      className={cn('not-prose group/cot w-full', className)}
      {...props}
    />
  )
)

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  /** Defaults to upstream's brain. */
  icon?: ComponentType<{ className?: string }>
}

export const ChainOfThoughtHeader = memo(
  ({
    className,
    children,
    icon: Icon = BrainIcon,
    ...props
  }: ChainOfThoughtHeaderProps) => (
    <CollapsibleTrigger
      className={cn(
        'flex w-fit max-w-full items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-left">{children}</span>
      <ChevronDownIcon
        className="size-4 shrink-0 transition-transform group-data-[state=open]/cot:rotate-180"
        aria-hidden="true"
      />
    </CollapsibleTrigger>
  )
)

export type ChainOfThoughtStepProps = ComponentProps<'div'> & {
  icon?: ComponentType<{ className?: string }>
  label: ReactNode
  description?: ReactNode
  status?: 'complete' | 'active' | 'pending'
}

const stepStatusStyles = {
  active: 'text-foreground',
  complete: 'text-muted-foreground',
  pending: 'text-muted-foreground/50',
}

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = 'complete',
    children,
    ...props
  }: ChainOfThoughtStepProps) => (
    <div
      className={cn(
        'flex gap-2 text-sm',
        stepStatusStyles[status],
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2',
        className
      )}
      {...props}
    >
      <div className="relative mt-0.5">
        <Icon className="size-4" aria-hidden="true" />
        <div className="absolute top-6 -bottom-3 left-1/2 -mx-px w-px bg-border in-[li:last-child]:hidden" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div>{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
        {children}
      </div>
    </div>
  )
)

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => (
    <CollapsibleContent
      className={cn(
        'mt-3 space-y-3 text-popover-foreground outline-none',
        'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:slide-out-to-top-2 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-top-2',
        className
      )}
      {...props}
    >
      {children}
    </CollapsibleContent>
  )
)

ChainOfThought.displayName = 'ChainOfThought'
ChainOfThoughtHeader.displayName = 'ChainOfThoughtHeader'
ChainOfThoughtStep.displayName = 'ChainOfThoughtStep'
ChainOfThoughtContent.displayName = 'ChainOfThoughtContent'
