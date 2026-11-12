/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppSelector } from '@/app/hook'
import {
  copilotReducer,
  createCopilotTransport,
  initialThread,
  isTurnActive,
  sanitizeInput,
  type CopilotEvent,
  type CopilotThread,
  type CopilotTransport,
  type SanitizeResult,
} from '@/lib/copilot'

export type SendResult =
  | { sent: true }
  | {
      sent: false
      reason: Extract<SanitizeResult, { blocked: true }>['reason'] | 'busy'
    }

/**
 * One Copilot conversation: the reducer's state, driven by the transport.
 *
 * The conversation is held in memory only and lives as long as the component
 * using this hook. It is cleared on sign-out, so the next officer on a shared
 * machine never sees the previous one's questions.
 */
export function useCopilotChat() {
  const [thread, dispatch] = useReducer(copilotReducer, initialThread)
  const { i18n } = useTranslation()
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  // Read inside callbacks, so they always see the latest turn without being
  // recreated on every streamed word.
  const threadRef = useRef<CopilotThread>(thread)
  threadRef.current = thread

  const transportRef = useRef<CopilotTransport | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  // Set the moment a turn starts, before React re-renders: two quick presses
  // of Send must not both see an idle thread and start two turns.
  const runningRef = useRef(false)

  const consume = useCallback(
    async (
      events: AsyncIterable<CopilotEvent>,
      controller: AbortController
    ) => {
      try {
        for await (const event of events) {
          // Once stopped, nothing more from this turn may land, not even an
          // event already on its way: the next turn could be running.
          if (controller.signal.aborted) return
          dispatch({ type: 'event', event })
        }
      } finally {
        if (controllerRef.current === controller) runningRef.current = false
      }
    },
    []
  )

  const send = useCallback(
    (text: string): SendResult => {
      if (runningRef.current || isTurnActive(threadRef.current.phase)) {
        return { sent: false, reason: 'busy' }
      }
      const result = sanitizeInput(text)
      if (result.blocked) return { sent: false, reason: result.reason }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      runningRef.current = true
      transportRef.current ??= createCopilotTransport()

      dispatch({
        type: 'send',
        text: result.text,
        userMessageId: newId(),
        assistantMessageId: newId(),
        sentAt: Date.now(),
      })
      void consume(
        transportRef.current.chat(
          {
            message: result.text,
            conversationId: threadRef.current.conversationId,
            context: { language: i18n.language.split('-')[0] },
          },
          controller.signal
        ),
        controller
      )
      return { sent: true }
    },
    [consume, i18n.language]
  )

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    runningRef.current = false
    dispatch({ type: 'cancel' })
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    runningRef.current = false
    dispatch({ type: 'reset' })
  }, [])

  // Sign-out ends the conversation; so does leaving the page that holds it.
  useEffect(() => {
    if (!isAuthenticated) reset()
  }, [isAuthenticated, reset])
  useEffect(() => () => controllerRef.current?.abort(), [])

  return { thread, send, stop, reset }
}

function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
