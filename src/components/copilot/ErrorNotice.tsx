/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CircleAlert, Clock, LogIn, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { CopilotMessage } from '@/lib/copilot'
import { cn } from '@/lib/utils'
import {
  errorMessageKey,
  errorPresentation,
  type ErrorTone,
} from './copilot-ui'

const TONES: Record<
  ErrorTone,
  { icon: typeof Clock; box: string; badge: string; button: string }
> = {
  // Temporary: calm, because waiting is the fix.
  wait: {
    icon: Clock,
    box: 'border-amber-300/70 bg-amber-50/70 dark:border-amber-400/25 dark:bg-amber-400/10',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    button:
      'border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-400/40 dark:text-amber-200 dark:hover:bg-amber-400/15',
  },
  // Mifos blue: an ordinary step for the officer, not a fault.
  signIn: {
    icon: LogIn,
    box: 'border-[#1074b9]/25 bg-sky-50/70 dark:border-sky-400/25 dark:bg-sky-400/10',
    badge:
      'bg-[#1074b9]/10 text-[#1074b9] dark:bg-sky-400/15 dark:text-sky-300',
    button:
      'border-[#1074b9]/30 text-[#1074b9] hover:bg-[#1074b9]/10 hover:text-[#1074b9] dark:border-sky-400/40 dark:text-sky-300 dark:hover:bg-sky-400/15',
  },
  blocked: {
    icon: CircleAlert,
    box: 'border-red-300/70 bg-red-50/70 dark:border-red-400/25 dark:bg-red-400/10',
    badge: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
    button:
      'border-red-300 text-red-800 hover:bg-red-100 hover:text-red-900 dark:border-red-400/40 dark:text-red-200 dark:hover:bg-red-400/15',
  },
}

/**
 * Why an answer stopped: a short title to scan, the detail, and the one
 * thing that may help. Its colour follows how serious it is, so "busy, try
 * again" never looks like a failure on the account.
 */
export function ErrorNotice({
  error,
  onRetry,
}: {
  error: NonNullable<CopilotMessage['error']>
  /** Shown only when asking again may work. */
  onRetry?: () => void
}) {
  const { t } = useTranslation('copilot')
  const { tone, titleKey } = errorPresentation(error.code, error.retryable)
  const style = TONES[tone]
  const Icon = style.icon

  return (
    <div
      role="alert"
      data-tone={tone}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-sm',
        style.box
      )}
    >
      <span
        className={cn(
          'mt-px grid size-7 shrink-0 place-items-center rounded-full',
          style.badge
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="leading-6 font-semibold text-zinc-900 dark:text-zinc-50">
          {t(titleKey)}
        </p>
        <p className="mt-0.5 leading-5 text-zinc-700 dark:text-zinc-300">
          {error.message ||
            t(errorMessageKey(error.code, error.outcomeUnknown))}
        </p>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className={cn(
              'mt-2.5 h-8 rounded-full bg-transparent px-3 shadow-none dark:bg-transparent',
              style.button
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('retry')}
          </Button>
        )}
      </div>
    </div>
  )
}
