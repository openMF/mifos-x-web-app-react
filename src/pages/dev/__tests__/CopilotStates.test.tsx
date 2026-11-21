/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CopilotStates from '@/pages/dev/CopilotStates'
import { COPILOT_STATES } from '@/pages/dev/copilot-states'

const byId = Object.fromEntries(COPILOT_STATES.map(s => [s.id, s.thread]))

describe('Copilot states page', () => {
  it('renders every state under its own heading', () => {
    render(<CopilotStates />)
    for (const state of COPILOT_STATES) {
      expect(screen.getByRole('heading', { name: state.title })).toBeTruthy()
    }
  })

  // Each replay must land where its title says, or the page shows a state
  // under the wrong name.
  it.each([
    ['welcome', 'idle'],
    ['waiting', 'thinking'],
    ['notes', 'thinking'],
    ['step', 'thinking'],
    ['streaming', 'streaming'],
    ['answer', 'idle'],
    ['table', 'idle'],
    ['no-tool', 'idle'],
    ['approval', 'awaitingApproval'],
    ['approved', 'idle'],
    ['rejected', 'idle'],
    ['not-confirmed', 'idle'],
    ['expired', 'error'],
    ['rate-limited', 'error'],
    ['refused', 'error'],
    ['session-expired', 'error'],
    ['cut-off', 'error'],
  ])('%s ends in the %s phase', (id, phase) => {
    expect(byId[id].phase).toBe(phase)
  })

  it('stops each in-progress state at the moment it is named for', () => {
    const last = (id: string) => byId[id].messages[byId[id].messages.length - 1]
    expect(last('waiting').text + (last('waiting').reasoning ?? '')).toBe('')
    expect(last('notes').reasoning).toBeTruthy()
    expect(last('notes').steps).toEqual([])
    expect(last('step').steps).toMatchObject([{ done: false }])
    expect(last('streaming').text).toBeTruthy()
    expect(last('cut-off').error?.code).toBe('INTERNAL')
  })
})
