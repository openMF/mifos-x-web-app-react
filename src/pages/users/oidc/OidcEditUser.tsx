/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  getFineractRecord,
  getPluginErrorMessage,
  getUser,
  updateOffice,
  updateRoles,
  updateUser,
} from '@/lib/oidc-users-api'
import {
  getCallingCode,
  splitPhoneNumber,
  ZITADEL_GENDERS,
  ZITADEL_LANGUAGES,
} from '@/lib/oidc-user-constants'
import OidcUserForm, {
  type OidcUserFormValues,
} from '@/pages/users/oidc/OidcUserForm'

const known = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : ''

type Part = 'profile' | 'roles' | 'office'

const OidcEditUser = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const [initialValues, setInitialValues] = useState<OidcUserFormValues>()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [failures, setFailures] = useState<
    Array<{ part: Part; message: string }>
  >([])

  useEffect(() => {
    let cancelled = false
    Promise.all([getUser(id), getFineractRecord(id)])
      .then(([user, record]) => {
        if (cancelled) return
        if (!user) {
          setLoadError(t('oidcUsers.notFound'))
          return
        }
        const profile = user.human?.profile
        const { countryKey, phoneNumber } = splitPhoneNumber(
          user.human?.phone?.phone ?? ''
        )
        setInitialValues({
          username: record.username_zitadel || user.userName || '',
          email: user.human?.email?.email ?? '',
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          preferredLanguage: known(
            profile?.preferredLanguage,
            ZITADEL_LANGUAGES.map(language => language.code)
          ),
          gender: known(profile?.gender, ZITADEL_GENDERS),
          countryKey,
          phoneNumber,
          officeId: record.office_id != null ? String(record.office_id) : '',
          staffId: record.staff_id != null ? String(record.staff_id) : '',
          roleIds: (record.roles ?? []).map(role => String(role.id)),
          password: '',
          repeatPassword: '',
        })
      })
      .catch(err => {
        console.error('Failed to load the user', err)
        if (!cancelled) {
          setLoadError(getPluginErrorMessage(err, t('oidcUsers.loadFailed')))
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, t])

  const handleSubmit = async (values: OidcUserFormValues) => {
    setSubmitting(true)
    setFailures([])

    const username = values.username.trim()
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()

    // The profile, the roles and the office are separate plugin calls. All
    // three are attempted, and each failure is reported, so a partial save is
    // never mistaken for a complete one.
    const parts: Array<[Part, Promise<void>]> = [
      [
        'profile',
        updateUser({
          userId: id,
          email: { email: values.email.trim(), isVerified: true },
          phone: {
            phone: `${getCallingCode(values.countryKey)}${values.phoneNumber.trim()}`,
            isVerified: true,
          },
          profile: {
            username,
            givenName: firstName,
            familyName: lastName,
            displayName: `${firstName} ${lastName}`,
            nickName: username,
            preferredLanguage: values.preferredLanguage,
            gender: values.gender,
          },
        }),
      ],
      ['roles', updateRoles(id, values.roleIds)],
      [
        'office',
        updateOffice(id, values.officeId, values.staffId || undefined),
      ],
    ]

    const results = await Promise.allSettled(parts.map(([, call]) => call))
    const failed = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [
            {
              part: parts[index][0],
              message: getPluginErrorMessage(
                result.reason,
                t('oidcUsers.saveFailed')
              ),
            },
          ]
        : []
    )

    if (failed.length === 0) {
      navigate(`/appusers/${encodeURIComponent(id)}`)
      return
    }

    failed.forEach(failure =>
      console.error(`Failed to update the user's ${failure.part}`, failure)
    )
    setFailures(failed)
    setSubmitting(false)
  }

  const message = failures.length > 0 && (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <p className="font-medium">{t('oidcUsers.partialSave')}</p>
      <ul className="mt-2 list-disc pl-5">
        {failures.map(failure => (
          <li key={failure.part}>
            {t(`oidcUsers.parts.${failure.part}`)}: {failure.message}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: t('oidcUsers.home'), href: '/home' },
          { label: t('oidcUsers.users'), href: '/appusers' },
          {
            label: initialValues?.username || id,
            href: `/appusers/${encodeURIComponent(id)}`,
          },
          { label: t('oidcUsers.editUser'), current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {t('oidcUsers.editUser')}
        </h2>
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!initialValues && !loadError && <p>{t('oidcUsers.loading')}</p>}
        {initialValues && (
          <OidcUserForm
            initialValues={initialValues}
            withPassword={false}
            submitLabel={t('oidcUsers.save')}
            submitting={submitting}
            message={message}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/appusers/${encodeURIComponent(id)}`)}
          />
        )}
      </div>
    </div>
  )
}

export default OidcEditUser
