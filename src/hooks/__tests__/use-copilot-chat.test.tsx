/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'

import { store } from '@/app/store'
import * as copilotLib from '@/lib/copilot'
import { CopilotContextProvider } from '../use-copilot-context'
import { useCopilotChat } from '../use-copilot-chat'

describe('useCopilotChat with context', () => {
  it('transmits detected screen and entity IDs to transport.chat', async () => {
    const chatMock = vi.fn().mockImplementation(async function* () {
      yield { type: 'RunFinished', outcome: { type: 'success' } }
    })

    vi.spyOn(copilotLib, 'createCopilotTransport').mockReturnValue({
      chat: chatMock,
      decide: vi.fn(),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter
          initialEntries={['/clients/88/loans-accounts/999/general']}
        >
          <CopilotContextProvider>{children}</CopilotContextProvider>
        </MemoryRouter>
      </Provider>
    )

    const { result } = renderHook(() => useCopilotChat(), { wrapper })

    expect(result.current.context.screen).toBe('loan-detail')
    expect(result.current.context.clientId).toBe(88)
    expect(result.current.context.loanId).toBe(999)

    await act(async () => {
      result.current.send('What is the outstanding balance?')
    })

    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'What is the outstanding balance?',
        context: expect.objectContaining({
          screen: 'loan-detail',
          clientId: 88,
          loanId: 999,
          language: 'en',
        }),
      }),
      expect.any(AbortSignal)
    )
  })
})
