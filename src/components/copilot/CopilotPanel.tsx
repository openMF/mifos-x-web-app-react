/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  ChevronDown,
  EllipsisVertical,
  Maximize2,
  PanelBottomClose,
  PanelRight,
  SquarePen,
  X,
} from 'lucide-react'
import type { StickToBottomContext } from 'use-stick-to-bottom'
import { useTranslation } from 'react-i18next'

import MifosLogo from '@/assets/images/MifosX_logo.png'
import { useAppSelector } from '@/app/hook'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Panel } from '@/components/ai-elements/panel'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopilotChat } from '@/hooks/use-copilot-chat'
import { isTurnActive, type TurnPhase } from '@/lib/copilot'
import { cn } from '@/lib/utils'
import { AiBadge } from './AiBadge'
import { Composer } from './Composer'
import { isDisplayMode, type DisplayMode } from './copilot-ui'
import { MessageList } from './MessageList'
import { orbStateFor } from './orb/orb-state'
import { WelcomeScreen } from './WelcomeScreen'

/** Where each display mode puts the panel, from 640px up. */
const PLACEMENT: Record<DisplayMode, string> = {
  // Above its button, 16px clear of it.
  floating:
    'sm:top-auto sm:right-6 sm:bottom-24 sm:left-auto sm:h-[min(44rem,calc(100dvh-8rem))] sm:w-105 sm:rounded-2xl sm:border sm:shadow-[0_24px_64px_-16px_rgb(0_0_0/0.3)] sm:origin-bottom-right motion-safe:data-[state=open]:slide-in-from-bottom-2 motion-safe:data-[state=open]:zoom-in-95 motion-safe:data-[state=closed]:slide-out-to-bottom-2 motion-safe:data-[state=closed]:zoom-out-95',
  // The right edge, full height, over the page.
  docked:
    'sm:inset-y-0 sm:right-0 sm:left-auto sm:w-110 sm:rounded-none sm:border-0 sm:border-l sm:shadow-[0_0_48px_-12px_rgb(0_0_0/0.25)] motion-safe:data-[state=open]:slide-in-from-right-8 motion-safe:data-[state=closed]:slide-out-to-right-8',
  fullscreen: 'sm:inset-0 sm:rounded-none sm:border-0',
}

const MODE_ICONS = {
  floating: PanelBottomClose,
  docked: PanelRight,
  fullscreen: Maximize2,
} as const

/**
 * The Copilot window.
 *
 * Non-modal: the page stays usable around it, so an officer can keep looking
 * at the loan they are asking about. It stays mounted while closed, so the
 * conversation survives minimising; it ends on sign-out.
 */
