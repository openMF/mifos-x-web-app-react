/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { act, render, renderHook, screen } from '@testing-library/react'
import { useContext } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'

import { store } from '@/app/store'
import {
  CopilotEntityContext,
  type CopilotEntityDetails,
} from '@/context/copilot-entity-context'
import {
  CopilotContextProvider,
  resolveEntityContext,
  useCopilotContext,
  useSetCopilotEntity,
} from '../use-copilot-context'

function createWrapper(initialPath = '/') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          <CopilotContextProvider>{children}</CopilotContextProvider>
        </MemoryRouter>
      </Provider>
    )
  }
}

describe('useCopilotContext', () => {
  it('detects client-detail screen and clientId from URL', () => {
    const { result } = renderHook(() => useCopilotContext(), {
      wrapper: createWrapper('/clients/42/general'),
    })

    expect(result.current.screen).toBe('client-detail')
    expect(result.current.clientId).toBe(42)
    expect(result.current.loanId).toBeNull()
    expect(result.current.savingsId).toBeNull()
  })

  it('detects loan-detail screen and extracts loanId and clientId', () => {
    const { result } = renderHook(() => useCopilotContext(), {
      wrapper: createWrapper('/clients/42/loans-accounts/101/general'),
    })

    expect(result.current.screen).toBe('loan-detail')
    expect(result.current.clientId).toBe(42)
    expect(result.current.loanId).toBe(101)
  })

  it('detects savings-detail screen and extracts savingsId and clientId', () => {
    const { result } = renderHook(() => useCopilotContext(), {
      wrapper: createWrapper('/clients/42/savings-accounts/202/transactions'),
    })

    expect(result.current.screen).toBe('savings-detail')
    expect(result.current.clientId).toBe(42)
    expect(result.current.savingsId).toBe(202)
  })

  it('detects journal-entry and accounting screens', () => {
    const { result: r1 } = renderHook(() => useCopilotContext(), {
      wrapper: createWrapper('/accounting/create-journal-entry'),
    })
    expect(r1.current.screen).toBe('journal-entry')

    const { result: r2 } = renderHook(() => useCopilotContext(), {
      wrapper: createWrapper('/accounting/chart-of-accounts'),
    })
    expect(r2.current.screen).toBe('accounting')
  })

  it('enriches context with clientName registered via useSetCopilotEntity', () => {
    function TestComponent() {
      useSetCopilotEntity({
        clientName: 'Maria Santos',
        clientId: 42,
      })
      const context = useCopilotContext()
      return (
        <div>
          <span data-testid="screen">{context.screen}</span>
          <span data-testid="clientName">{context.clientName}</span>
          <span data-testid="clientId">{context.clientId}</span>
        </div>
      )
    }

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/clients/42/general']}>
          <CopilotContextProvider>
            <TestComponent />
          </CopilotContextProvider>
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByTestId('screen').textContent).toBe('client-detail')
    expect(screen.getByTestId('clientName').textContent).toBe('Maria Santos')
    expect(screen.getByTestId('clientId').textContent).toBe('42')
  })

  describe('resolveEntityContext route guards', () => {
    it('keeps URL IDs authoritative and drops stale entity names on client change', () => {
      // User on client 2 while entity is still client 1
      const res = resolveEntityContext(
        { screen: 'client-detail', clientId: 2 },
        { clientId: 1, clientName: 'Client A' }
      )

      expect(res.clientId).toBe(2)
      expect(res.clientName).toBeNull()
    })

    it('keeps URL loanId authoritative and drops stale entity data on loan change', () => {
      // User on loan 20 while entity is still loan 10
      const res = resolveEntityContext(
        { screen: 'loan-detail', loanId: 20 },
        { loanId: 10, clientId: 1, clientName: 'Borrower A' }
      )

      expect(res.loanId).toBe(20)
      expect(res.clientId).toBeNull()
      expect(res.clientName).toBeNull()
    })

    it('enriches group loan context with clientId only when loanId matches', () => {
      // User on group loan 45 (no clientId in URL), entity matches loan 45
      const res = resolveEntityContext(
        { screen: 'loan-detail', loanId: 45 },
        { loanId: 45, clientId: 12, clientName: 'Maria Santos' }
      )

      expect(res.loanId).toBe(45)
      expect(res.clientId).toBe(12)
      expect(res.clientName).toBe('Maria Santos')
    })
  })

  it('prevents stale entity A data from leaking to route B during navigation before fetch completes', () => {
    let navigateFn: (to: string) => void = () => {}

    function TestApp() {
      const navigate = useNavigate()
      navigateFn = navigate
      const context = useCopilotContext()

      return (
        <div>
          <span data-testid="screen">{context.screen}</span>
          <span data-testid="clientId">{String(context.clientId)}</span>
          <span data-testid="clientName">{String(context.clientName)}</span>
          <span data-testid="loanId">{String(context.loanId)}</span>
        </div>
      )
    }

    let setEntityFn: (entity: CopilotEntityDetails | null) => void = () => {}
    function EntitySetter() {
      const { setEntity } = useContext(CopilotEntityContext)
      setEntityFn = setEntity
      return null
    }

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/clients/1/general']}>
          <CopilotContextProvider>
            <EntitySetter />
            <TestApp />
          </CopilotContextProvider>
        </MemoryRouter>
      </Provider>
    )

    // 1. Register Entity A on route /clients/1/general
    act(() => {
      setEntityFn({
        clientId: 1,
        clientName: 'Client A',
      })
    })

    expect(screen.getByTestId('clientId').textContent).toBe('1')
    expect(screen.getByTestId('clientName').textContent).toBe('Client A')

    // 2. Navigate to Client B (/clients/2/general) without clearing entity state (simulating pending fetch)
    act(() => {
      navigateFn('/clients/2/general')
    })

    // Assert: Client B's ID is authoritative, and Client A's name is dropped immediately
    expect(screen.getByTestId('clientId').textContent).toBe('2')
    expect(screen.getByTestId('clientName').textContent).toBe('null')

    // 3. Navigate to Loan account 20 (/groups/5/loans-accounts/20/general)
    act(() => {
      navigateFn('/groups/5/loans-accounts/20/general')
    })

    // Assert: Loan 20 is active, stale entity A is completely dropped
    expect(screen.getByTestId('screen').textContent).toBe('loan-detail')
    expect(screen.getByTestId('loanId').textContent).toBe('20')
    expect(screen.getByTestId('clientName').textContent).toBe('null')

    // 4. Once Loan 20 finishes fetching and registers its entity
    act(() => {
      setEntityFn({
        loanId: 20,
        clientId: 9,
        clientName: 'Borrower 20',
      })
    })

    expect(screen.getByTestId('loanId').textContent).toBe('20')
    expect(screen.getByTestId('clientId').textContent).toBe('9')
    expect(screen.getByTestId('clientName').textContent).toBe('Borrower 20')
  })
})
