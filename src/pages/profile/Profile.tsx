/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'
import { PasswordPreferencesApi } from '@/fineract-api'
import fineract from '@/lib/axios'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  getAuthToken,
  getSignedInUser,
  captureTarget,
  setBasicCredentials,
} from '@/lib/http-client'
import {
  captureSession,
  changeOwnPassword,
  describeError,
  getFineractErrorMessage,
  isSameSession,
  isSessionOf,
} from '@/lib/password-renewal'
import { loginFineract } from '@/pages/login/loginApi'
import { isAxiosError } from 'axios'
import NewPasswordForm from '@/pages/login/NewPasswordForm'

const passwordPreferencesApi = new PasswordPreferencesApi(getConfiguration())

const Profile = () => {
  const { t, i18n } = useTranslation(['common', 'auth'])
  const [user] = useState(getSignedInUser)
  // The server and tenant this page was opened in, which the details shown
  // belong to.
  const [target] = useState(captureTarget)
  // Only a password sign-in changes its password in Fineract; in OIDC mode
  // the identity provider owns it.
  const canChangePassword = !!user && !!getAuthToken()
  const [changingPassword, setChangingPassword] = useState(false)
  // Closing mid-save would drop the result, including any error to show.
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [policy, setPolicy] = useState<string | null>(null)

  useEffect(() => {
    if (!changingPassword) return
    passwordPreferencesApi
      .retrieve1()
      .then(res => setPolicy(res.data?.description ?? null))
      .catch(err =>
        console.error('Failed to fetch password policy', describeError(err))
      )
  }, [changingPassword])

  const changePassword = async (
    password: string,
    repeatPassword: string,
    currentPassword: string
  ) => {
    if (!user) return null

    // Requests read the stored session when they are sent, and another tab
    // may sign in elsewhere meanwhile. The change must go to the user this
    // page shows, whose current password is checked, and to no other.
    const session = captureSession()
    const sessionChanged = () => !isSameSession(session, captureSession())
    if (!session.token || !isSessionOf(session, user, target)) {
      return t('auth:renewPassword.sessionChanged')
    }

    // Fineract's change request takes no current password, so check it by
    // signing in with it first. Otherwise anyone at an unlocked session
    // could take over the account.
    try {
      await loginFineract(user.username, currentPassword, target)
    } catch (err) {
      const wrong = isAxiosError(err) && err.response?.status === 401
      if (wrong) return t('auth:renewPassword.wrongCurrent')
      console.error('Failed to check the current password', describeError(err))
      return getFineractErrorMessage(err, t('auth:renewPassword.failed'))
    }

    if (sessionChanged()) return t('auth:renewPassword.sessionChanged')

    try {
      await changeOwnPassword(
        fineract,
        user.userId,
        password,
        repeatPassword,
        session.token,
        target
      )
    } catch (err) {
      console.error('Failed to change the password', describeError(err))
      return getFineractErrorMessage(err, t('auth:renewPassword.failed'))
    }

    // The stored credential still holds the old password; without this the
    // next request would be refused. If another tab has signed in since,
    // that session is left as it is.
    if (!sessionChanged()) setBasicCredentials(user.username, password)
    setChangingPassword(false)
    setPasswordChanged(true)
    return null
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.profile'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-4">
          <Button>{t('auth:user.permissions')}</Button>
          {canChangePassword && (
            <Button
              className="cursor-pointer"
              onClick={() => {
                setPasswordChanged(false)
                setChangingPassword(true)
              }}
            >
              {t('auth:user.changePassword')}
            </Button>
          )}
        </div>

        {passwordChanged && (
          <p
            role="status"
            className="mb-6 text-sm text-green-700 dark:text-green-400"
          >
            {t('auth:renewPassword.changed')}
          </p>
        )}

        <Dialog
          open={changingPassword}
          onOpenChange={open => {
            if (!open && savingPassword) return
            setChangingPassword(open)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('auth:user.changePassword')}</DialogTitle>
            </DialogHeader>
            {/* Remounted on every open, so no old input is left in it. */}
            {changingPassword && (
              <NewPasswordForm
                askCurrentPassword
                policy={policy}
                onSubmit={changePassword}
                onSubmittingChange={setSavingPassword}
                onCancel={() => setChangingPassword(false)}
                cancelLabel={t('common:actions.cancel')}
              />
            )}
          </DialogContent>
        </Dialog>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          {t('auth:user.userInformation')}
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">{t('auth:user.tenantId')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {target.tenant}
          </div>

          <div className="font-medium">{t('auth:user.userId')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {user?.userId ?? '-'}
          </div>

          <div className="font-medium">{t('auth:user.userName')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {user?.username ?? '-'}
          </div>

          <div className="font-medium">{t('common:fields.office')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {user?.officeName ?? '-'}
          </div>

          <div className="font-medium">{t('common:fields.status')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {t('common:status.authenticated')}
          </div>

          <div className="font-medium">{t('common:fields.language')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {t(
              `languages.${i18n.resolvedLanguage ?? 'en-US'}` as 'languages.en-US',
              { ns: 'common' }
            )}
          </div>
        </div>

        <div className="mt-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
          <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-700 font-semibold text-sm text-zinc-700 dark:text-zinc-300 p-3 border-b dark:border-zinc-600">
            <div>{t('common:fields.role')}</div>
            <div>{t('common:fields.description')}</div>
          </div>
          {(user?.roles ?? []).map(role => (
            <div
              key={role.id ?? role.name}
              className="grid grid-cols-2 text-sm text-zinc-700 dark:text-zinc-200 p-3"
            >
              <div>{role.name}</div>
              <div>{role.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Profile
