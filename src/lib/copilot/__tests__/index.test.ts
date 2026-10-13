/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CopilotEvent } from '../events'

/**
 * Load the module against a runtime configuration (window.__env) and what
 * the sign-in page stored (localStorage).
 */
async function load(
  env: Record<string, string>,
  stored: Record<string, string> = {}
) {
  vi.resetModules()
  vi.stubGlobal('window', { __env: env })
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
  })
  return import('../index')
}

async function collect(events: AsyncIterable<CopilotEvent>) {
  const out: CopilotEvent[] = []
  for await (const event of events) out.push(event)
  return out
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('getBackendOrigin', () => {
  it('is the origin of the server chosen at sign-in', async () => {
    const { getBackendOrigin } = await load(
      { FINERACT_API_URL: 'https://localhost:8443' },
      { mifosServer: 'https://bank-a.example.org:8443/ignored/' }
    )
    expect(getBackendOrigin()).toBe('https://bank-a.example.org:8443')
  })

  it('falls back to the sign-in default when no server was chosen', async () => {
    const { getBackendOrigin } = await load({
      FINERACT_API_URL: 'https://fineract.example.org',
    })
    expect(getBackendOrigin()).toBe('https://localhost:8443')
  })

  it('is left out when requests go through a same-origin proxy', async () => {
    const stored = { mifosServer: 'https://bank-a.example.org' }
    expect(
      (await load({ FINERACT_API_URL: '' }, stored)).getBackendOrigin()
    ).toBe(undefined)
    expect(
      (await load({ FINERACT_API_URL: '/fineract' }, stored)).getBackendOrigin()
    ).toBe(undefined)
  })
})

describe('createCopilotTransport', () => {
  it('uses the mock when configured as mock or left empty', async () => {
    const fetchFn = vi.fn()
    vi.stubGlobal('fetch', fetchFn)
    for (const url of ['mock', '']) {
      const { createCopilotTransport } = await load({
        MIFOS_COPILOT_MCP_BASE_URL: url,
      })
      const events = await collect(
        createCopilotTransport().chat({ message: 'error please' })
      )
      expect(events[events.length - 1]).toMatchObject({
        type: 'RunError',
        code: 'RATE_LIMITED',
      })
    }
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('refuses a cleartext gateway so the credential is never exposed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchFn = vi.fn()
    vi.stubGlobal('fetch', fetchFn)
    const { createCopilotTransport } = await load({
      MIFOS_COPILOT_MCP_BASE_URL: 'http://copilot.example.org',
    })
    expect(
      await collect(createCopilotTransport().chat({ message: 'Hi' }))
    ).toEqual([{ type: 'RunError', code: 'INTERNAL', retryable: false }])
    expect(fetchFn).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalled()
  })

  it('calls an https gateway as the signed-in tenant, on the signed-in server', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () =>
        new Response('event: done\ndata: {"conversation_id":"c-1"}\n\n')
    )
    vi.stubGlobal('fetch', fetchFn)
    const { createCopilotTransport } = await load(
      {
        MIFOS_COPILOT_MCP_BASE_URL: 'https://copilot.example.org',
        FINERACT_API_URL: 'https://localhost:8443',
        FINERACT_PLATFORM_TENANT_IDENTIFIER: 'configured-tenant',
      },
      {
        mifosTenant: 'branch-a',
        mifosServer: 'https://bank-a.example.org',
        mifosToken: 'dXNlcjpwYXNz',
      }
    )
    const events = await collect(
      createCopilotTransport().chat({ message: 'Hi' })
    )
    expect(events[events.length - 1]).toMatchObject({
      type: 'RunFinished',
      conversationId: 'c-1',
    })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://copilot.example.org/copilot/api/v1/chat')
    expect(init?.headers).toMatchObject({
      Authorization: 'Basic dXNlcjpwYXNz',
      'Fineract-Platform-TenantId': 'branch-a',
    })
    expect(JSON.parse(String(init?.body)).context).toEqual({
      backendOrigin: 'https://bank-a.example.org',
    })
  })

  it('uses the default tenant when none was chosen, as Fineract calls do', async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response('event: done\ndata: {}\n\n')
    )
    vi.stubGlobal('fetch', fetchFn)
    const { createCopilotTransport } = await load({
      MIFOS_COPILOT_MCP_BASE_URL: 'https://copilot.example.org',
    })
    await collect(createCopilotTransport().chat({ message: 'Hi' }))
    expect(fetchFn.mock.calls[0][1]?.headers).toMatchObject({
      'Fineract-Platform-TenantId': 'default',
    })
  })
})
