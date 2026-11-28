/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { retrieveOfficesMock, retrieveOne8Mock, update7Mock } = vi.hoisted(
  () => ({
    retrieveOfficesMock: vi.fn(),
    retrieveOne8Mock: vi.fn(),
    update7Mock: vi.fn(),
  })
)

vi.mock('@/fineract-api', () => ({
  Configuration: class {},
  OfficesApi: class {
    retrieveOffices = retrieveOfficesMock
  },
  StaffApi: class {
    retrieveOne8 = retrieveOne8Mock
    update7 = update7Mock
  },
}))

import EditEmployees from '../EditEmployees'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/organization/employees/7/edit']}>
      <Routes>
        <Route
          path="/organization/employees/:id/edit"
          element={<EditEmployees />}
        />
        <Route path="/organization/employees" element={<p>Employees list</p>} />
      </Routes>
    </MemoryRouter>
  )

describe('EditEmployees', () => {
  beforeEach(() => {
    retrieveOfficesMock.mockResolvedValue({
      data: [{ id: 1, name: 'Head Office' }],
    })
    retrieveOne8Mock.mockResolvedValue({
      data: {
        officeId: 1,
        firstname: 'Ada',
        lastname: 'Lovelace',
        isLoanOfficer: true,
        mobileNo: '555',
        isActive: true,
        joiningDate: [2024, 1, 15],
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('sends the edited employee to Fineract and goes back to the list', async () => {
    update7Mock.mockResolvedValue({ data: { resourceId: 7 } })
    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Ada'), {
      target: { value: 'Grace' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Employees list')).toBeTruthy()
    expect(update7Mock).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        officeId: 1,
        firstname: 'Grace',
        lastname: 'Lovelace',
        isLoanOfficer: true,
        mobileNo: '555',
        isActive: true,
        joiningDate: '2024-01-15',
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      })
    )
  })

  it('keeps Submit disabled until the employee loads, with a retry', async () => {
    retrieveOne8Mock.mockRejectedValueOnce({
      response: { data: { defaultUserMessage: 'Staff not found' } },
    })
    renderPage()

    expect(await screen.findByText('Staff not found')).toBeTruthy()
    const submit = screen.getByRole('button', { name: 'Submit' })
    expect((submit as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(submit)
    expect(update7Mock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByDisplayValue('Ada')).toBeTruthy()
    expect(screen.queryByText('Staff not found')).toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement)
        .disabled
    ).toBe(false)
  })

  it('shows the Fineract error and stays on the form when the update fails', async () => {
    update7Mock.mockRejectedValue({
      response: {
        data: { errors: [{ defaultUserMessage: 'Mobile number is invalid' }] },
      },
    })
    renderPage()

    await screen.findByDisplayValue('Ada')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Mobile number is invalid')).toBeTruthy()
    const submit = screen.getByRole('button', { name: 'Submit' })
    expect((submit as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText('Employees list')).toBeNull()
  })
})
