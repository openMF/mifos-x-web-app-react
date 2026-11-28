/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isAxiosError } from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'
import {
  getAuthToken,
  getTenantId,
  isTwoFactorRemembered,
  TWO_FACTOR_HEADER,
  usernameFromBasicToken,
} from '@/lib/http-client'

/**
 * Fineract's two-factor authentication, for a server started with
 * fineract.security.2fa.enabled (FINERACT_SECURITY_2FA_ENABLED=true).
 *
 * Sign-in still checks the password, but answers
 * isTwoFactorAuthenticationRequired: true. From then on Fineract refuses
 * every request except the /twofactor ones until the request also carries an
 * access token in the Fineract-Platform-TFA-Token header:
 *
 *   GET  /twofactor                           delivery methods (email, SMS)
 *   POST /twofactor?deliveryMethod=email      sends a one-time code
 *   POST /twofactor/validate?token=CODE       exchanges the code for a token
 *   POST /twofactor/invalidate {token}        ends that token
 *
 * The generated client types every one of these answers as a string, so they
 * are typed here instead.
 *
 * Users with the BYPASS_TWOFACTOR permission are never asked.
 */

/** Raised on window when Fineract refuses a request for want of 2FA. */
export const TWO_FACTOR_REQUIRED_EVENT = 'mifos:two-factor-required'

/** Fineract's code for a wrong, used or expired one-time code. */
export const OTP_INVALID_CODE = 'error.msg.twofactor.otp.token.invalid'

export interface DeliveryMethod {
  /** "email" or "sms". */
  name: string
  /** The address or number the code goes to. */
  target: string
}

export interface OtpRequest {
  requestTime: number
  tokenLiveTimeInSec: number
  extendedAccessToken: boolean
  deliveryMethod: DeliveryMethod
}

export interface TwoFactorAccessToken {
  token: string
  /** Epoch milliseconds. */
  validFrom: number
  /** Epoch milliseconds. */
  validTo: number
}

export interface PendingVerification {
  username: string
  /** Basic credential (base64 of username:password) the code is asked with. */
  authKey: string
  /**
   * The tenant the user signed in to. Requests always go to the tenant last
   * chosen in any tab, so the code is only checked while that is still it.
   */
  tenant: string
  /** Ask Fineract for its longer-lived ("extended") access token. */
  rememberMe: boolean
  /**
   * At sign-in, or because the access token of a running session expired or
   * was refused.
   */
  reason: 'signIn' | 'expired'
  /** Fineract's sign-in answer, to finish the sign-in with. */
  user?: Record<string, unknown>
}

/**
 * Held in memory only. At sign-in nothing is stored until the code is
 * accepted, so a reload drops the half-finished sign-in instead of leaving a
 * password credential behind that cannot open any page.
 */
let pending: PendingVerification | null = null

export const getPendingVerification = (): PendingVerification | null => pending

export const setPendingVerification = (
  verification: PendingVerification
): void => {
  pending = verification
}

export const clearPendingVerification = (): void => {
  pending = null
}

/**
 * The verification a stored password session needs once its access token is
 * gone: it reuses the stored credential, so the user only enters a new code.
 */
export const verificationFromStoredSession = (): PendingVerification | null => {
  const authKey = getAuthToken()
  const username = authKey ? usernameFromBasicToken(authKey) : null
  if (!authKey || !username) return null
  return {
    username,
    authKey,
    tenant: getTenantId(),
    // Keep the choice made at sign-in.
    rememberMe: isTwoFactorRemembered(),
    reason: 'expired',
  }
}

/**
 * Where to go once the code is accepted: back to the page a resumed session
 * was on, when that is a page of this app, otherwise Home.
 */
export const returnPath = (state: unknown): string => {
  const from = (state as { from?: unknown } | null)?.from
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//') ||
    from.startsWith('/two-factor') ||
    from.startsWith('/login')
  ) {
    return '/home'
  }
  return from
}

