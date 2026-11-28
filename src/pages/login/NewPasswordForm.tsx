/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { describeError } from '@/lib/password-renewal'

interface NewPasswordFormProps {
  /** Password Preferences description, shown as the rule. */
  policy: string | null
  /** Also ask for the current password, passed to onSubmit. */
  askCurrentPassword?: boolean
  /**
   * Saves the password. Resolves to an error message to show, or null when
   * it was saved.
   */
  onSubmit: (
    password: string,
    repeatPassword: string,
    currentPassword: string
  ) => Promise<string | null>
  onCancel?: () => void
  cancelLabel?: string
  /** Told when saving starts and ends, so a dialog can stay open meanwhile. */
  onSubmittingChange?: (submitting: boolean) => void
}

interface PasswordFieldProps {
  id: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  value: string
  onChange: (value: string) => void
  /** Shown under the field, and announced with it. */
  error?: string | null
}

/** A password input with the same show/hide toggle as the sign-in page. */
const PasswordField = ({
  id,
  label,
  autoComplete,
  value,
  onChange,
  error,
}: PasswordFieldProps) => {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="dark:bg-zinc-800 dark:text-white pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setVisible(!visible)}
          onMouseDown={e => e.preventDefault()}
          aria-label={
            visible ? t('login.hidePassword') : t('login.showPassword')
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-zinc-500" />
          ) : (
            <Eye className="h-4 w-4 text-zinc-500" />
          )}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * New password and its repeat. Fineract checks the password against the
 * active policy itself and explains a refusal, so only what it cannot see
 * (an empty field, a mismatch) is checked here.
 */
const NewPasswordForm = ({
  policy,
  askCurrentPassword = false,
  onSubmit,
  onCancel,
  cancelLabel,
  onSubmittingChange,
}: NewPasswordFormProps) => {
  const { t } = useTranslation('auth')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmittingState] = useState(false)
  // After a submit attempt an empty repeat field counts as a mismatch too,
  // or the button would seem to do nothing.
  const [attempted, setAttempted] = useState(false)

  // A corrected field makes the last message stale.
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value)
    setError(null)
  }

  const setSubmitting = (value: boolean) => {
    setSubmittingState(value)
    onSubmittingChange?.(value)
  }

  // Shown under the repeat field as soon as it is typed in.
  const mismatch =
    (repeatPassword.length > 0 || attempted) && password !== repeatPassword
      ? t('renewPassword.mismatch')
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (askCurrentPassword && !currentPassword) {
      setError(t('renewPassword.currentRequired'))
      return
    }
    if (!password) {
      setError(t('renewPassword.required'))
      return
    }
    if (password !== repeatPassword) {
      // The message is already under the repeat field.
      setError(null)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      setError(await onSubmit(password, repeatPassword, currentPassword))
    } catch (err) {
      // onSubmit reports what it expects; anything else still needs saying,
      // or the form would sit there with no explanation.
      console.error('Failed to change the password', describeError(err))
      setError(t('renewPassword.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {policy ?? t('user.passwordPolicyFallback')}
      </p>

      {askCurrentPassword && (
        <PasswordField
          id="current-password"
          label={t('renewPassword.currentPassword')}
          autoComplete="current-password"
          value={currentPassword}
          onChange={edit(setCurrentPassword)}
        />
      )}

      <PasswordField
        id="new-password"
        label={t('renewPassword.newPassword')}
        autoComplete="new-password"
        value={password}
        onChange={edit(setPassword)}
      />

      <PasswordField
        id="repeat-password"
        label={t('renewPassword.repeatPassword')}
        autoComplete="new-password"
        value={repeatPassword}
        onChange={edit(setRepeatPassword)}
        error={mismatch}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" className="cursor-pointer" disabled={submitting}>
          {submitting
            ? t('renewPassword.submitting')
            : t('renewPassword.submit')}
        </Button>
      </div>
    </form>
  )
}

export default NewPasswordForm
