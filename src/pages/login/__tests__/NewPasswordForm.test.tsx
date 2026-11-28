/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NewPasswordForm from '@/pages/login/NewPasswordForm'

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

describe('NewPasswordForm', () => {
  it('says the passwords do not match under the repeat field', () => {
    const onSubmit = vi.fn()
    render(<NewPasswordForm policy={null} onSubmit={onSubmit} />)

    type('New password', 'Renew#2026Mifo')
    type('Repeat new password', 'Renew#2026Mifx')

    const repeat = screen.getByLabelText('Repeat new password')
    const message = screen.getByText('The passwords do not match.')
    expect(repeat.getAttribute('aria-describedby')).toBe(message.id)
    expect(repeat.getAttribute('aria-invalid')).toBe('true')

    submit()
    expect(onSubmit).not.toHaveBeenCalled()
    // Said once, under the field, not again at the bottom of the form.
    expect(screen.getAllByText('The passwords do not match.')).toHaveLength(1)
  })

  it('says the passwords do not match when the repeat field is left empty', () => {
    const onSubmit = vi.fn()
    render(<NewPasswordForm policy={null} onSubmit={onSubmit} />)

    type('New password', 'Renew#2026Mifo')
    expect(screen.queryByText('The passwords do not match.')).toBeNull()

    submit()
    expect(screen.getByText('The passwords do not match.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('reports when saving starts and ends', async () => {
    let finish: (value: string | null) => void = () => undefined
    const onSubmit = vi.fn(
      () => new Promise<string | null>(resolve => (finish = resolve))
    )
    const onSubmittingChange = vi.fn()
    render(
      <NewPasswordForm
        policy={null}
        onSubmit={onSubmit}
        onSubmittingChange={onSubmittingChange}
      />
    )

    type('New password', 'Renew#2026Mifo')
    type('Repeat new password', 'Renew#2026Mifo')
    submit()
    expect(onSubmittingChange).toHaveBeenLastCalledWith(true)

    finish(null)
    await waitFor(() =>
      expect(onSubmittingChange).toHaveBeenLastCalledWith(false)
    )
  })

  it('clears the last message once a field is corrected', async () => {
    const onSubmit = vi.fn().mockResolvedValue('Password policy not met')
    render(<NewPasswordForm policy={null} onSubmit={onSubmit} />)

    type('New password', 'short')
    type('Repeat new password', 'short')
    submit()
    expect(await screen.findByText('Password policy not met')).toBeTruthy()

    type('New password', 'Renew#2026Mifo')
    expect(screen.queryByText('Password policy not met')).toBeNull()
  })

  it('shows a message when saving fails unexpectedly', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('storage full'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<NewPasswordForm policy={null} onSubmit={onSubmit} />)

    type('New password', 'Renew#2026Mifo')
    type('Repeat new password', 'Renew#2026Mifo')
    submit()

    expect(
      await screen.findByText('The password could not be changed.')
    ).toBeTruthy()
    // The form can be used again.
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'Change password',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    )
  })

  it("shows the message onSubmit returns, such as Fineract's", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue('Password must be at least 12 characters')
    render(<NewPasswordForm policy={null} onSubmit={onSubmit} />)

    type('New password', 'short')
    type('Repeat new password', 'short')
    submit()

    expect(
      await screen.findByText('Password must be at least 12 characters')
    ).toBeTruthy()
    expect(onSubmit).toHaveBeenCalledWith('short', 'short', '')
  })

  it('shows and hides a password like the sign-in page', () => {
    render(<NewPasswordForm policy={null} onSubmit={vi.fn()} />)
    const field = screen.getByLabelText('New password') as HTMLInputElement

    expect(field.type).toBe('password')
    fireEvent.click(screen.getAllByRole('button', { name: 'Show password' })[0])
    expect(field.type).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(field.type).toBe('password')
  })

  it('asks for the current password when told to', async () => {
    const onSubmit = vi.fn().mockResolvedValue(null)
    render(
      <NewPasswordForm policy={null} askCurrentPassword onSubmit={onSubmit} />
    )

    type('New password', 'Renew#2026Mifo')
    type('Repeat new password', 'Renew#2026Mifo')
    submit()
    expect(screen.getByText('Enter your current password.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()

    type('Current password', 'Temp#2026Word')
    submit()
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        'Renew#2026Mifo',
        'Renew#2026Mifo',
        'Temp#2026Word'
      )
    )
  })
})