/** True when a sign-in answer says the user still has to enter a code. */
export const requiresTwoFactor = (data: unknown): boolean =>
  !!data &&
  typeof data === 'object' &&
  (data as { isTwoFactorAuthenticationRequired?: unknown })
    .isTwoFactorAuthenticationRequired === true

const withCredential = (authKey: string) => ({
  headers: { Authorization: `Basic ${authKey}` },
})

/** Where the user can receive a code. Empty when no email or phone is set. */
export const fetchDeliveryMethods = async (
  client: AxiosInstance,
  authKey: string
): Promise<DeliveryMethod[]> => {
  const response = await client.get<unknown>(
    '/v1/twofactor',
    withCredential(authKey)
  )
  const data = response.data
  if (!Array.isArray(data)) return []
  return data.filter(
    (method): method is DeliveryMethod =>
      !!method &&
      typeof method.name === 'string' &&
      typeof method.target === 'string'
  )
}

/** Sends a new one-time code. Any earlier code stops working. */
export const requestOtp = async (
  client: AxiosInstance,
  authKey: string,
  deliveryMethod: string,
  extendedToken: boolean
): Promise<OtpRequest> => {
  const response = await client.post<OtpRequest>('/v1/twofactor', null, {
    ...withCredential(authKey),
    params: { deliveryMethod, extendedToken },
  })
  return response.data
}

/** Exchanges a one-time code for an access token. A code works only once. */
export const validateOtp = async (
  client: AxiosInstance,
  authKey: string,
  code: string
): Promise<TwoFactorAccessToken> => {
  const response = await client.post<TwoFactorAccessToken>(
    '/v1/twofactor/validate',
    null,
    { ...withCredential(authKey), params: { token: code } }
  )
  const token = response.data
  if (
    !token ||
    typeof token.token !== 'string' ||
    !token.token ||
    typeof token.validTo !== 'number'
  ) {
    throw new Error('Fineract returned no two-factor access token')
  }
  return token
}

/**
 * Ends an access token at Fineract, so a copy of it cannot be used after
 * sign-out. Never throws: sign-out has to finish either way.
 */
export const invalidateAccessToken = async (
  client: AxiosInstance,
  authKey: string,
  token: string,
  timeoutMs = 5000
): Promise<boolean> => {
  try {
    await client.post(
      '/v1/twofactor/invalidate',
      { token },
      {
        headers: {
          Authorization: `Basic ${authKey}`,
          [TWO_FACTOR_HEADER]: token,
        },
        timeout: timeoutMs,
      }
    )
    return true
  } catch (error) {
    console.error('Could not end the two-factor access token', error)
    return false
  }
}

interface FineractErrorBody {
  userMessageGlobalisationCode?: string
  errors?: { userMessageGlobalisationCode?: string }[]
}

/**
 * Fineract's explanation of a refused request, such as a validation error.
 * Field errors come first, as they are the specific reason.
 */
export const getFineractErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (!isAxiosError(error)) return fallback
  const body = error.response?.data as
    | {
        defaultUserMessage?: string
        errors?: { defaultUserMessage?: string }[]
      }
    | undefined
  return (
    body?.errors?.find(e => e.defaultUserMessage)?.defaultUserMessage ||
    body?.defaultUserMessage ||
    fallback
  )
}

/** True when Fineract refused a one-time code (wrong, used or expired). */
export const isOtpInvalidError = (error: unknown): boolean => {
  if (!isAxiosError(error)) return false
  const body = error.response?.data as FineractErrorBody | undefined
  return (
    body?.userMessageGlobalisationCode === OTP_INVALID_CODE ||
    !!body?.errors?.some(
      e => e.userMessageGlobalisationCode === OTP_INVALID_CODE
    )
  )
}

/** A request header of a refused request, whatever its letter case. */
const header = (error: AxiosError, name: string): string => {
  const headers = error.config?.headers as unknown
  if (!headers || typeof headers !== 'object') return ''

  const get = (headers as { get?: unknown }).get
  if (typeof get === 'function') {
    const value = get.call(headers, name)
    if (value != null && value !== false) return String(value)
  }

  const wanted = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted && value != null) return String(value)
  }
  return ''
}

