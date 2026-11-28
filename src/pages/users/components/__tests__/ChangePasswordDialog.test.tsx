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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChangePasswordDialog from '../ChangePasswordDialog'

const { mockChangePassword } = vi.hoisted(() => ({
  mockChangePassword: vi.fn(),
}))

vi.mock('@/fineract-api', () => ({
  UsersApi: class {
    changePassword = mockChangePassword
  },
}))

vi.mock('@/lib/fineract-openapi', () => ({
  getConfiguration: vi.fn().mockReturnValue({}),
}))

describe('ChangePasswordDialog', () => {
  const defaultProps = {
    userId: 42,
    username: 'john.doe',
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the Change Password trigger button', () => {
    render(<ChangePasswordDialog {...defaultProps} />)
    expect(
      screen.getByRole('button', { name: /change password/i })
    ).toBeTruthy()
  })

  it('opens dialog with user details and form elements on trigger click', () => {
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    expect(
      screen.getByRole('heading', { name: 'Change Password' })
    ).toBeTruthy()
    expect(
      screen.getByText('Enter a new password for user "john.doe".')
    ).toBeTruthy()
    expect(screen.getByLabelText(/new password \*/i)).toBeTruthy()
    expect(screen.getByLabelText(/repeat password \*/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })

  it('disables the submit button when form inputs are invalid or empty', () => {
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    const submitBtn = screen.getByRole('button', {
      name: /^change password$/i,
    }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('validates password length and displays mismatch error', () => {
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    const newPwdInput = screen.getByLabelText(
      /new password \*/i
    ) as HTMLInputElement
    const repeatPwdInput = screen.getByLabelText(
      /repeat password \*/i
    ) as HTMLInputElement
    const submitBtn = screen.getByRole('button', {
      name: /^change password$/i,
    }) as HTMLButtonElement

    // Type less than 6 chars
    fireEvent.change(newPwdInput, { target: { value: '123' } })
    expect(
      screen.getByText('Password must be at least 6 characters.')
    ).toBeTruthy()
    expect(submitBtn.disabled).toBe(true)

    // Type mismatch repeat password
    fireEvent.change(repeatPwdInput, { target: { value: 'different' } })
    expect(screen.getByText('Passwords do not match.')).toBeTruthy()
    expect(submitBtn.disabled).toBe(true)

    // Correct both to match with >= 6 chars
    fireEvent.change(newPwdInput, { target: { value: 'password123' } })
    fireEvent.change(repeatPwdInput, { target: { value: 'password123' } })

    expect(screen.queryByText('Passwords do not match.')).toBeNull()
    expect(
      screen.queryByText('Password must be at least 6 characters.')
    ).toBeNull()
    expect(submitBtn.disabled).toBe(false)
  })

  it('submits valid passwords and calls onSuccess on API success', async () => {
    mockChangePassword.mockResolvedValueOnce({ data: { resourceId: 42 } })
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    fireEvent.change(screen.getByLabelText(/new password \*/i), {
      target: { value: 'secret123' },
    })
    fireEvent.change(screen.getByLabelText(/repeat password \*/i), {
      target: { value: 'secret123' },
    })

    const submitBtn = screen.getByRole('button', {
      name: /^change password$/i,
    }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(false)

    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(42, {
        password: 'secret123',
        repeatPassword: 'secret123',
      })
    })

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(
        screen.queryByRole('heading', { name: 'Change Password' })
      ).toBeNull()
    })
  })

  it('displays API error message inside error alert when request fails', async () => {
    mockChangePassword.mockRejectedValueOnce({
      response: {
        data: {
          defaultUserMessage: 'Password does not conform to policy',
        },
      },
    })
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    fireEvent.change(screen.getByLabelText(/new password \*/i), {
      target: { value: 'secret123' },
    })
    fireEvent.change(screen.getByLabelText(/repeat password \*/i), {
      target: { value: 'secret123' },
    })

    const submitBtn = screen.getByRole('button', {
      name: /^change password$/i,
    })

    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(
        screen.getByText('Password does not conform to policy')
      ).toBeTruthy()
    })
  })

  it('clears inputs and closes dialog when Cancel is clicked', () => {
    render(<ChangePasswordDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))

    const newPwdInput = screen.getByLabelText(
      /new password \*/i
    ) as HTMLInputElement
    fireEvent.change(newPwdInput, { target: { value: 'secret123' } })

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(
      screen.queryByRole('heading', { name: 'Change Password' })
    ).toBeNull()

    // Reopen and check cleared
    fireEvent.click(screen.getByRole('button', { name: /change password/i }))
    expect(
      (screen.getByLabelText(/new password \*/i) as HTMLInputElement).value
    ).toBe('')
    expect(
      (screen.getByLabelText(/repeat password \*/i) as HTMLInputElement).value
    ).toBe('')
  })

  it('disables trigger button when userId is missing or disabled prop is true', () => {
    const { rerender } = render(
      <ChangePasswordDialog userId={undefined} username="john.doe" />
    )
    const triggerBtn = screen.getByRole('button', {
      name: /change password/i,
    }) as HTMLButtonElement
    expect(triggerBtn.disabled).toBe(true)

    rerender(<ChangePasswordDialog {...defaultProps} disabled={true} />)
    expect(
      (
        screen.getByRole('button', {
          name: /change password/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('disables submit button if userId is missing even with valid passwords', () => {
    render(
      <ChangePasswordDialog
        userId={undefined}
        username="john.doe"
        open={true}
      />
    )

    const newPwdInput = screen.getByLabelText(
      /new password \*/i
    ) as HTMLInputElement
    const repeatPwdInput = screen.getByLabelText(
      /repeat password \*/i
    ) as HTMLInputElement
    const submitBtn = screen.getByRole('button', {
      name: /^change password$/i,
    }) as HTMLButtonElement

    fireEvent.change(newPwdInput, { target: { value: 'password123' } })
    fireEvent.change(repeatPwdInput, { target: { value: 'password123' } })

    expect(submitBtn.disabled).toBe(true)
  })
})
