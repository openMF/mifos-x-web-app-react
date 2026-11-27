/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, expect, it, vi } from 'vitest'

import clients from '@/locales/en-US/clients.json'
import ClientStandingInstructions from './ClientStandingInstructions'

const { retrieveClient, retrieveInstructions } = vi.hoisted(() => ({
  retrieveClient: vi.fn(),
  retrieveInstructions: vi.fn(),
}))

vi.mock('@/fineract-api', () => ({
  ClientApi: class {
    retrieveOne11 = retrieveClient
  },
  StandingInstructionsApi: class {
    retrieveAll19 = retrieveInstructions
  },
}))

vi.mock('@/lib/fineract-openapi', () => ({ getConfiguration: () => ({}) }))

beforeAll(() => {
  i18next.addResourceBundle('en-US', 'clients', clients)
})

it('clears the previous client on navigation and displays transfer precision', async () => {
  type ClientResponse = { data: { displayName: string } }
  let resolveSecondClient!: (response: ClientResponse) => void
  const secondClient = new Promise<ClientResponse>(resolve => {
    resolveSecondClient = resolve
  })
  retrieveClient.mockResolvedValueOnce({
    data: { displayName: 'First client' },
  })
  retrieveClient.mockReturnValueOnce(secondClient)
  retrieveInstructions.mockResolvedValueOnce({
    data: {
      pageItems: [
        {
          id: 1,
          name: 'First transfer',
          amount: 12.3456,
          validFrom: [2026, 6, 12],
          validTill: '2026-06-30',
        },
      ],
    },
  })
  retrieveInstructions.mockResolvedValueOnce({ data: { pageItems: [] } })

  render(
    <MemoryRouter initialEntries={['/clients/1/standing-instructions']}>
      <Link to="/clients/2/standing-instructions">Switch client</Link>
      <Routes>
        <Route
          path="/clients/:id/standing-instructions"
          element={<ClientStandingInstructions />}
        />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByText('First client')).toBeTruthy()
  expect(await screen.findByText('12.3456')).toBeTruthy()
  expect(screen.getByText('June 12, 2026 to June 30, 2026')).toBeTruthy()

  fireEvent.click(screen.getByRole('link', { name: 'Switch client' }))
  expect(screen.queryByText('First client')).toBeNull()
  expect(screen.queryByText('First transfer')).toBeNull()
  expect(
    await screen.findByText(clients.standingInstructions.empty)
  ).toBeTruthy()
  expect(retrieveInstructions.mock.calls.map(call => call[7])).toEqual([1, 2])

  await act(async () => {
    resolveSecondClient({ data: { displayName: 'Second client' } })
  })
  expect(screen.getByText('Second client')).toBeTruthy()
})
