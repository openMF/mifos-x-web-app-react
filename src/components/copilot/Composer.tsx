/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState, type Ref } from 'react'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { InputGroupAddon } from '@/components/ui/input-group'
import { MAX_INPUT_LENGTH } from '@/lib/copilot'
import type { SendResult } from '@/hooks/use-copilot-chat'

/** Shown once a message gets close to the limit, not before. */
const COUNTER_FROM = MAX_INPUT_LENGTH - 100

export function Composer({
  ref,
  busy,
  onSend,
  onStop,
  onTypingChange,
}: {
  ref?: Ref<HTMLTextAreaElement>
  busy: boolean
  onSend: (text: string) => SendResult
  onStop: () => void
  /** Told when a draft appears in the box, and when it is gone again. */
  onTypingChange?: (typing: boolean) => void
}) {
  const { t } = useTranslation('copilot')
  const [text, setText] = useState('')
  const [blocked, setBlocked] = useState<
    'invalid_length' | 'injection_detected' | null
  >(null)

  const typing = text.trim().length > 0
  useEffect(() => onTypingChange?.(typing), [typing, onTypingChange])

  const submit = () => {
    if (busy || !text.trim()) return
    const result = onSend(text)
    if (result.sent) {
      setText('')
      setBlocked(null)
    } else if (result.reason !== 'busy') {
      // The text stays, so the officer can fix it rather than retype it.
      setBlocked(result.reason)
    }
  }

  return (
    <div className="space-y-2">
      {blocked && (
        <p role="alert" className="text-sm text-destructive">
          {t(
            blocked === 'injection_detected'
              ? 'errors.injectionBlocked'
              : 'errors.invalidLength'
          )}
        </p>
      )}
      <PromptInput
        onSubmit={submit}
        // One rounded row, send button inside: the border darkens on hover
        // and turns Mifos blue while typing.
        className="[&_[data-slot=input-group]]:h-auto [&_[data-slot=input-group]]:items-end [&_[data-slot=input-group]]:rounded-2xl [&_[data-slot=input-group]]:border-zinc-300 [&_[data-slot=input-group]]:bg-white [&_[data-slot=input-group]]:shadow-[0_2px_16px_rgb(0_0_0/0.07)] [&_[data-slot=input-group]]:transition-[border-color,box-shadow] dark:[&_[data-slot=input-group]]:border-zinc-600 dark:[&_[data-slot=input-group]]:bg-zinc-800/80 [&_[data-slot=input-group]:hover]:border-zinc-400 [&_[data-slot=input-group]:has(textarea:focus-visible)]:border-[#1074b9] [&_[data-slot=input-group]:has(textarea:focus-visible)]:ring-[#1074b9]/20"
      >
        <PromptInputBody>
          <PromptInputTextarea
            ref={ref}
            value={text}
            onChange={event => {
              setText(event.target.value)
              if (blocked) setBlocked(null)
            }}
            maxLength={MAX_INPUT_LENGTH}
            rows={1}
            aria-label={t('input.label')}
            aria-invalid={blocked ? true : undefined}
            placeholder={t('input.placeholder')}
            // Starts one line tall and grows with the message.
            className="min-h-12 py-3.5 pr-1 pl-4 text-sm placeholder:text-zinc-400"
          />
        </PromptInputBody>
        <InputGroupAddon
          align="inline-end"
          className="py-2 pr-2 has-[>button]:mr-0"
        >
          <PromptInputSubmit
            status={busy ? 'streaming' : 'ready'}
            onStop={onStop}
            disabled={!busy && !text.trim()}
            labels={{ submit: t('input.send'), stop: t('input.stop') }}
            className="rounded-full bg-[#1074b9] text-white hover:bg-[#1074c9] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:opacity-100 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            {busy ? undefined : (
              <ArrowUp className="size-4" aria-hidden="true" />
            )}
          </PromptInputSubmit>
        </InputGroupAddon>
      </PromptInput>
      {text.length >= COUNTER_FROM && (
        <p
          className="px-1 text-right text-xs text-zinc-500 dark:text-zinc-400"
          aria-live="polite"
        >
          {t('input.counter', { count: text.length, max: MAX_INPUT_LENGTH })}
        </p>
      )}
    </div>
  )
}
