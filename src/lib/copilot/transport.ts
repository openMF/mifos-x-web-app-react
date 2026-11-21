/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CopilotEvent } from './events'
import { SseParser } from './sse'
import {
  CARD_ID_PATTERN,
  CHAT_PATH,
  V1EventMapper,
  decisionPath,
  httpError,
} from './v1-protocol'

type RunError = Extract<CopilotEvent, { type: 'RunError' }>

/**
 * What the officer is looking at, attached to every turn so "this loan"
 * means something. The gateway puts it in the model's prompt and never uses
 * it to decide what the officer may do: Fineract's permissions do that.
 */
export interface CopilotContext {
  /** Logical screen name, e.g. 'client-detail', 'loan-detail', 'home'. */
  screen?: string
  clientId?: number | null
  clientName?: string | null
  loanId?: number | null
  savingsId?: number | null
  /** Language the reply should be written in, e.g. 'en', 'es'. */
  language?: string
  /**
   * Origin of the Fineract this screen is connected to. The gateway refuses
   * to run when it points at a different one, so the Copilot can never act on
   * a different bank than the one on screen.
   */
  backendOrigin?: string
}

export interface ChatInput {
  message: string
  /** Omitted on the first turn; the gateway issues one and returns it. */
  conversationId?: string
  context?: CopilotContext
}

export type Decision = 'approve' | 'reject'

/**
 * A backend the Copilot can talk to. Each call streams CopilotEvents and
 * always ends with one RunFinished or RunError, unless the signal aborts it,
 * in which case it ends silently: stopping is not an error.
 */
export interface CopilotTransport {
  chat(input: ChatInput, signal?: AbortSignal): AsyncIterable<CopilotEvent>
  decide(
    cardId: string,
    decision: Decision,
    signal?: AbortSignal
  ): AsyncIterable<CopilotEvent>
}

export interface V1TransportOptions {
  /** Gateway origin, e.g. https://copilot.example.org. */
  baseUrl: string
  /** Officer's credential and tenant headers, read fresh on every call. */
  getHeaders: () => Record<string, string>
  /** Added to the context of every chat turn unless the caller set one. */
  getBackendOrigin?: () => string | undefined
  /**
   * Time allowed until the first bytes arrive. Models that reason before
   * answering routinely take tens of seconds, so this is long.
   */
  firstResponseTimeoutMs?: number
  /**
   * Longest silence allowed once the answer has started. The gateway has no
   * watchdog of its own for a model that stops mid-answer, so without this a
   * stalled turn would spin until the officer gave up.
   */
  idleTimeoutMs?: number
  /** For tests and the mock; defaults to the global fetch. */
  fetchFn?: typeof fetch
  /** For tests; defaults to crypto.randomUUID. */
  newId?: () => string
}

export const DEFAULT_FIRST_RESPONSE_TIMEOUT_MS = 60_000
/**
 * Generous on purpose: between two events the gateway may be waiting on a
 * slow Fineract read and then on the model again, with nothing to send.
 */
export const DEFAULT_IDLE_TIMEOUT_MS = 120_000

/**
 * Transport for the Copilot gateway's wire contract v1.
 *
 * A chat turn is not idempotent, so nothing here retries. Retrying is a
 * visible choice the officer makes.
 */
