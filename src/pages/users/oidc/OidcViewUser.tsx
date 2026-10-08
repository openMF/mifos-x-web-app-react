/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { getOidcUserManager } from '@/lib/oidc-config'
import {
  activateUser,
  deactivateUser,
  deleteUser,
  getFineractRecord,
  getPluginErrorMessage,
  getUser,
  USER_STATE_ACTIVE,
  type FineractUserRecord,
  type ZitadelUser,
} from '@/lib/oidc-users-api'
import ChangePasswordDialog from '@/pages/users/oidc/ChangePasswordDialog'
import { UserStateLabel } from '@/pages/users/oidc/UserStateLabel'
import { useOfficeStaff, useUserTemplate } from '@/pages/users/oidc/user-form'

const OidcViewUser = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const [user, setUser] = useState<ZitadelUser | null>()
  const [record, setRecord] = useState<FineractUserRecord>({})
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isSelf, setIsSelf] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const { offices } = useUserTemplate()
  const officeId = record.office_id != null ? String(record.office_id) : ''
  const staff = useOfficeStaff(officeId)

  const load = useCallback(async () => {
    const [loadedUser, loadedRecord] = await Promise.all([
      getUser(id),
      getFineractRecord(id),
    ])
    setUser(loadedUser)
    setRecord(loadedRecord)
  }, [id])

  useEffect(() => {
    load().catch(err => {
      console.error('Failed to load the user', err)
      setError(getPluginErrorMessage(err, t('oidcUsers.loadFailed')))
      setUser(null)
    })
  }, [load, t])

  // The password change needs the current password, which only the account
  // holder knows, so it is offered on their own page only. In Zitadel the
  // token subject is the user id.
  useEffect(() => {
    let cancelled = false
    getOidcUserManager()
      ?.getUser()
      .then(signedIn => {
        if (!cancelled) setIsSelf(signedIn?.profile.sub === id)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
      await load()
      setNotice(done)
    } catch (err) {
      console.error('User action failed', err)
      setError(getPluginErrorMessage(err, t('oidcUsers.actionFailed')))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteUser(id)
      navigate('/appusers')
    } catch (err) {
      console.error('Failed to delete the user', err)
      setError(getPluginErrorMessage(err, t('oidcUsers.actionFailed')))
      setBusy(false)
    }
  }

  const active = user?.state === USER_STATE_ACTIVE
  const profile = user?.human?.profile
  const officeName =
    offices.find(office => String(office.id) === officeId)?.name || officeId
  const staffName =
    staff.find(member => String(member.id) === String(record.staff_id))?.name ??
    (record.staff_id != null ? String(record.staff_id) : '—')

  const details: Array<[string, React.ReactNode]> = [
    [t('oidcUsers.loginName'), record.username_zitadel || user?.userName],
    [t('oidcUsers.firstName'), profile?.firstName],
    [t('oidcUsers.lastName'), profile?.lastName],
    [t('oidcUsers.email'), user?.human?.email?.email],
    [t('oidcUsers.phoneNumber'), user?.human?.phone?.phone],
    [t('oidcUsers.office'), officeName || '—'],
    [t('oidcUsers.staff'), staffName],
    [
      t('oidcUsers.roles'),
      record.roles?.length
        ? record.roles.map(role => role.name).join(', ')
        : '—',
    ],
    [t('oidcUsers.status'), <UserStateLabel key="state" state={user?.state} />],
  ]

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: t('oidcUsers.home'), href: '/home' },
          { label: t('oidcUsers.users'), href: '/appusers' },
          {
            label: record.username_zitadel || user?.userName || id,
            current: true,
          },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {user && (
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              disabled={busy}
              onClick={() =>
                navigate(`/appusers/${encodeURIComponent(id)}/edit`)
              }
            >
              {t('oidcUsers.edit')}
            </Button>

            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={busy}
              onClick={() =>
                active
                  ? run(() => deactivateUser(id), t('oidcUsers.deactivated'))
                  : run(() => activateUser(id), t('oidcUsers.activated'))
              }
            >
              {active ? t('oidcUsers.deactivate') : t('oidcUsers.activate')}
            </Button>

            {isSelf && (
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={busy}
                onClick={() => setPasswordOpen(true)}
              >
                {t('oidcUsers.changePassword')}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  disabled={busy}
                >
                  {t('oidcUsers.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('oidcUsers.deleteTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('oidcUsers.deleteConfirm', {
                      name: record.username_zitadel || user.userName || id,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    {t('oidcUsers.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    onClick={handleDelete}
                  >
                    {t('oidcUsers.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          {t('oidcUsers.userDetails')}
        </h2>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-4 text-sm text-green-700">
            {notice}
          </p>
        )}
        {user === undefined && <p>{t('oidcUsers.loading')}</p>}
        {user === null && !error && <p>{t('oidcUsers.notFound')}</p>}

        {user && (
          <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <div className="font-medium">{label}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {value || '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/appusers')}
          >
            {t('oidcUsers.back')}
          </Button>
        </div>
      </div>

      {isSelf && (
        <ChangePasswordDialog
          userId={id}
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
          onChanged={() => setNotice(t('oidcUsers.passwordChanged'))}
        />
      )}
    </div>
  )
}

export default OidcViewUser
