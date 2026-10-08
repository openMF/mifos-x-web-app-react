/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  assignRoles,
  createFineractRecord,
  createUser,
  getPluginErrorMessage,
} from '@/lib/oidc-users-api'
import { DEFAULT_COUNTRY, getCallingCode } from '@/lib/oidc-user-constants'
import OidcUserForm, {
  type OidcUserFormValues,
} from '@/pages/users/oidc/OidcUserForm'

const EMPTY: OidcUserFormValues = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  preferredLanguage: '',
  gender: '',
  countryKey: DEFAULT_COUNTRY,
  phoneNumber: '',
  officeId: '',
  staffId: '',
  roleIds: [],
  password: '',
  repeatPassword: '',
}

/**
 * Where creation stopped. Creating a user takes three calls to the plugin and
 * none of them is undone if a later one fails, so the page has to say which
 * part of the account exists.
 */
type Failure =
  | { stage: 'identity'; message: string }
  | { stage: 'record' | 'roles'; message: string; userId: string }

const OidcCreateUser = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)

  const handleSubmit = async (values: OidcUserFormValues) => {
    setSubmitting(true)
    setFailure(null)

    const username = values.username.trim()
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()

    let userId: string
    try {
      userId = await createUser({
        username,
        givenName: firstName,
        familyName: lastName,
        nickName: username,
        displayName: `${firstName} ${lastName}`,
        preferredLanguage: values.preferredLanguage,
        gender: values.gender,
        email: values.email.trim(),
        phone: `${getCallingCode(values.countryKey)}${values.phoneNumber.trim()}`,
        password: values.password,
      })
    } catch (err) {
      console.error('Failed to create the user in the identity provider', err)
      setFailure({
        stage: 'identity',
        message: getPluginErrorMessage(err, t('oidcUsers.createFailed')),
      })
      setSubmitting(false)
      return
    }

    try {
      await createFineractRecord({
        id: userId,
        officeId: values.officeId,
        staffId: values.staffId || undefined,
        username,
        firstname: firstName,
        lastname: lastName,
        roleIds: values.roleIds,
      })
    } catch (err) {
      console.error('Failed to create the Fineract record for the user', err)
      setFailure({
        stage: 'record',
        userId,
        message: getPluginErrorMessage(err, t('oidcUsers.createFailed')),
      })
      setSubmitting(false)
      return
    }

    try {
      await assignRoles(userId, values.roleIds)
    } catch (err) {
      console.error('Failed to assign roles to the user', err)
      setFailure({
        stage: 'roles',
        userId,
        message: getPluginErrorMessage(err, t('oidcUsers.createFailed')),
      })
      setSubmitting(false)
      return
    }

    navigate(`/appusers/${encodeURIComponent(userId)}`)
  }

  const message = failure && (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {failure.stage === 'identity' && failure.message}
      {failure.stage !== 'identity' && (
        <>
          <p>
            {t(
              failure.stage === 'record'
                ? 'oidcUsers.partialRecord'
                : 'oidcUsers.partialRoles',
              { error: failure.message }
            )}
          </p>
          <Link
            className="mt-2 inline-block font-medium underline"
            to={`/appusers/${encodeURIComponent(failure.userId)}`}
          >
            {t('oidcUsers.openAccount')}
          </Link>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: t('oidcUsers.home'), href: '/home' },
          { label: t('oidcUsers.users'), href: '/appusers' },
          { label: t('oidcUsers.createUser'), current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {t('oidcUsers.createUser')}
        </h2>
        <OidcUserForm
          initialValues={EMPTY}
          withPassword
          submitLabel={t('oidcUsers.create')}
          submitting={submitting}
          // Once the identity exists, submitting again would create a second
          // one; the message links to the account instead.
          locked={!!failure && failure.stage !== 'identity'}
          message={message}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/appusers')}
        />
      </div>
    </div>
  )
}

export default OidcCreateUser
