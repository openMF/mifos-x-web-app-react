/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  changePassword,
  getPluginErrorMessage,
  getZitadelErrorCode,
  PASSWORD_ERROR,
} from '@/lib/oidc-users-api'
import {
  checkPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/pages/users/oidc/user-form'

interface ChangePasswordDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

const EMPTY = { current: '', next: '', repeat: '' }

/**
 * Changes the signed-in user's own password at the identity provider. It needs
 * the current password, so it is only offered on the user's own page.
 */
const ChangePasswordDialog = ({
  userId,
  open,
  onOpenChange,
  onChanged,
}: ChangePasswordDialogProps) => {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const close = (next: boolean) => {
    if (!next) {
      setValues(EMPTY)
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!values.current) {
      setError(t('oidcUsers.currentPasswordRequired'))
      return
    }
    const problem = checkPassword(values.next)
    if (problem === 'length') {
      setError(
        t('oidcUsers.passwordLength', {
          min: PASSWORD_MIN_LENGTH,
          max: PASSWORD_MAX_LENGTH,
        })
      )
      return
    }
    if (problem === 'pattern') {
      setError(t('oidcUsers.passwordPattern'))
      return
    }
    if (values.next !== values.repeat) {
      setError(t('oidcUsers.passwordMismatch'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await changePassword(userId, values.current, values.next)
      close(false)
      onChanged()
    } catch (err) {
      console.error('Failed to change the password', err)
      const code = getZitadelErrorCode(err)
      setError(
        code === PASSWORD_ERROR.WRONG_CURRENT
          ? t('oidcUsers.wrongCurrentPassword')
          : code === PASSWORD_ERROR.SAME_AS_CURRENT
            ? t('oidcUsers.samePassword')
            : getPluginErrorMessage(err, t('oidcUsers.passwordChangeFailed'))
      )
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof typeof EMPTY, label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`change-password-${key}`}>{label}</Label>
      <Input
        id={`change-password-${key}`}
        type="password"
        autoComplete={key === 'current' ? 'current-password' : 'new-password'}
        value={values[key]}
        onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('oidcUsers.changePassword')}</DialogTitle>
            <DialogDescription>
              {t('oidcUsers.passwordRules', {
                min: PASSWORD_MIN_LENGTH,
                max: PASSWORD_MAX_LENGTH,
              })}
            </DialogDescription>
          </DialogHeader>

          {field('current', t('oidcUsers.currentPassword'))}
          {field('next', t('oidcUsers.newPassword'))}
          {field('repeat', t('oidcUsers.repeatPassword'))}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => close(false)}
              disabled={submitting}
            >
              {t('oidcUsers.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              disabled={submitting}
            >
              {submitting ? t('oidcUsers.saving') : t('oidcUsers.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ChangePasswordDialog
