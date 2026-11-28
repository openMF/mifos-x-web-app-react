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
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

import { useAppSelector } from '@/app/hook'
import { useCopilotChat } from '@/hooks/use-copilot-chat'
import { isTurnActive } from '@/lib/copilot'
import {
  CopilotActionsContext,
  CopilotStateContext,
  type CopilotActions,
  type CopilotState,
} from './copilot-context'
import { firstNewAnswer, replyArrived } from './copilot-ui'

/** Put before the tab's title while something waits in a hidden tab. */
const TITLE_BADGE = '● '

/**
 * Holds the Copilot conversation for the whole signed-in app, so it outlives
 * the panel: a reply keeps arriving while the panel is closed or the officer
 * moves to another page, and is there when they come back. Ends on sign-out.
 */
export function CopilotProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('copilot')
  const chat = useCopilotChat()
  const { thread } = chat
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  const [open, setOpenState] = useState(false)
  const [unread, setUnread] = useState(false)
  const [newFrom, setNewFrom] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const markTitle = useTitleBadge()

  // The phase last seen, and how many messages there were before the
  // running turn, so its answers can be told from the ones already read.
  const settled = useRef({
    phase: thread.phase,
    count: thread.messages.length,
  })
  useEffect(() => {
    const was = settled.current
    const { phase, messages, pendingApproval } = thread
    settled.current = {
      phase,
      count: isTurnActive(phase) ? was.count : messages.length,
    }
    if (!replyArrived(was.phase, phase)) return

    const approval = phase === 'awaitingApproval' && pendingApproval !== null
    const answer = firstNewAnswer(messages, was.count)
    // A turn stopped before anything came leaves nothing to read.
    if (!approval && !answer) return

    markTitle()
    if (open) return
    setUnread(true)
    setNewFrom(current => current ?? answer ?? null)
    setAnnouncement(t(approval ? 'a11y.approvalNeeded' : 'a11y.replyReady'))
  }, [thread, open, t, markTitle])

  // Sign-out ends the conversation; nothing of it, not even an unsent
  // question, is left for the next officer on a shared machine.
  useEffect(() => {
    if (isAuthenticated) return
    setOpenState(false)
    setUnread(false)
    setNewFrom(null)
    setDraft('')
    setAnnouncement('')
  }, [isAuthenticated])

  const { send: chatSend, reset: chatReset, stop } = chat

  const send = useCallback(
    (text: string) => {
      const result = chatSend(text)
      if (result.sent) setNewFrom(null)
      return result
    },
    [chatSend]
  )

  const reset = useCallback(() => {
    chatReset()
    setUnread(false)
    setNewFrom(null)
  }, [chatReset])

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
    if (next) {
      setUnread(false)
      setAnnouncement('')
    }
  }, [])

  const actions = useMemo<CopilotActions>(
    () => ({ send, stop, reset, setOpen, setDraft }),
    [send, stop, reset, setOpen]
  )
  const state = useMemo<CopilotState>(
    () => ({ thread, open, unread, newFrom, draft }),
    [thread, open, unread, newFrom, draft]
  )

  return (
    <CopilotActionsContext.Provider value={actions}>
      <CopilotStateContext.Provider value={state}>
        {children}
        {/* While the panel is closed its own announcements are gone with
            it; this says that something is waiting, without moving focus. */}
        <p className="sr-only" aria-live="polite">
          {open ? '' : announcement}
        </p>
      </CopilotStateContext.Provider>
    </CopilotActionsContext.Provider>
  )
}

/**
 * Marks the tab's title while the officer is in another tab, so a reply or
 * a confirmation waiting shows in the tab strip. The mark goes as soon as
 * the tab is looked at.
 */
function useTitleBadge(): () => void {
  useEffect(() => {
    const clear = () => {
      if (!document.hidden) removeTitleBadge()
    }
    document.addEventListener('visibilitychange', clear)
    return () => {
      document.removeEventListener('visibilitychange', clear)
      removeTitleBadge()
    }
  }, [])

  return useCallback(() => {
    if (document.hidden && !document.title.startsWith(TITLE_BADGE)) {
      document.title = TITLE_BADGE + document.title
    }
  }, [])
}

function removeTitleBadge() {
  if (document.title.startsWith(TITLE_BADGE)) {
    document.title = document.title.slice(TITLE_BADGE.length)
  }
}