const pathOf = (url?: string): string => {
  if (!url) return ''
  try {
    return new URL(url, 'https://fineract.invalid').pathname
  } catch {
    return ''
  }
}

/**
 * True when Fineract refused a password-session request because its
 * two-factor access token is missing (403) or no longer valid (401).
 *
 * Both come from the security filter, before Fineract's own error handling,
 * so their body is Spring's bare { status, error, path } with no Fineract
 * error code. That tells them apart from a permission error (403 with
 * error.msg.not.authorized...) and a refused one-time code. A 401 without an
 * access token is a wrong password instead, and stays with the caller.
 */
export const isTwoFactorRejection = (error: unknown): boolean => {
  if (!isAxiosError(error) || !error.response) return false

  const status = error.response.status
  if (status !== 401 && status !== 403) return false

  if (!header(error, 'Authorization').startsWith('Basic ')) return false

  // The sign-in and code requests answer for themselves.
  const path = pathOf(error.config?.url)
  if (/\/twofactor(\/|$)/.test(path) || /\/authentication$/.test(path)) {
    return false
  }

  const body = error.response.data as FineractErrorBody | string | undefined
  if (
    body &&
    typeof body === 'object' &&
    (body.userMessageGlobalisationCode || body.errors)
  ) {
    return false
  }

  const sentToken = !!header(error, TWO_FACTOR_HEADER)
  return sentToken || status === 403
}

export interface TwoFactorRequiredDetail {
  /** The Authorization header the refused request carried. */
  authorization: string
}

/** Tells the signed-in layout that a new code is needed, then rejects. */
export const announceTwoFactorRequired = (
  error: AxiosError
): Promise<never> => {
  const detail: TwoFactorRequiredDetail = {
    authorization: header(error, 'Authorization'),
  }
  window.dispatchEvent(new CustomEvent(TWO_FACTOR_REQUIRED_EVENT, { detail }))
  return Promise.reject(error)
}

/**
 * Settings of /twofactor/configure, under Fineract's own names. Times are in
 * seconds. The SMS provider is the id of an SMS bridge of the message
 * gateway.
 */
export interface TwoFactorConfiguration {
  'otp-delivery-email-enable': boolean
  'otp-delivery-email-subject': string
  'otp-delivery-email-body': string
  'otp-delivery-sms-enable': boolean
  'otp-delivery-sms-provider': number
  'otp-delivery-sms-text': string
  'otp-token-length': number
  'otp-token-live-time': number
  'access-token-live-time': number
  'access-token-live-time-extended': number
}

export type TwoFactorConfigurationKey = keyof TwoFactorConfiguration

export const TWO_FACTOR_CONFIGURATION_KEYS: TwoFactorConfigurationKey[] = [
  'otp-delivery-email-enable',
  'otp-delivery-email-subject',
  'otp-delivery-email-body',
  'otp-delivery-sms-enable',
  'otp-delivery-sms-provider',
  'otp-delivery-sms-text',
  'otp-token-length',
  'otp-token-live-time',
  'access-token-live-time',
  'access-token-live-time-extended',
]

/** The settings, or null when two-factor is off on this server (404). */
export const fetchTwoFactorConfiguration = async (
  client: AxiosInstance
): Promise<TwoFactorConfiguration | null> => {
  try {
    const response = await client.get<TwoFactorConfiguration>(
      '/v1/twofactor/configure'
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

/** The settings that differ from the current ones. */
export const changedConfiguration = (
  current: TwoFactorConfiguration,
  edited: TwoFactorConfiguration
): Partial<TwoFactorConfiguration> => {
  const changes: Partial<Record<TwoFactorConfigurationKey, unknown>> = {}
  for (const key of TWO_FACTOR_CONFIGURATION_KEYS) {
    if (edited[key] !== current[key]) changes[key] = edited[key]
  }
  return changes as Partial<TwoFactorConfiguration>
}

export const updateTwoFactorConfiguration = async (
  client: AxiosInstance,
  changes: Partial<TwoFactorConfiguration>
): Promise<void> => {
  await client.put('/v1/twofactor/configure', changes)
}
