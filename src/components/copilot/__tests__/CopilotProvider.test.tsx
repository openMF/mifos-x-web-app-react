/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { act, cleanup, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CopilotState } from '@/components/copilot/copilot-context'
import { CopilotProvider } from '@/components/copilot/CopilotProvider'
import { useCopilotActions, useCopilotState } from '@/hooks/use-copilot'
import type { ApprovalRequest, CopilotEvent } from '@/lib/copilot'

// The gateway, fed by hand: each test says exactly what arrives and when.
const gateway = vi.hoisted(() => {
  let waiting: ((event: CopilotEvent | null) => void) | null = null
  const queued: (CopilotEvent | null)[] = []
  async function* stream(): AsyncGenerator<CopilotEvent> {
    while (true) {
      const next = queued.length
        ? queued.shift()!
        : await new Promise<CopilotEvent | null>(r => (waiting = r))
      if (next === null) return
      yield next
    }
  }
  return {
    stream,
    send(event: CopilotEvent | null) {
      const resolve = waiting
      waiting = null
      if (resolve) resolve(event)
      else queued.push(event)
    },
    clear() {
      queued.length = 0
      waiting = null
    },
  }
})

vi.mock('@/lib/copilot', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/copilot')>()),
  createCopilotTransport: () => ({
    chat: () => gateway.stream(),
    decide: () => gateway.stream(),
  }),
}))

const auth = vi.hoisted(() => ({ isAuthenticated: true }))
vi.mock('@/app/hook', () => ({
  useAppSelector: <T,>(select: (state: { auth: typeof auth }) => T) =>
    select({ auth }),
}))

const APPROVAL: ApprovalRequest = {
  cardId: 'card-1',
  tool: 'make_repayment',
  args: { loanId: 4521, amount: 1500 },
  rows: [{ label: 'Amount', value: '1,500.00' }],
  summary: 'Record repayment of 1,500.00 on loan 000004521',
}

let latest: {
  state: CopilotState
  actions: ReturnType<typeof useCopilotActions>
}

/** Reads the provider, and can be taken away like the panel. */
function Probe() {
  latest = { state: useCopilotState(), actions: useCopilotActions() }
  return null
}

function App() {
  const [panel, setPanel] = useState(true)
  showPanel = setPanel
  return <CopilotProvider>{panel && <Probe />}</CopilotProvider>
}
let showPanel: (shown: boolean) => void

/** Lets the stream's promises run, so dispatched events land. */
const settle = () => act(async () => await new Promise(r => setTimeout(r, 0)))

async function answer(...events: CopilotEvent[]) {
  for (const event of events) gateway.send(event)
  gateway.send(null)
  await settle()
}

const replyEvents: CopilotEvent[] = [
  { type: 'RunStarted' },
  { type: 'TextMessageContent', delta: 'Loan 000004521 is on schedule.' },
  { type: 'RunFinished', outcome: { type: 'success' } },
]

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  gateway.clear()
  auth.isAuthenticated = true
  document.title = 'Mifos X'
  render(<App />)
})

afterEach(() => {
  cleanup()
  setHidden(false)
})

describe('CopilotProvider', () => {
  it('keeps a reply arriving while the panel is closed, and says where it starts', async () => {
    act(() => latest.actions.setOpen(true))
    act(() => void latest.actions.send('How is loan 4521?'))
    act(() => latest.actions.setOpen(false))
    await answer(...replyEvents)

    const { thread, unread, newFrom } = latest.state
    expect(thread.phase).toBe('idle')
    expect(unread).toBe(true)
    expect(newFrom).toBe(thread.messages[1].id)
    expect(screen.getByText('Reply ready')).toBeTruthy()

    act(() => latest.actions.setOpen(true))
    expect(latest.state.unread).toBe(false)
    // "New" stays while the officer reads; the next question clears it.
    expect(latest.state.newFrom).toBe(thread.messages[1].id)
    act(() => void latest.actions.send('And its schedule?'))
    expect(latest.state.newFrom).toBeNull()
  })

  it('keeps the conversation and the unsent question when the panel goes away', async () => {
    act(() => void latest.actions.send('How is loan 4521?'))
    act(() => latest.actions.setDraft('Show the sched'))
    act(() => showPanel(false))
    await answer(...replyEvents)
    act(() => showPanel(true))

    expect(latest.state.thread.messages.map(m => m.text)).toEqual([
      'How is loan 4521?',
      'Loan 000004521 is on schedule.',
    ])
    expect(latest.state.draft).toBe('Show the sched')
  })

  it('marks nothing when the panel was open for the reply', async () => {
    act(() => latest.actions.setOpen(true))
    act(() => void latest.actions.send('How is loan 4521?'))
    await answer(...replyEvents)

    expect(latest.state.unread).toBe(false)
    expect(latest.state.newFrom).toBeNull()
  })

  it('marks nothing for a turn stopped before anything came', async () => {
    act(() => void latest.actions.send('How is loan 4521?'))
    act(() => latest.actions.stop())
    await settle()

    expect(latest.state.unread).toBe(false)
    expect(latest.state.newFrom).toBeNull()
  })

  it('says a confirmation is waiting, even when it came with no text', async () => {
    act(() => void latest.actions.send('Record a repayment of 1,500'))
    await answer(
      { type: 'RunStarted' },
      {
        type: 'RunFinished',
        outcome: { type: 'interrupt', approval: APPROVAL },
      }
    )

    expect(latest.state.thread.phase).toBe('awaitingApproval')
    expect(latest.state.unread).toBe(true)
    expect(screen.getByText('Your confirmation is needed')).toBeTruthy()
  })

  it('marks the tab title while the officer is in another tab', async () => {
    act(() => latest.actions.setOpen(true))
    act(() => void latest.actions.send('How is loan 4521?'))
    setHidden(true)
    await answer(...replyEvents)
    expect(document.title).toBe('● Mifos X')

    act(() => setHidden(false))
    expect(document.title).toBe('Mifos X')
  })

  it('leaves nothing behind on sign-out, not even an unsent question', async () => {
    act(() => latest.actions.setOpen(true))
    act(() => void latest.actions.send('How is loan 4521?'))
    act(() => latest.actions.setOpen(false))
    await answer(...replyEvents)
    act(() => latest.actions.setDraft('Show the sched'))

    auth.isAuthenticated = false
    act(() => showPanel(false))
    act(() => showPanel(true))

    expect(latest.state.thread.messages).toEqual([])
    expect(latest.state.draft).toBe('')
    expect(latest.state.unread).toBe(false)
    expect(latest.state.newFrom).toBeNull()
    expect(latest.state.open).toBe(false)
  })
})
