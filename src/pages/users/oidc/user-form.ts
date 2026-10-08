/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'

import {
  StaffApi,
  UsersApi,
  type GetUsersTemplateResponse,
  type StaffData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

/*
 * Shared by the create and edit pages for users managed through the identity
 * provider. Offices, roles and staff still come from Fineract, as they do in
 * the Angular client: the plugin stores them on the Fineract side of the user.
 */

/** Offices and roles offered by Fineract's user template. */
export const useUserTemplate = () => {
  const [template, setTemplate] = useState<GetUsersTemplateResponse>()
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    new UsersApi(getConfiguration())
      .template22()
      .then(res => {
        if (!cancelled) setTemplate(res.data)
      })
      .catch(err => {
        console.error('Failed to fetch the user template', err)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    offices: (template?.allowedOffices ?? []).map(office => ({
      id: office.id ?? '',
      name: office.name ?? '',
    })),
    roles: (template?.availableRoles ?? []).map(role => ({
      id: role.id ?? '',
      name: role.name ?? '',
    })),
    loaded: !!template,
    error,
  }
}

/** Staff that belong to the given office. */
export const useOfficeStaff = (officeId: string) => {
  const [staff, setStaff] = useState<StaffData[]>([])

  useEffect(() => {
    if (!officeId) {
      setStaff([])
      return
    }
    let cancelled = false
    new StaffApi(getConfiguration())
      .retrieveAll16()
      .then(res => {
        if (cancelled) return
        setStaff(
          (res.data ?? []).filter(
            member => member.officeId?.toString() === officeId
          )
        )
      })
      .catch(err => console.error('Failed to fetch staff', err))
    return () => {
      cancelled = true
    }
  }, [officeId])

  return staff.map(member => ({
    id: member.id ?? '',
    name: member.displayName ?? '',
  }))
}

/*
 * Validation rules mirror the Angular client, which in turn mirrors the
 * password policy configured in Zitadel.
 */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 50

/**
 * Lower and upper case letters, a digit and a symbol; no whitespace and no
 * character repeated back to back.
 */
const PASSWORD_PATTERN =
  /^(?!.*(.)\1)(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9]{7,15}$/

export type PasswordProblem = 'length' | 'pattern' | null

export const checkPassword = (password: string): PasswordProblem => {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return 'length'
  }
  return PASSWORD_PATTERN.test(password) ? null : 'pattern'
}

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim())
export const isValidPhone = (phone: string) => PHONE_PATTERN.test(phone.trim())
