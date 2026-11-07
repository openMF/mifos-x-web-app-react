/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it, vi } from 'vitest'
import type { CopilotEvent } from '../events'
import { createV1Transport, type V1TransportOptions } from '../transport'

async function collect(
  events: AsyncIterable<CopilotEvent>
): Promise<CopilotEvent[]> {
  const out: CopilotEvent[] = []
  for await (const event of events) out.push(event)
  return out
}

/** A streamed response that arrives in exactly these chunks. */
function streamed(...chunks: string[]): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        controller.close()
      },
    }),
    { status: 200 }
  )
}

function transport(
  fetchFn: typeof fetch,
  options: Partial<V1TransportOptions> = {}
) {
  let id = 0
  return createV1Transport({
    baseUrl: 'https://gateway.example.org/',
    getHeaders: () => ({
      Authorization: 'Bearer token-1',
      'Fineract-Platform-TenantId': 'default',
    }),
    newId: () => `id-${++id}`,
    fetchFn,
    ...options,
  })
}

describe('createV1Transport', () => {
  it('posts a chat turn with the credential, tenant and context', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      streamed('event: done\ndata: {"conversation_id":"c-1"}\n\n')
    )
    await collect(
      transport(fetchFn, {
        getBackendOrigin: () => 'https://fineract.example.org',
      }).chat({
        message: 'What is the balance?',
        conversationId: 'c-0',
        context: { screen: 'loan-detail', loanId: 12 },
      })
    )

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://gateway.example.org/copilot/api/v1/chat')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({
      Authorization: 'Bearer token-1',
      'Fineract-Platform-TenantId': 'default',
      'X-Correlation-Id': 'id-2',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      conversationId: 'c-0',
      message: 'What is the balance?',
      clientMsgId: 'id-1',
      context: {
        backendOrigin: 'https://fineract.example.org',
        screen: 'loan-detail',
        loanId: 12,
      },
    })
  })

  it('omits the conversation id on the first turn', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      streamed('event: done\ndata: {}\n\n')
    )
    await collect(transport(fetchFn).chat({ message: 'Hi' }))
    const body = JSON.parse(String(fetchFn.mock.calls[0][1]?.body))
    expect(body).not.toHaveProperty('conversationId')
    expect(body.context).toEqual({})
  })

  it('streams events from frames split across network chunks', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      streamed(
        'event: tok',
        'en\ndata: {"delta":"Hel',
        'lo"}\n\nevent: done\ndata: {"conversation_id":"c-1"}\n\n'
      )
    )
    expect(await collect(transport(fetchFn).chat({ message: 'Hi' }))).toEqual([
      { type: 'RunStarted' },
      { type: 'TextMessageContent', delta: 'Hello' },
      {
        type: 'RunFinished',
        outcome: { type: 'success' },
        conversationId: 'c-1',
      },
    ])
  })

  it('handles a final frame without its trailing blank line', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      streamed('event: done\ndata: {}')
    )
    const events = await collect(transport(fetchFn).chat({ message: 'Hi' }))
    expect(events[events.length - 1]).toMatchObject({ type: 'RunFinished' })
  })

  it('sends a decision to the card URL', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      streamed('event: done\ndata: {}\n\n')
    )
    await collect(transport(fetchFn).decide('card_42', 'approve'))
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe(
      'https://gateway.example.org/copilot/api/v1/actions/card_42/decision'
    )
    expect(JSON.parse(String(init?.body))).toEqual({
      decision: 'approve',
      clientMsgId: 'id-1',
    })
  })

  it('refuses an unsafe card id without sending anything', async () => {
    const fetchFn = vi.fn<typeof fetch>()
    const events = await collect(transport(fetchFn).decide('../x', 'approve'))
    expect(fetchFn).not.toHaveBeenCalled()
    expect(events).toEqual([
      {
        type: 'RunError',
        code: 'INTERNAL',
        message: 'Invalid confirmation reference.',
        retryable: false,
      },
    ])
  })

  it('maps an HTTP failure to a RunError', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response('{"message":"Signed out"}', { status: 401 })
    )
    expect(await collect(transport(fetchFn).chat({ message: 'Hi' }))).toEqual([
      {
        type: 'RunError',
        code: 'AUTH_EXPIRED',
        message: 'Signed out',
        retryable: true,
      },
    ])
  })

  it('reports an unreachable gateway without the browser wording', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await collect(transport(fetchFn).chat({ message: 'Hi' }))).toEqual([
      { type: 'RunError', code: 'INTERNAL', retryable: false },
    ])
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('gives up when nothing arrives within the first-response timeout', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        )
    )
    const events = await collect(
      transport(fetchFn, { firstResponseTimeoutMs: 10 }).chat({
        message: 'Hi',
      })
    )
    expect(events).toEqual([
      { type: 'RunError', code: 'LLM_UNAVAILABLE', retryable: true },
    ])
  })

  it('ends silently when the officer stops the turn', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        )
    )
    const controller = new AbortController()
    const run = collect(
      transport(fetchFn).chat({ message: 'Hi' }, controller.signal)
    )
    controller.abort()
    expect(await run).toEqual([])
  })

  it('does not send anything when already cancelled', async () => {
    const fetchFn = vi.fn<typeof fetch>()
    const controller = new AbortController()
    controller.abort()
    expect(
      await collect(
        transport(fetchFn).chat({ message: 'Hi' }, controller.signal)
      )
    ).toEqual([])
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('never retries a failed turn on its own', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response('', { status: 503 })
    )
    await collect(transport(fetchFn).chat({ message: 'Hi' }))
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})
