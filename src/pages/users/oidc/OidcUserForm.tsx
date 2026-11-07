/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import AppMultiSelect from '@/components/custom/select/AppMultiSelect'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  COUNTRY_CODES,
  ZITADEL_GENDERS,
  ZITADEL_LANGUAGES,
} from '@/lib/oidc-user-constants'
import {
  checkPassword,
  isValidEmail,
  isValidPhone,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  useOfficeStaff,
  useUserTemplate,
} from '@/pages/users/oidc/user-form'

export interface OidcUserFormValues {
  username: string
  email: string
  firstName: string
  lastName: string
  preferredLanguage: string
  gender: string
  countryKey: string
  phoneNumber: string
  officeId: string
  staffId: string
  roleIds: string[]
  password: string
  repeatPassword: string
}

type FieldErrors = Partial<Record<keyof OidcUserFormValues, string>>

interface OidcUserFormProps {
  initialValues: OidcUserFormValues
  /** Create asks for a password; edit leaves passwords to the user. */
  withPassword: boolean
  submitLabel: string
  submitting: boolean
  /** Blocks submitting without showing progress. */
  locked?: boolean
  /** Shown above the actions, e.g. a failed save. */
  message?: ReactNode
  onSubmit: (values: OidcUserFormValues) => void
  onCancel: () => void
}

const OidcUserForm = ({
  initialValues,
  withPassword,
  submitLabel,
  submitting,
  locked = false,
  message,
  onSubmit,
  onCancel,
}: OidcUserFormProps) => {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})

  const { offices, roles, error: templateError } = useUserTemplate()
  const staff = useOfficeStaff(values.officeId)

  const set = <K extends keyof OidcUserFormValues>(
    key: K,
    value: OidcUserFormValues[K]
  ) => {
    setValues(prev => ({
      ...prev,
      [key]: value,
      // Staff belong to an office, so a new office invalidates the choice.
      ...(key === 'officeId' ? { staffId: '' } : {}),
    }))
  }

  const validate = (): FieldErrors => {
    const found: FieldErrors = {}
    const required = t('oidcUsers.required')

    const requiredText: Array<keyof OidcUserFormValues> = [
      'username',
      'firstName',
      'lastName',
      'preferredLanguage',
      'gender',
      'countryKey',
      'officeId',
    ]
    for (const key of requiredText) {
      if (!String(values[key]).trim()) found[key] = required
    }

    if (!isValidEmail(values.email)) found.email = t('oidcUsers.invalidEmail')
    if (!isValidPhone(values.phoneNumber)) {
      found.phoneNumber = t('oidcUsers.invalidPhone')
    }
    if (values.roleIds.length === 0) found.roleIds = required

    if (withPassword) {
      const problem = checkPassword(values.password)
      if (problem === 'length') {
        found.password = t('oidcUsers.passwordLength', {
          min: PASSWORD_MIN_LENGTH,
          max: PASSWORD_MAX_LENGTH,
        })
      } else if (problem === 'pattern') {
        found.password = t('oidcUsers.passwordPattern')
      }
      if (values.password !== values.repeatPassword) {
        found.repeatPassword = t('oidcUsers.passwordMismatch')
      }
    }

    return found
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(values)
  }

  const fieldError = (key: keyof OidcUserFormValues) =>
    errors[key] ? <p className="text-sm text-red-600">{errors[key]}</p> : null

  const textField = (
    key: keyof OidcUserFormValues,
    label: string,
    type = 'text'
  ) => (
    <div className="w-full md:w-[48%] space-y-2">
      <Label htmlFor={`oidc-user-${key}`}>{label} *</Label>
      <Input
        id={`oidc-user-${key}`}
        name={key}
        type={type}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        value={values[key] as string}
        onChange={e => set(key, e.target.value)}
      />
      {fieldError(key)}
    </div>
  )

  const selectField = (
    key: keyof OidcUserFormValues,
    label: string,
    options: { id: number | string; name: string }[],
    optional = false
  ) => (
    <div className="w-full md:w-[48%] space-y-2">
      <AppSelect
        selectLabel={optional ? label : `${label} *`}
        selectValue={values[key] as string}
        selectOnChange={value => set(key, value)}
        selectPlaceholder={t('oidcUsers.select')}
        selectOptions={options}
        selectClassname="space-y-2"
      />
      {fieldError(key)}
    </div>
  )

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {templateError && (
        <p className="text-sm text-red-600">{t('oidcUsers.templateFailed')}</p>
      )}

      <div className="flex flex-wrap gap-6">
        {textField('username', t('oidcUsers.username'))}
        {textField('email', t('oidcUsers.email'), 'email')}
        {textField('firstName', t('oidcUsers.firstName'))}
        {textField('lastName', t('oidcUsers.lastName'))}

        {selectField(
          'preferredLanguage',
          t('oidcUsers.preferredLanguage'),
          ZITADEL_LANGUAGES.map(language => ({
            id: language.code,
            name: language.name,
          }))
        )}
        {selectField(
          'gender',
          t('oidcUsers.gender'),
          ZITADEL_GENDERS.map(gender => ({
            id: gender,
            name: t(`oidcUsers.genders.${gender}`),
          }))
        )}

        {selectField(
          'countryKey',
          t('oidcUsers.countryCode'),
          COUNTRY_CODES.map(country => ({
            id: country.key,
            name: `${country.key} (${country.code})`,
          }))
        )}
        {textField('phoneNumber', t('oidcUsers.phoneNumber'), 'tel')}

        {selectField('officeId', t('oidcUsers.office'), offices)}
        {selectField('staffId', t('oidcUsers.staff'), staff, true)}

        <div className="w-full md:w-[48%] space-y-2">
          <AppMultiSelect
            selectLabel={`${t('oidcUsers.roles')} *`}
            selectValues={values.roleIds}
            selectOnChange={ids => set('roleIds', ids)}
            selectPlaceholder={t('oidcUsers.select')}
            selectOptions={roles}
            selectClassname="space-y-2"
          />
          {fieldError('roleIds')}
        </div>

        {withPassword && (
          <>
            {textField('password', t('oidcUsers.password'), 'password')}
            {textField(
              'repeatPassword',
              t('oidcUsers.repeatPassword'),
              'password'
            )}
          </>
        )}
      </div>

      {withPassword && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('oidcUsers.passwordRules', {
            min: PASSWORD_MIN_LENGTH,
            max: PASSWORD_MAX_LENGTH,
          })}
        </p>
      )}

      {message}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onCancel}
          disabled={submitting}
        >
          {t('oidcUsers.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
          disabled={submitting || locked}
        >
          {submitting ? t('oidcUsers.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default OidcUserForm
