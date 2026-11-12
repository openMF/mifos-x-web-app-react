/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConversationProps = ComponentProps<typeof StickToBottom>

/** Scrolls to the newest message, unless the reader has scrolled up. */
export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-hidden', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
)

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn('flex flex-col gap-6 p-4', className)}
    {...props}
  />
)

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
  title?: string
  description?: string
  icon?: ReactNode
}

export const ConversationEmptyState = ({
  className,
  title,
  description,
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      'flex size-full flex-col items-center justify-center gap-3 p-8 text-center',
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </>
    )}
  </div>
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button> & {
  /** Accessible name; the button shows only an arrow. */
  label: string
}

export const ConversationScrollButton = ({
  className,
  label,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  if (isAtBottom) return null
  return (
    <Button
      className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-sm dark:bg-background dark:hover:bg-muted',
        className
      )}
      onClick={() => void scrollToBottom()}
      size="icon"
      type="button"
      variant="outline"
      aria-label={label}
      title={label}
      {...props}
    >
      <ArrowDownIcon className="size-4" aria-hidden="true" />
    </Button>
  )
}
