/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

import fineract from '@/lib/axios'
import { getOidcPluginBaseUrl, type OidcUserDetails } from '@/lib/http-client'

/*
 * Client for the Mifos security plugin's endpoints
 * (openMF/mifos-security-plugin, SecurityController at /authentication):
 * establishing the signed-in user's session, and user administration.
 *
 * With OIDC enabled, identities live in Zitadel rather than in Fineract's
 * m_appuser table, so users are managed through the plugin, which updates
 * Zitadel and keeps the matching Fineract record in step. Types mirror the
 * plugin's DTOs.
 *
 * Requests go through the shared Axios instance with absolute URLs, so they
 * carry the bearer token and tenant header, are refused over cleartext, and
 * recover from an expired token like every other request.
 */

/** Envelope the plugin wraps most responses in. */
interface PluginResponse<T> {
  status: number
  msg: string
  object: T
}

export interface ZitadelUser {
  id: string
  /** USER_STATE_ACTIVE, USER_STATE_INACTIVE, USER_STATE_INITIAL, ... */
  state?: string
  userName?: string
  preferredLoginName?: string
  human?: {
    profile?: {
      firstName?: string
      lastName?: string
      nickName?: string
      displayName?: string
      preferredLanguage?: string
      gender?: string
    }
    email?: { email?: string; isEmailVerified?: boolean }
    phone?: { phone?: string }
  }
}

/** The Fineract side of a user, as the plugin reads it from m_appuser. */
export interface FineractUserRecord {
  office_id?: number
  staff_id?: number | null
  username_zitadel?: string
  firstname?: string
  lastname?: string
  roles?: Array<{ id: number; name?: string; description?: string }>
}

export interface CreateUserRequest {
  username: string
  givenName: string
  familyName: string
  nickName: string
  displayName: string
  preferredLanguage: string
  gender: string
  email: string
  phone: string
  password: string
}

export interface UpdateUserRequest {
  userId: string
  email: { email: string; isVerified: boolean }
  phone: { phone: string; isVerified: boolean }
  profile: {
    username: string
    givenName: string
    familyName: string
    displayName: string
    nickName: string
    preferredLanguage: string
    gender: string
  }
}

export interface FineractRecordRequest {
  id: string
  officeId: string
  staffId?: string
  username: string
  firstname: string
  lastname: string
  roleIds: string[]
}

export const USER_STATE_ACTIVE = 'USER_STATE_ACTIVE'

const url = (path: string): string => {
  const base = getOidcPluginBaseUrl()
  if (!base) {
    throw new Error('The OIDC security plugin URL is not configured.')
  }
  return `${base}authentication/${path}`
}

const unwrap = <T>(data: PluginResponse<T>): T => data.object

/** Why the plugin did not accept a sign-in. */
export type SignInFailure =
  /** Known to the identity provider but has no Fineract user. */
  | 'notProvisioned'
  /** The identity provider did not accept the token. */
  | 'rejected'
  | 'passwordExpired'
  | 'twoFactor'
  | 'failed'

export class SignInError extends Error {
  readonly reason: SignInFailure

  constructor(reason: SignInFailure, message?: string) {
    super(message ?? reason)
    this.name = 'SignInError'
    this.reason = reason
  }
}

/** UserDetailsDTO as the plugin serializes it. */
interface PluginUserDetails {
  username?: string
  officeId?: number
  officeName?: string
  roles?: Array<{ id: number; name?: string; description?: string }>
  permissions?: string[]
  shouldRenewPassword?: boolean
  // Jackson names the field after its isTwoFactorAuthenticationRequired()
  // getter; the second spelling is what the Angular client reads.
  twoFactorAuthenticationRequired?: boolean
  isTwoFactorAuthenticationRequired?: boolean
}

/**
 * Establishes who signed in, through the plugin's /authentication/userdetails.
 *
 * In OIDC mode Fineract runs with oauth2 disabled, so its own /v1/userdetails
 * does not exist; the plugin checks the token with the identity provider and
 * returns the user's Fineract office, roles and permissions instead. The same
 * call the Angular client makes.
 *
 * @param subject the token's sub claim. The plugin reports the user id as a
 *   number, but identity provider ids exceed what a JavaScript number holds
 *   exactly, so the claim is used instead.
 */
