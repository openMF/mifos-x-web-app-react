/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAppDispatch } from '@/app/hook'
import fineract from '@/lib/axios'
import { captureTarget, hasSession } from '@/lib/http-client'
import {
  changeOwnPassword,
  describeError,
  getFineractErrorMessage,
  getPendingRenewal,
} from '@/lib/password-renewal'
import { loginUser, logout } from '@/pages/login/loginSlice'
import NewPasswordForm from '@/pages/login/NewPasswordForm'
import { useTheme } from '@/hooks/use-theme'
import mifosLogoLight from '@/assets/images/mifos_lg-logo.png'
import mifosLogoDark from '@/assets/images/image-removebg-preview-transparent.png'

/**
 * Shown when Fineract will not go further until the user picks a new
 * password: right after sign-in, or when it expires during a session.
 * Saving it signs the user in again with the new password.
 */
const RenewPassword = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isDark } = useTheme()
  // Read once: a successful save signs in, which clears the pending renewal.
  const [renewal] = useState(getPendingRenewal)

  if (!renewal) {
    // Opened directly, or the page was reloaded mid-renewal, which drops the
    // in-memory credential on purpose.
    return <Navigate to={hasSession() ? '/home' : '/login'} replace />
  }

  const isRenewalTarget = () => {
    const now = captureTarget()
    return now.server === renewal.server && now.tenant === renewal.tenant
  }

  const handleSubmit = async (password: string, repeatPassword: string) => {
    // Requests go to the server and tenant last signed in to, in any tab.
    // Never send this user's change anywhere else.
    if (!isRenewalTarget()) {
      return t('renewPassword.tenantChanged', { tenant: renewal.tenant })
    }

    try {
      await changeOwnPassword(
        fineract,
        renewal.userId,
        password,
        repeatPassword,
        renewal.authKey,
        { server: renewal.server, tenant: renewal.tenant }
      )
    } catch (err) {
      console.error('Failed to change the password', describeError(err))
      return getFineractErrorMessage(err, t('renewPassword.failed'))
    }

    // The target is read again when signing in, and another tab may have
    // changed it while the password was saved. Never sign in elsewhere.
    if (!isRenewalTarget()) {
      return t('renewPassword.signInFailed')
    }

    const result = await dispatch(
      loginUser({ username: renewal.username, password })
    )
    if (loginUser.fulfilled.match(result)) {
      navigate('/home', { replace: true })
      return null
    }

    // The password is saved; only the sign-in after it failed. Saving again
    // would use the old credential, so point the user to sign in instead.
    return t('renewPassword.signInFailed')
  }

  const backToSignIn = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-zinc-800 shadow-md p-8 flex flex-col items-center">
        <img
          src={isDark ? mifosLogoDark : mifosLogoLight}
          alt="mifosLogo"
          className="h-[90px] mb-6"
        />
        <h1 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
          {renewal.reason === 'expired'
            ? t('renewPassword.expiredTitle')
            : t('renewPassword.title')}
        </h1>
        <p className="text-sm text-center mb-6 text-zinc-700 dark:text-zinc-300">
          {renewal.reason === 'expired'
            ? t('renewPassword.expiredDescription', {
                username: renewal.username,
              })
            : t('renewPassword.description', { username: renewal.username })}
        </p>

        {/* Leaving goes through the form, which disables it while the
            password is saved and the user signed in again. */}
        <NewPasswordForm
          policy={null}
          onSubmit={handleSubmit}
          onCancel={backToSignIn}
          cancelLabel={t('renewPassword.backToSignIn')}
        />
      </div>
    </div>
  )
}

export default RenewPassword
