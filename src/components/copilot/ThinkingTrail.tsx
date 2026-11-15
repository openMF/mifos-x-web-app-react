/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react'
import { Check, CircleSlash, ListChecks, Loader2, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Shimmer } from '@/components/ai-elements/shimmer'
import type { CopilotMessage, ToolStep } from '@/lib/copilot'
import { elapsedSeconds } from './copilot-ui'

/**
 * What the assistant did for one answer, in two parts.
 *
 * Reasoning: the model's own thinking. It opens while the model thinks and
 * folds itself away when it is done; the notes are labelled as notes and
 * never mixed with the answer. Chain of thought: the steps it took, such as
 * reading a loan, with the one in flight named, so a model reading three
 * accounts never looks like one stuck on the first.
 */
export function ThinkingTrail({
  message,
  live,
}: {
  message: CopilotMessage
  /** True while this answer's turn is still running. */
  live: boolean
}) {
  const { t, i18n } = useTranslation('copilot')
  const [stepsOpen, setStepsOpen] = useState(false)
  const { steps, reasoning, reasoningElapsedMs } = message

  // Thinking until the model says it is done, or starts working or answering.
  const thinking =
    live &&
    reasoningElapsedMs === undefined &&
    steps.length === 0 &&
    !message.text
  const inFlight = live ? steps.find(step => !step.done) : undefined

  const formatSeconds = (seconds: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'long',
    }).format(seconds)

  return (
    <>
      {(thinking || reasoning) && (
        <Reasoning
          isStreaming={thinking}
          duration={
            reasoningElapsedMs ? elapsedSeconds(reasoningElapsedMs) : undefined
          }
          className="mb-0"
        >
          <ReasoningTrigger
            getThinkingMessage={(streaming, duration) =>
              streaming ? (
                <Shimmer as="span" duration={1}>
                  {t('trail.thinking')}
                </Shimmer>
              ) : (
                <span>
                  {duration
                    ? t('trail.thoughtFor', {
                        seconds: formatSeconds(duration),
                      })
                    : t('trail.thoughtBriefly')}
                </span>
              )
            }
            className="w-fit"
          />
          {reasoning && (
            <ReasoningContent
              className="mt-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5"
              note={
                <div className="mb-2">
                  <p className="font-medium text-foreground">
                    {t('trail.notes')}
                  </p>
                  <p className="mt-1 text-xs italic">
                    {t('trail.notesCaution')}
                  </p>
                </div>
              }
            >
              {reasoning}
            </ReasoningContent>
          )}
        </Reasoning>
      )}

      {steps.length > 0 && (
        <ChainOfThought
          open={Boolean(inFlight) || stepsOpen}
          onOpenChange={setStepsOpen}
        >
          <ChainOfThoughtHeader icon={ListChecks}>
            {inFlight ? (
              <Shimmer as="span" duration={1.5}>
                {inFlight.label}
              </Shimmer>
            ) : (
              t('trail.stepCount', { count: steps.length })
            )}
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <Steps steps={steps} live={live} />
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}
    </>
  )
}

function Steps({ steps, live }: { steps: ToolStep[]; live: boolean }) {
  const { t } = useTranslation('copilot')
  return (
    <ul className="space-y-3" aria-label={t('trail.steps')}>
      {steps.map(step => {
        // A step still open when its turn ended was cut short: it is not
        // running any more, and it may not have finished.
        const stopped = !step.done && !live
        return (
          <li key={step.id}>
            <ChainOfThoughtStep
              status={step.done ? 'complete' : stopped ? 'pending' : 'active'}
              icon={
                step.done
                  ? step.readOnly
                    ? Check
                    : PenLine
                  : stopped
                    ? CircleSlash
                    : SpinningLoader
              }
              // A write is marked apart from a read: that matters on an account.
              className={
                step.readOnly ? undefined : 'text-amber-700 dark:text-amber-400'
              }
              label={
                <span className="flex flex-wrap items-center gap-2">
                  {step.label}
                  {!step.readOnly && (
                    <span className="rounded border border-current px-1 text-xs">
                      {step.done
                        ? t('trail.wrote')
                        : stopped
                          ? t('trail.writeStopped')
                          : t('trail.writing')}
                    </span>
                  )}
                  {step.readOnly && stopped && (
                    <span className="text-xs">{t('trail.stopped')}</span>
                  )}
                </span>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}

function SpinningLoader({ className }: { className?: string }) {
  return (
    <Loader2
      className={`${className ?? ''} motion-safe:animate-spin`}
      aria-hidden="true"
    />
  )
}