export default function CopilotPanel({
  id,
  open,
  onOpenChange,
  onPhaseChange,
  mode,
  onModeChange,
  returnFocusRef,
}: {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Lets the launcher say whether a turn is running while the panel is shut. */
  onPhaseChange: (phase: TurnPhase) => void
  mode: DisplayMode
  onModeChange: (mode: DisplayMode) => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const { t } = useTranslation('copilot')
  const { thread, send, stop, reset } = useCopilotChat()
  const busy = isTurnActive(thread.phase)
  const username = useAppSelector(
    state => (state.auth.user as { username?: unknown } | null)?.username
  )

  // Whether there is a draft in the box: the orb leans in while there is.
  const [typing, setTyping] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const conversationRef = useRef<StickToBottomContext>(null)

  // A new question always brings the conversation back into view, even if
  // the officer had scrolled up to reread something.
  const sendAndFollow = useCallback(
    (text: string) => {
      const result = send(text)
      if (result.sent) void conversationRef.current?.scrollToBottom()
      return result
    },
    [send]
  )
  const ask = useCallback(
    (text: string) => void sendAndFollow(text),
    [sendAndFollow]
  )

  useEffect(() => onPhaseChange(thread.phase), [thread.phase, onPhaseChange])

  const announcement = useAnnouncement(thread.phase)
  const empty = !thread.messages.length

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          asChild
          id={id}
          // Clicking the page around it must not close the panel.
          onInteractOutside={event => event.preventDefault()}
          onOpenAutoFocus={event => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
            returnFocusRef.current?.focus()
          }}
        >
          <Panel
            position="bottom-right"
            data-mode={mode}
            className={cn(
              '@container/copilot fixed isolate z-50 m-0 flex flex-col overflow-hidden p-0 outline-none',
              // Frosted glass: the page stays faintly present behind it,
              // so the panel reads as a layer over the work, not a new page.
              'border-zinc-200/80 bg-white/85 text-zinc-900 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100',
              // A phone always gets the whole screen, and a solid one:
              // blurring a full screen is slow on modest hardware.
              'max-sm:inset-0 max-sm:rounded-none max-sm:border-0 max-sm:bg-white max-sm:backdrop-blur-none dark:max-sm:bg-zinc-900',
              PLACEMENT[mode],
              'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:duration-300 motion-safe:data-[state=open]:ease-[cubic-bezier(0.32,0.72,0,1)]',
              'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:duration-200'
            )}
          >
            {/* A wash of Mifos blue from the top, behind everything. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(16_116_185/0.13),transparent)] dark:bg-[radial-gradient(70%_100%_at_50%_0%,rgb(56_189_248/0.12),transparent)]"
            />

            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200/70 ps-3 pe-2 dark:border-white/10">
              <img src={MifosLogo} alt="" className="size-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <DialogPrimitive.Title className="truncate text-sm leading-5 font-semibold">
                    {t('brand')}
                  </DialogPrimitive.Title>
                  <AiBadge />
                </div>
                <DialogPrimitive.Description
                  className={cn(
                    'truncate text-xs leading-4 transition-colors',
                    busy
                      ? 'text-[#1074b9] dark:text-sky-300'
                      : 'text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  {busy ? t('status.working') : t('status.ready')}
                </DialogPrimitive.Description>
              </div>
              {!empty && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reset()
                    inputRef.current?.focus()
                  }}
                  aria-label={t('newChat')}
                  title={t('newChat')}
                  className="h-8 rounded-full border-[#1074b9]/30 bg-transparent px-2.5 shadow-none text-[#1074b9] hover:bg-[#1074b9]/10 hover:text-[#1074b9] dark:border-sky-400/40 dark:bg-transparent dark:text-sky-300 dark:hover:bg-sky-400/10"
                >
                  <SquarePen className="size-4" aria-hidden="true" />
                  {/* The label needs room; the icon alone says it when narrow. */}
                  <span className="hidden @2xl/copilot:inline">
                    {t('newChat')}
                  </span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* A native title, not a tooltip: focus comes back here
                      when the menu closes, and a tooltip would open on it. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('display.options')}
                    title={t('display.options')}
                    // A phone always gets the whole screen.
                    className="hidden size-8 text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 sm:inline-flex dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <EllipsisVertical className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {t('display.label')}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={mode}
                    onValueChange={value => {
                      if (isDisplayMode(value)) onModeChange(value)
                    }}
                  >
                    {(['floating', 'docked', 'fullscreen'] as const).map(
                      option => {
                        const Icon = MODE_ICONS[option]
                        return (
                          <DropdownMenuRadioItem key={option} value={option}>
                            <Icon className="size-4" aria-hidden="true" />
                            {t(`display.${option}`)}
                          </DropdownMenuRadioItem>
                        )
                      }
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <HeaderButton
                label={mode === 'floating' ? t('minimise') : t('close')}
                onClick={() => onOpenChange(false)}
              >
                {mode === 'floating' ? (
                  <>
                    <ChevronDown
                      className="size-4 max-sm:hidden"
                      aria-hidden="true"
                    />
                    <X className="size-4 sm:hidden" aria-hidden="true" />
                  </>
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
              </HeaderButton>
            </header>

            {empty ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <WelcomeScreen
                  onAsk={ask}
                  name={typeof username === 'string' ? username : undefined}
                  orbState={orbStateFor(thread.phase, typing)}
                  spacious={mode === 'fullscreen'}
                />
              </div>
            ) : (
              <Conversation contextRef={conversationRef} className="min-h-0">
                <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-5">
                  <MessageList thread={thread} onAsk={ask} />
                </ConversationContent>
                <ConversationScrollButton label={t('jumpToLatest')} />
              </Conversation>
            )}

            <footer className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 pb-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-backwards motion-safe:delay-100 motion-safe:duration-300">
              <Composer
                ref={inputRef}
                busy={busy}
                onSend={sendAndFollow}
                onStop={stop}
                onTypingChange={setTyping}
              />
              <p className="mt-2 text-center text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                {t('disclaimer')}
              </p>
            </footer>

            {/* Turn progress for screen readers, without reading every word. */}
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
          </Panel>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** A quiet icon button in the header, named by its tooltip. */
function HeaderButton({
  label,
  className,
  ...props
}: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn(
            'size-8 text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white',
            className
          )}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** "Working on your question" when a turn starts, "Reply ready" when it ends. */
function useAnnouncement(phase: TurnPhase): string {
  const { t } = useTranslation('copilot')
  const [message, setMessage] = useState('')
  const previous = useRef(phase)

  useEffect(() => {
    const was = previous.current
    previous.current = phase
    if (phase === 'thinking' && was !== 'thinking') {
      setMessage(t('a11y.working'))
    } else if (isTurnActive(was) && phase === 'idle') {
      setMessage(t('a11y.replyReady'))
    }
  }, [phase, t])

  return message
}