export const fetchSignedInUser = async (
  accessToken: string,
  subject: string
): Promise<OidcUserDetails> => {
  let data: PluginResponse<PluginUserDetails | null>
  try {
    const response = await fineract.post<
      PluginResponse<PluginUserDetails | null>
    >(
      url('userdetails'),
      { token: accessToken },
      // Sent explicitly so a credential left from an earlier session is not
      // attached instead; the token is not stored until this succeeds.
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    data = response.data
  } catch (error) {
    const status = (error as AxiosError).response?.status
    if (status === 404) throw new SignInError('notProvisioned')
    if (status === 400 || status === 401) throw new SignInError('rejected')
    throw new SignInError('failed', (error as Error).message)
  }

  // Some failures, such as a missing token, arrive as HTTP 200 with the real
  // status in the body.
  const details = data?.status === 200 ? data.object : null
  if (!details) throw new SignInError('failed', data?.msg)

  // Password and two-factor policies belong to the identity provider, and the
  // plugin currently always sends false. Honoured anyway, as the Angular
  // client intends, rather than signing in someone the server says is not
  // ready.
  if (details.shouldRenewPassword) throw new SignInError('passwordExpired')
  if (
    details.twoFactorAuthenticationRequired ||
    details.isTwoFactorAuthenticationRequired
  ) {
    throw new SignInError('twoFactor')
  }

  return {
    username: details.username,
    userId: subject,
    officeId: details.officeId,
    officeName: details.officeName,
    roles: details.roles ?? [],
    permissions: details.permissions ?? [],
  }
}

export const listUsers = async (): Promise<ZitadelUser[]> => {
  const { data } = await fineract.get<
    PluginResponse<{ result?: ZitadelUser[] }>
  >(url('user'))
  // Zitadel also lists machine (service) accounts, which cannot sign in to the
  // web app and have no profile to show.
  return (unwrap(data)?.result ?? []).filter(user => !!user.human)
}

export const getUser = async (userId: string): Promise<ZitadelUser | null> => {
  const { data } = await fineract.get<
    PluginResponse<{ result?: ZitadelUser[] }>
  >(url(`user/${encodeURIComponent(userId)}`))
  return unwrap(data)?.result?.[0] ?? null
}

export const getFineractRecord = async (
  userId: string
): Promise<FineractUserRecord> => {
  const { data } = await fineract.get<PluginResponse<FineractUserRecord>>(
    url(`user/db/${encodeURIComponent(userId)}`)
  )
  return unwrap(data) ?? {}
}

/** Creates the Zitadel identity and returns its user id. */
export const createUser = async (
  request: CreateUserRequest
): Promise<string> => {
  const { data } = await fineract.post<PluginResponse<{ userId?: string }>>(
    url('user'),
    request
  )
  const userId = unwrap(data)?.userId
  if (!userId) {
    throw new Error(
      data?.msg || 'The identity provider did not return a user id.'
    )
  }
  return userId
}

/** Creates the matching Fineract user with its office, staff and roles. */
export const createFineractRecord = async (
  request: FineractRecordRequest
): Promise<void> => {
  await fineract.post(url('user/db'), request)
}

/**
 * Grants roles in Zitadel. The plugin keys Zitadel project roles by Fineract
 * role id, so the same ids are sent as role keys.
 */
export const assignRoles = async (
  userId: string,
  roleIds: string[]
): Promise<void> => {
  await fineract.post(url('user/role'), { userId, roleKeys: roleIds })
}

export const updateUser = async (request: UpdateUserRequest): Promise<void> => {
  // Answers with a plain string rather than the usual envelope.
  await fineract.put(url('user'), request)
}

export const updateRoles = async (
  userId: string,
  roleIds: string[]
): Promise<void> => {
  await fineract.put(url('user/role'), { userId, roleKeys: roleIds })
}

export const updateOffice = async (
  userId: string,
  officeId: string,
  staffId?: string
): Promise<void> => {
  await fineract.put(url('user/office'), { userId, officeId, staffId })
}

export const activateUser = async (userId: string): Promise<void> => {
  await fineract.put(url(`user/act/${encodeURIComponent(userId)}`))
}

export const deactivateUser = async (userId: string): Promise<void> => {
  await fineract.put(url(`user/des/${encodeURIComponent(userId)}`))
}

export const deleteUser = async (userId: string): Promise<void> => {
  await fineract.delete(url(`user/${encodeURIComponent(userId)}`))
}

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await fineract.put(url('user/password'), {
    userId,
    currentPassword,
    newPassword: { password: newPassword, changeRequired: false },
  })
}

/** Zitadel error codes the password endpoint relays. */
export const PASSWORD_ERROR = {
  /** INVALID_ARGUMENT: the current password is wrong. */
  WRONG_CURRENT: 3,
  /** FAILED_PRECONDITION: the new password equals the current one. */
  SAME_AS_CURRENT: 9,
} as const

/**
 * The Zitadel error code inside a plugin error, if any. The plugin relays
 * Zitadel's own JSON error body as the message string.
 */
export const getZitadelErrorCode = (error: unknown): number | undefined => {
  const data = (error as AxiosError<{ message?: string }>).response?.data
  if (!data?.message) return undefined

  try {
    const parsed = JSON.parse(data.message) as { code?: number }
    return typeof parsed.code === 'number' ? parsed.code : undefined
  } catch {
    return undefined
  }
}

/** A readable message for a failed plugin call. */
export const getPluginErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const axiosError = error as AxiosError<{ msg?: string; message?: string }>
  const data = axiosError.response?.data

  if (data?.message) {
    try {
      const parsed = JSON.parse(data.message) as { message?: string }
      if (parsed.message) return parsed.message
    } catch {
      return data.message
    }
  }

  return data?.msg || axiosError.message || fallback
}
