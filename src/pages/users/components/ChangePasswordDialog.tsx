/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import type { AxiosError } from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faSpinner } from '@fortawesome/free-solid-svg-icons'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UsersApi, type ChangePwdUsersUserIdRequest } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const usersApi = new UsersApi(getConfiguration())

type UserApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
}

const getUserErrorMessage = (
  error: unknown,
  fallback = 'Failed to change password'
) => {
  const axiosError = error as AxiosError<UserApiErrorResponse>
  const responseData = axiosError.response?.data

  return (
    responseData?.errors?.[0]?.defaultUserMessage ||
    responseData?.errors?.[0]?.developerMessage ||
    responseData?.defaultUserMessage ||
    responseData?.developerMessage ||
    axiosError.message ||
    fallback
  )
}

export interface ChangePasswordDialogProps {
  userId?: number
  username?: string
  disabled?: boolean
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export const ChangePasswordDialog = ({
  userId,
  username,
  disabled,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: ChangePasswordDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return
    setPassword('')
    setRepeatPassword('')
    setError(null)
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen)
    } else {
      setInternalOpen(nextOpen)
    }
  }

  const handleCancel = () => {
    handleOpenChange(false)
  }

  const passwordsMatch = password === repeatPassword
  const isLengthValid = password.length >= 6
  const hasBothFields = password.length > 0 && repeatPassword.length > 0
  const isMismatch = repeatPassword.length > 0 && !passwordsMatch
  const isTooShort = password.length > 0 && !isLengthValid
  const isValid =
    Boolean(userId) && hasBothFields && isLengthValid && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting || !userId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: ChangePwdUsersUserIdRequest = {
        password,
        repeatPassword,
      }
      await usersApi.changePassword(userId, payload)
      handleOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to change password', err)
      setError(getUserErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              disabled={disabled || !userId}
            >
              <FontAwesomeIcon icon={faGear} />
              Change Password
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        showCloseButton={!isSubmitting}
        onPointerDownOutside={e => {
          if (isSubmitting) e.preventDefault()
        }}
        onEscapeKeyDown={e => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for user &quot;{username}&quot;.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div
              role="alert"
              className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password *</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {isTooShort && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repeat-password">Repeat Password *</Label>
            <Input
              id="repeat-password"
              type="password"
              placeholder="Repeat new password"
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {isMismatch && (
              <p
                role="alert"
                className="text-xs text-red-600 dark:text-red-400"
              >
                Passwords do not match.
              </p>
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              )}
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ChangePasswordDialog
