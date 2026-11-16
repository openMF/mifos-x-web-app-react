/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { memo, useEffect, useState } from 'react'
import { AlertCircle, Check, Copy, RotateCcw, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import MifosLogo from '@/assets/images/MifosX_logo.png'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { Button } from '@/components/ui/button'
import {
  isTurnActive,
  type ApprovalRequest,
  type CopilotMessage,
  type CopilotThread,
  type DisplayCard,
} from '@/lib/copilot'
import { cn } from '@/lib/utils'
import { AiBadge } from './AiBadge'
import { CopilotOrb } from './CopilotOrb'
import { errorMessageKey, groupTurns, visibleText } from './copilot-ui'
import { ThinkingTrail } from './ThinkingTrail'

export function MessageList({
  thread,
  onAsk,
}: {
  thread: CopilotThread
  /** Send a question: a suggestion chip, or the last question again. */
  onAsk: (text: string) => void
}) {
  const { t } = useTranslation('copilot')
  const active = isTurnActive(thread.phase)
  const last = thread.messages[thread.messages.length - 1]

  return (
    <>
      {groupTurns(thread.messages).map(turn => {
        const newest = turn.answers[turn.answers.length - 1]
        return (
          <MessageBranch
            // A new answer remounts the turn, so it opens on that answer.
            key={`${turn.question?.id ?? turn.answers[0].id}-${turn.answers.length}`}
            defaultBranch={Math.max(0, turn.answers.length - 1)}
            className="gap-4"
          >
            {turn.question && <UserMessage text={turn.question.text} />}
            {turn.answers.length > 0 && (
              <MessageBranchContent>
                {turn.answers.map(message => (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    live={message.streaming && active}
                    retryPrompt={
                      message === last && message.error?.retryable
                        ? thread.lastPrompt
                        : undefined
                    }
                    askAgainPrompt={
                      message === newest &&
                      message === last &&
                      thread.phase === 'idle' &&
                      !message.error
                        ? turn.question?.text
                        : undefined
                    }
                    onAsk={onAsk}
                    answerCount={turn.answers.length}
                    showSuggestions={
                      message === last && thread.phase === 'idle'
                    }
                    branchLabels={{
                      previous: t('branch.previous'),
                      next: t('branch.next'),
                    }}
                  />
                ))}
              </MessageBranchContent>
            )}
          </MessageBranch>
        )
      })}
      {thread.phase === 'awaitingApproval' && thread.pendingApproval && (
        <ApprovalNote approval={thread.pendingApproval} />
      )}
    </>
  )
}

/** A new message rises into place. */
const ARRIVE =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300'

const WORD_FADE = { animation: 'fadeIn', duration: 260 } as const

const UserMessage = memo(function UserMessage({ text }: { text: string }) {
  const { t } = useTranslation('copilot')
  return (
    <Message from="user" className={ARRIVE}>
      <MessageContent className="group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-[#1074b9] group-[.is-user]:px-3.5 group-[.is-user]:py-2 group-[.is-user]:text-white group-[.is-user]:shadow-sm">
        <p className="whitespace-pre-wrap break-words">
          <span className="sr-only">{t('you')}: </span>
          {text}
        </p>
      </MessageContent>
    </Message>
  )
})

/**
 * One answer. Memoised: while a reply streams, only the message that is
 * changing re-renders, never the conversation above it.
 */
const AssistantMessage = memo(function AssistantMessage({
  message,
  live,
  retryPrompt,
  askAgainPrompt,
  showSuggestions,
  onAsk,
  answerCount,
  branchLabels,
}: {
  message: CopilotMessage
  live: boolean
  retryPrompt?: string
  /** Set on the latest finished answer, to ask its question once more. */
  askAgainPrompt?: string
  showSuggestions: boolean
  onAsk: (text: string) => void
  /** How many answers this question has had. */
  answerCount: number
  branchLabels: { previous: string; next: string }
}) {
  const { t } = useTranslation('copilot')
  const text = visibleText(message.text, message.streaming)
  const hasActions = Boolean(text) && !message.error

  return (
    <Message
      from="assistant"
      className={cn('max-w-full flex-row gap-2.5', ARRIVE)}
    >
      {/* While it works on this answer the avatar is alive; then it settles
          into the Mifos mark. */}
      <span className="grid size-8 shrink-0 place-items-center">
        {live ? (
          <CopilotOrb state={text ? 'speaking' : 'thinking'} size={32} />
        ) : (
          <span className="grid size-7 place-items-center rounded-full border border-zinc-200 bg-white motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-75 motion-safe:duration-300 dark:border-zinc-700">
            <img src={MifosLogo} alt="" className="size-6" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <MessageMeta createdAt={message.createdAt} />
        <MessageContent className="w-full gap-3 rounded-2xl rounded-tl-md border border-zinc-200/80 bg-white/80 px-4 py-3 shadow-xs dark:border-white/10 dark:bg-white/5">
          <ThinkingTrail message={message} live={live} />
          {text && (
            // Words fade in as they arrive, behind a caret, the way speech
            // does; a finished answer is simply there.
            <MessageResponse
              isAnimating={message.streaming}
              animated={WORD_FADE}
              caret="block"
            >
              {text}
            </MessageResponse>
          )}
          {message.cards.map((card, index) => (
            <DataCard key={index} card={card} />
          ))}
          {message.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <p>
                  {message.error.message ||
                    t(errorMessageKey(message.error.code))}
                </p>
                {retryPrompt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAsk(retryPrompt)}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    {t('retry')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </MessageContent>
        {/* The answer switcher stays even when this answer failed, so an
            earlier answer to the same question is still within reach. */}
        {!message.streaming && (hasActions || answerCount > 1) && (
          <MessageToolbar className="mt-0">
            {hasActions ? (
              <AnswerActions
                text={message.text}
                askAgainPrompt={askAgainPrompt}
                onAsk={onAsk}
              />
            ) : (
              <span />
            )}
            <MessageBranchSelector>
              <MessageBranchPrevious aria-label={branchLabels.previous} />
              <MessageBranchPage>
                {(current, total) => t('branch.page', { current, total })}
              </MessageBranchPage>
              <MessageBranchNext aria-label={branchLabels.next} />
            </MessageBranchSelector>
          </MessageToolbar>
        )}
        {showSuggestions && message.suggestions.length > 0 && (
          <Suggestions className="mt-1">
            {message.suggestions.map(item => (
              <Suggestion
                key={item}
                suggestion={item}
                onClick={onAsk}
                className="border-[#1074b9]/30 bg-white text-[#1074b9] hover:bg-[#1074b9]/5 hover:text-[#1074b9] dark:border-sky-400/30 dark:bg-transparent dark:text-sky-300 dark:hover:bg-sky-400/10"
              />
            ))}
          </Suggestions>
        )}
      </div>
    </Message>
  )
})

/** Who wrote the answer, that it is AI-generated, and when it was asked. */
function MessageMeta({ createdAt }: { createdAt?: number }) {
  const { t, i18n } = useTranslation('copilot')
  return (
    <p className="flex items-center gap-1.5 text-xs">
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
        {t('brand')}
      </span>
      <AiBadge />
      {createdAt !== undefined && (
        <time
          dateTime={new Date(createdAt).toISOString()}
          className="text-zinc-500 dark:text-zinc-400"
        >
          {new Intl.DateTimeFormat(i18n.language, {
            hour: 'numeric',
            minute: '2-digit',
          }).format(createdAt)}
        </time>
      )}
    </p>
  )
}

/**
 * Copy and ask again. Always visible on the latest answer; on older ones
 * they show on hover or focus, so the conversation stays quiet to read.
 */
function AnswerActions({
  text,
  askAgainPrompt,
  onAsk,
}: {
  text: string
  askAgainPrompt?: string
  onAsk: (text: string) => void
}) {
  const { t } = useTranslation('copilot')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <MessageActions
      className={
        askAgainPrompt
          ? undefined
          : 'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'
      }
    >
      <MessageAction
        tooltip={copied ? t('actions.copied') : t('actions.copy')}
        onClick={() =>
          void navigator.clipboard
            ?.writeText(text)
            .then(() => setCopied(true))
            .catch(() => undefined)
        }
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
      </MessageAction>
      {askAgainPrompt && (
        <MessageAction
          tooltip={t('retry')}
          onClick={() => onAsk(askAgainPrompt)}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </MessageAction>
      )}
    </MessageActions>
  )
}

/** Read-only data the gateway attached to an answer. */
function DataCard({ card }: { card: DisplayCard }) {
  const rows = Object.entries(card.data)
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-800">
      <h3 className="font-medium">{card.title}</h3>
      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

/**
 * A write the gateway paused on. Confirming from the panel comes in a later
 * update, so this only says what is waiting; nothing is run from here.
 */
function ApprovalNote({ approval }: { approval: ApprovalRequest }) {
  const { t } = useTranslation('copilot')
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">
          {t('approvalPending.title', { summary: approval.summary })}
        </p>
        <p className="mt-1">{t('approvalPending.body')}</p>
      </div>
    </div>
  )
}
