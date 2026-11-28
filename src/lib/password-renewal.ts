/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isAxiosError } from 'axios'
import type { AxiosInstance } from 'axios'
import {
  captureTarget,
  encodeBasicCredential,
  getAuthToken,
  getSignedInUser,
  requestTo,
  type RequestTarget,
} from '@/lib/http-client'

/**
 * Fineract makes a user change their password before anything else when
 * "force-password-reset-on-first-login" applies to them (a new user, or one
 * whose password an admin changed) or when "force-password-reset-days" has
 * expired it.
 *
 * Sign-in then answers 403 with shouldRenewPassword and the user's id and key,
 * and every other request answers 400 error.msg.password.outdated. The one
 * request Fineract still accepts is the user changing their own password,
 * POST /users/{userId}/pwd.
 */
export const PASSWORD_OUTDATED_CODE = 'error.msg.password.outdated'

/** Raised on window when a request fails because the password expired. */
export const PASSWORD_EXPIRED_EVENT = 'mifos:password-expired'

export interface PendingRenewal {
  userId: number
  username: string
  /** Basic credential (base64 of username:password) to change it with. */
  authKey: string
  /** At sign-in, or while already signed in. */
  reason: 'signIn' | 'expired'
  /**
   * The tenant the user belongs to. Another tab may sign in to a different
   * tenant meanwhile, and requests always go to the shared one, so the
   * change is only sent while that is still this tenant.
   */
  tenant: string
  /** The server it was issued by, for the same reason. */
  server: string
}

export interface PasswordExpiredDetail {
  userId: number | null
  /** The Authorization header the refused request carried. */
  authorization: string
  /** The tenant the refused request was sent to. */
  tenant: string
}

/**
 * Held in memory only. At sign-in nothing is stored until the new password is
 * saved, so a reload drops the half-finished sign-in instead of leaving a
 * credential behind that cannot open any page.
 */
let pending: PendingRenewal | null = null

export const getPendingRenewal = (): PendingRenewal | null => pending

export const setPendingRenewal = (renewal: PendingRenewal): void => {
  pending = renewal
}

export const clearPendingRenewal = (): void => {
  pending = null
}

interface AuthenticationBody {
  shouldRenewPassword?: boolean
  userId?: number
  base64EncodedAuthenticationKey?: string
}

const asRenewal = (
  body: AuthenticationBody | undefined,
  username: string,
  password: string,
  target: RequestTarget
): PendingRenewal | null => {
  if (!body?.shouldRenewPassword || typeof body.userId !== 'number') {
    return null
  }
  return {
    userId: body.userId,
    username,
    authKey:
      body.base64EncodedAuthenticationKey ||
      encodeBasicCredential(username, password),
    reason: 'signIn',
    // Where the sign-in went, read before it was sent: another tab can
    // change the stored tenant or server while it waits.
    tenant: target.tenant,
    server: target.server,
  }
}

/**
 * The renewal a sign-in asks for, or null. Current Fineract answers 403;
 * older versions answer 200 with the same flag, so both are read.
 */
export const getSignInRenewal = (
  result: { data?: unknown; error?: unknown },
  username: string,
  password: string,
  /** Where the sign-in request was sent. */
  target: RequestTarget
): PendingRenewal | null => {
  if (result.error !== undefined) {
    if (!isAxiosError(result.error)) return null
    if (result.error.response?.status !== 403) return null
    return asRenewal(
      result.error.response.data as AuthenticationBody,
      username,
      password,
      target
    )
  }

  return asRenewal(
    result.data as AuthenticationBody,
    username,
    password,
    target
  )
}

interface FineractErrorBody {
  userMessageGlobalisationCode?: string
  defaultUserMessage?: string
  errors?: {
    userMessageGlobalisationCode?: string
    defaultUserMessage?: string
    parameterName?: string
    args?: { value?: unknown }[]
  }[]
}

const errorBody = (error: unknown): FineractErrorBody | undefined =>
  isAxiosError(error)
    ? (error.response?.data as FineractErrorBody | undefined)
    : undefined

