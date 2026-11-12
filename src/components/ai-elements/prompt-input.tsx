/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  useCallback,
  useState,
  type ComponentProps,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEventHandler,
} from 'react'
import {
  CornerDownLeftIcon,
  Loader2Icon,
  SquareIcon,
  XIcon,
} from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface PromptInputMessage {
  text: string
}

export type PromptInputProps = Omit<
  HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void
}

/**
 * The message box. The caller owns the text: it decides whether a message
 * was accepted and the box should clear.
 */
export const PromptInput = ({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const text = new FormData(event.currentTarget).get('message')
      onSubmit({ text: typeof text === 'string' ? text : '' }, event)
    },
    [onSubmit]
  )

  return (
    <form
      className={cn('w-full', className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <InputGroup className="overflow-hidden">{children}</InputGroup>
    </form>
  )
}

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>

export const PromptInputBody = ({
  className,
  ...props
}: PromptInputBodyProps) => (
  <div className={cn('contents', className)} {...props} />
)

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>

/** Enter sends; Shift+Enter, or Enter while an IME is composing, does not. */
export const PromptInputTextarea = ({
  onKeyDown,
  className,
  ...props
}: PromptInputTextareaProps) => {
  const [isComposing, setIsComposing] = useState(false)

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    event => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key !== 'Enter' || event.shiftKey) return
      if (isComposing || event.nativeEvent.isComposing) return
      event.preventDefault()

      const { form } = event.currentTarget
      const submit = form?.querySelector<HTMLButtonElement>(
        'button[type="submit"]'
      )
      if (submit?.disabled) return
      form?.requestSubmit()
    },
    [onKeyDown, isComposing]
  )

  return (
    <InputGroupTextarea
      className={cn('field-sizing-content max-h-48 min-h-12', className)}
      name="message"
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export type PromptInputFooterProps = Omit<
  ComponentProps<typeof InputGroupAddon>,
  'align'
>

export const PromptInputFooter = ({
  className,
  ...props
}: PromptInputFooterProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn('justify-between gap-1', className)}
    {...props}
  />
)

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn('flex min-w-0 items-center gap-1', className)}
    {...props}
  />
)

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus
  onStop?: () => void
  /** Accessible names for the two jobs the button does. */
  labels: { submit: string; stop: string }
}

/** Sends, or while a reply is coming, stops it. */
export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon-sm',
  status,
  onStop,
  onClick,
  labels,
  children,
  ...props
}: PromptInputSubmitProps) => {
  const isGenerating = status === 'submitted' || status === 'streaming'

  let icon = <CornerDownLeftIcon className="size-4" aria-hidden="true" />
  if (status === 'submitted' && !onStop) {
    icon = (
      <Loader2Icon
        className="size-4 motion-safe:animate-spin"
        aria-hidden="true"
      />
    )
  } else if (isGenerating) {
    icon = <SquareIcon className="size-3.5 fill-current" aria-hidden="true" />
  } else if (status === 'error') {
    icon = <XIcon className="size-4" aria-hidden="true" />
  }

  const label = isGenerating ? labels.stop : labels.submit

  return (
    <InputGroupButton
      aria-label={label}
      title={label}
      className={cn(className)}
      onClick={event => {
        if (isGenerating && onStop) {
          event.preventDefault()
          onStop()
          return
        }
        onClick?.(event)
      }}
      size={size}
      type={isGenerating && onStop ? 'button' : 'submit'}
      variant={variant}
      {...props}
    >
      {children ?? icon}
    </InputGroupButton>
  )
}