export function createV1Transport(
  options: V1TransportOptions
): CopilotTransport {
  const baseUrl = options.baseUrl.replace(/\/+$/, '')
  const newId = options.newId ?? defaultId

  return {
    chat(input, signal) {
      const backendOrigin = options.getBackendOrigin?.()
      const context: CopilotContext = {
        ...(backendOrigin ? { backendOrigin } : {}),
        ...input.context,
      }
      return post(
        CHAT_PATH,
        {
          ...(input.conversationId
            ? { conversationId: input.conversationId }
            : {}),
          message: input.message,
          clientMsgId: newId(),
          context,
        },
        signal,
        true
      )
    },

    decide(cardId, decision, signal) {
      if (!CARD_ID_PATTERN.test(cardId)) {
        return single({
          type: 'RunError',
          code: 'INTERNAL',
          message: 'Invalid confirmation reference.',
          retryable: false,
        })
      }
      // A decision that fails without an answer may or may not have reached
      // the banking system. "Try again" would ask the question afresh and
      // could raise a second card for the same payment, so it is not offered,
      // and the officer is told to check the account first.
      return post(
        decisionPath(cardId),
        { decision, clientMsgId: newId() },
        signal,
        false
      )
    },
  }

  async function* post(
    path: string,
    body: unknown,
    signal: AbortSignal | undefined,
    // Whether the request may be made again when its outcome is unknown: a
    // chat turn may, a decision may not.
    repeatable: boolean
  ): AsyncGenerator<CopilotEvent> {
    // A generator runs lazily: if it was cancelled before the first read,
    // the request is never sent.
    if (signal?.aborted) return

    const fetchFn = options.fetchFn ?? fetch.bind(globalThis)
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)
    let timedOut = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // One watchdog, re-armed on every chunk: first for the wait until the
    // answer starts, then for any silence in the middle of it.
    const allow = (ms: number) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, ms)
    }
    allow(options.firstResponseTimeoutMs ?? DEFAULT_FIRST_RESPONSE_TIMEOUT_MS)
    const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS
    // A failure the gateway did not report itself. A chat turn may be asked
    // again. A decision's write may already have run, so the officer is told
    // so instead of being offered a retry.
    const unanswered = (error: RunError): RunError =>
      repeatable
        ? error
        : {
            type: 'RunError',
            code: error.code,
            retryable: false,
            outcomeUnknown: true,
          }

    try {
      const response = await fetchFn(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...options.getHeaders(),
          'X-Correlation-Id': newId(),
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        clearTimeout(timer)
        // The gateway reports its own failures inside the stream, so a 5xx
        // comes from a proxy in front of it, possibly after the decision had
        // already reached Fineract. Its body is not the gateway's word, so
        // on a decision it may not offer a retry, supply the message, or
        // claim an expired session, which would put the card back.
        const payload = await readJson(response)
        if (response.status >= 500 && !repeatable) {
          yield unanswered(httpError(response.status, null))
        } else {
          yield httpError(response.status, payload)
        }
        return
      }
      if (!response.body) {
        yield unanswered({
          type: 'RunError',
          code: 'INTERNAL',
          retryable: false,
        })
        return
      }

      yield { type: 'RunStarted' }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const parser = new SseParser()
      const mapper = new V1EventMapper()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        allow(idleTimeoutMs)
        for (const frame of parser.push(
          decoder.decode(value, { stream: true })
        )) {
          for (const event of mapper.map(frame)) {
            yield event
            // The run is over once 'done' is mapped. A connection held open
            // after it would keep the turn busy until the idle watchdog
            // fired and reported a second, false failure. The finally below
            // closes it now.
            if (event.type === 'RunFinished' || event.type === 'RunError') {
              return
            }
          }
        }
      }
      for (const frame of parser.push(decoder.decode())) {
        yield* mapper.map(frame)
      }
      for (const frame of parser.flush()) yield* mapper.map(frame)
      for (const event of mapper.end()) {
        yield mapper.cutOff && event.type === 'RunError'
          ? unanswered(event)
          : event
      }
    } catch (error) {
      if (signal?.aborted) return
      if (timedOut) {
        yield unanswered({
          type: 'RunError',
          code: 'LLM_UNAVAILABLE',
          retryable: true,
        })
        return
      }
      // "Failed to fetch" is what a blocked CORS preflight, a DNS failure and
      // an unreachable host all look like from here. It helps whoever
      // configures the deployment, so it goes to the console; the officer is
      // told the assistant could not be reached, or, on a decision, to check
      // the account.
      console.error('Copilot transport failed', error)
      yield unanswered({ type: 'RunError', code: 'INTERNAL', retryable: false })
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      // Release the connection on every exit path, including after the last
      // event: a gateway may keep the socket open, and a leaked stream per
      // turn eventually exhausts the browser's connections to that host.
      controller.abort()
    }
  }
}

async function* single(event: CopilotEvent): AsyncGenerator<CopilotEvent> {
  yield event
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function defaultId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