/** True when Fineract refused a request because the password must change. */
export const isPasswordOutdatedError = (error: unknown): boolean => {
  if (!isAxiosError(error) || error.response?.status !== 400) return false
  const body = errorBody(error)
  return (
    body?.userMessageGlobalisationCode === PASSWORD_OUTDATED_CODE ||
    !!body?.errors?.some(
      e => e.userMessageGlobalisationCode === PASSWORD_OUTDATED_CODE
    )
  )
}

/**
 * Whether an expiry report concerns the session as it is now: the stored
 * credential and the current tenant. A request sent before the password was
 * changed on Profile, or before signing in to another tenant, can still come
 * back refused; it says nothing about the current session.
 */
export const isForCurrentSession = (
  detail: PasswordExpiredDetail | undefined,
  storedToken: string | null,
  tenant: string
): boolean =>
  !!storedToken &&
  detail?.authorization === `Basic ${storedToken}` &&
  detail.tenant === tenant

/** The user id Fineract names in error.msg.password.outdated, if any. */
export const getOutdatedUserId = (error: unknown): number | null => {
  const detail = errorBody(error)?.errors?.find(
    e => e.userMessageGlobalisationCode === PASSWORD_OUTDATED_CODE
  )
  const value = Number(detail?.args?.[0]?.value)
  return Number.isInteger(value) && value > 0 ? value : null
}

/**
 * Fineract's own explanation of a refused request, such as the password
 * policy description or "a password used before". Field errors come first,
 * as they are the specific reason.
 */
export const getFineractErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const body = errorBody(error)
  return (
    body?.errors?.find(e => e.defaultUserMessage)?.defaultUserMessage ||
    body?.defaultUserMessage ||
    fallback
  )
}

/**
 * Changes the user's own password. With authKey the request carries that
 * credential instead of the stored one, which is how sign-in renewal works
 * before anything is stored.
 */
export const changeOwnPassword = async (
  client: AxiosInstance,
  userId: number,
  password: string,
  repeatPassword: string,
  authKey?: string,
  /** Where to send it; by default the stored server and tenant. */
  target: RequestTarget = captureTarget()
): Promise<void> => {
  const { url, headers } = requestTo(target, `/v1/users/${userId}/pwd`)
  await client.post(
    url,
    { password, repeatPassword },
    {
      headers: authKey
        ? { ...headers, Authorization: `Basic ${authKey}` }
        : headers,
    }
  )
}

/**
 * What a failed request can safely say in the console. An AxiosError keeps
 * the request's headers and body, which here hold the credential and the
 * passwords, so it is never logged whole.
 */
export const describeError = (
  error: unknown
): { status?: number; code?: string } => {
  if (!isAxiosError(error)) {
    return { code: error instanceof Error ? error.name : typeof error }
  }
  return {
    status: error.response?.status,
    code: errorBody(error)?.userMessageGlobalisationCode ?? error.code,
  }
}

/** Who is signed in, and where, as stored now. */
export interface SessionSnapshot {
  token: string | null
  server: string
  tenant: string
  userId: number | null
  username: string | null
}

export const captureSession = (): SessionSnapshot => {
  const user = getSignedInUser()
  const { server, tenant } = captureTarget()
  return {
    token: getAuthToken(),
    server,
    tenant,
    userId: user?.userId ?? null,
    username: user?.username ?? null,
  }
}

/**
 * Whether a session belongs to the given user in the given tenant. User ids
 * repeat across tenants, so the id alone does not say whose session it is.
 */
export const isSessionOf = (
  session: SessionSnapshot,
  user: { userId: number; username: string },
  target: RequestTarget
): boolean =>
  !!session.token &&
  session.userId === user.userId &&
  session.username === user.username &&
  session.tenant === target.tenant &&
  session.server === target.server

/**
 * Whether the stored session is still the one captured. Another tab can
 * sign in, to another tenant or as someone else, while a request waits;
 * every request reads the stored session when it is sent.
 */
export const isSameSession = (
  a: SessionSnapshot,
  b: SessionSnapshot
): boolean =>
  a.token === b.token &&
  a.server === b.server &&
  a.tenant === b.tenant &&
  a.userId === b.userId &&
  a.username === b.username
