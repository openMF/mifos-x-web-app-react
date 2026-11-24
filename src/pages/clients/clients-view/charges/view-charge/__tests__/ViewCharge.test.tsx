/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import i18next from 'i18next'
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  type NavigateFunction,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import clientsLocale from '@/locales/en-US/clients.json'

const {
  retrieveClientChargeMock,
  payOrWaiveClientChargeMock,
  deleteClientChargeMock,
} = vi.hoisted(() => ({
  retrieveClientChargeMock: vi.fn(),
  payOrWaiveClientChargeMock: vi.fn(),
  deleteClientChargeMock: vi.fn(),
}))

vi.mock('@/fineract-api', () => ({
  Configuration: class {},
  ClientChargesApi: class {
    retrieveClientCharge = retrieveClientChargeMock
    payOrWaiveClientCharge = payOrWaiveClientChargeMock
    deleteClientCharge = deleteClientChargeMock
  },
}))

import ViewCharge from '../ViewCharge'

function RouteHarness({
  onNavigateReady,
}: {
  onNavigateReady: (nav: NavigateFunction) => void
}) {
  const navigate = useNavigate()
  onNavigateReady(navigate)
  return (
    <Routes>
      <Route
        path="/clients/:clientId/charges/:chargeId"
        element={<ViewCharge />}
      />
    </Routes>
  )
}

describe('ViewCharge route-change guard', () => {
  beforeEach(() => {
    if (!i18next.hasResourceBundle('en-US', 'clients')) {
      i18next.addResourceBundle('en-US', 'clients', clientsLocale)
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('ignores delayed waive completion and refresh after navigating to another charge', async () => {
    let resolveWaive: () => void = () => {}
    payOrWaiveClientChargeMock.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveWaive = resolve
        })
    )

    retrieveClientChargeMock.mockImplementation(
      async (_clientId: number, chargeId: number) => ({
        data:
          chargeId === 4
            ? {
                id: 4,
                name: 'Charge A',
                amount: 100,
                amountPaid: 0,
                amountWaived: 0,
                amountOutstanding: 100,
                isPaid: false,
                isWaived: false,
              }
            : {
                id: 5,
                name: 'Charge B',
                amount: 50,
                amountPaid: 0,
                amountWaived: 0,
                amountOutstanding: 50,
                isPaid: false,
                isWaived: false,
              },
      })
    )

    let navigateTo: NavigateFunction = () => {}
    render(
      <MemoryRouter initialEntries={['/clients/1/charges/4']}>
        <RouteHarness
          onNavigateReady={nav => {
            navigateTo = nav
          }}
        />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Charge A').length).toBeGreaterThan(0)
    })

    // Open waive dialog for Charge A and start the delayed waive request
    fireEvent.click(screen.getByRole('button', { name: 'Waive Charge' }))
    const dialogActions = screen.getAllByRole('button', {
      name: 'Waive Charge',
    })
    fireEvent.click(dialogActions[dialogActions.length - 1])

    expect(payOrWaiveClientChargeMock).toHaveBeenCalledWith(1, 4, {}, 'waive')

    // Navigate to Charge B before Charge A's waive resolves
    act(() => {
      navigateTo('/clients/1/charges/5')
    })

    await waitFor(() => {
      expect(screen.getAllByText('Charge B').length).toBeGreaterThan(0)
    })

    const callsBeforeWaiveResolves = retrieveClientChargeMock.mock.calls.length

    // Resolve Charge A's delayed waiver
    await act(async () => {
      resolveWaive()
      await Promise.resolve()
    })

    // Charge B must stay rendered with enabled buttons and no stale refresh for Charge A
    expect(retrieveClientChargeMock).toHaveBeenCalledTimes(
      callsBeforeWaiveResolves
    )
    expect(screen.getAllByText('Charge B').length).toBeGreaterThan(0)
    expect(screen.queryByText('Charge waived successfully.')).toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Pay' }) as HTMLButtonElement)
        .disabled
    ).toBe(false)
    expect(
      (
        screen.getByRole('button', {
          name: 'Waive Charge',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement)
        .disabled
    ).toBe(false)
  })
})
