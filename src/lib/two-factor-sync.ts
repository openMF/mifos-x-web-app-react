/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  getAuthToken,
  getStoredTwoFactorToken,
  setTwoFactorToken,
} from '@/lib/http-client'

/**
 * Shares a two-factor token kept in sessionStorage (signed in without
 * "Remember me") between the tabs of one browser session, the way the
 * Angular web app's SessionSyncService does. Without it, every new tab would
 * ask for a new one-time code.
 *
 * A token is only handed over for the same stored password credential, so a
 * tab never receives another user's token.
 */
const CHANNEL_NAME = 'mifos-two-factor'
const TOKEN_KEY = 'mifosTwoFactorToken'
const CREDENTIAL_KEY = 'mifosToken'

type SyncMessage =
  | { type: 'REQUEST_TOKEN'; authorization: string }
  | {
      type: 'PROVIDE_TOKEN'
      authorization: string
      token: string
      validTo: number
    }

let channel: BroadcastChannel | null = null

const hasSessionToken = (): boolean =>
  typeof sessionStorage !== 'undefined' &&
  !!sessionStorage.getItem(TOKEN_KEY) &&
  !!getStoredTwoFactorToken()

/** Starts answering other tabs. Safe to call more than once. */
export const startTwoFactorSync = (): void => {
  if (channel || typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel(CHANNEL_NAME)

  channel.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
    const message = event.data
    const authorization = getAuthToken()
    if (!message || !authorization) return

    if (
      message.type === 'REQUEST_TOKEN' &&
      message.authorization === authorization &&
      hasSessionToken()
    ) {
      const stored = getStoredTwoFactorToken()
      if (!stored) return
      channel?.postMessage({
        type: 'PROVIDE_TOKEN',
        authorization,
        token: stored.token,
        validTo: stored.validTo,
      } satisfies SyncMessage)
    }
  })

  // Another tab signed out or in as someone else: this tab's copy belongs to
  // the previous credential, so drop it. A remembered token is shared through
  // localStorage and changes there by itself.
  window.addEventListener('storage', event => {
    if (
      (event.key === CREDENTIAL_KEY || event.key === null) &&
      typeof sessionStorage !== 'undefined'
    ) {
      sessionStorage.removeItem(TOKEN_KEY)
    }
  })
}

/**
 * Asks the other tabs for their token. Resolves true once one is stored
 * here, or false when no tab answers in time.
 */
export const requestSharedTwoFactorToken = (
  timeoutMs = 500
): Promise<boolean> => {
  const authorization = getAuthToken()
  if (typeof BroadcastChannel === 'undefined' || !authorization) {
    return Promise.resolve(false)
  }

  return new Promise(resolve => {
    const listener = new BroadcastChannel(CHANNEL_NAME)
    const finish = (result: boolean) => {
      window.clearTimeout(timer)
      listener.close()
      resolve(result)
    }
    const timer = window.setTimeout(() => finish(false), timeoutMs)

    listener.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
      const message = event.data
      if (
        message?.type === 'PROVIDE_TOKEN' &&
        message.authorization === getAuthToken() &&
        typeof message.token === 'string' &&
        typeof message.validTo === 'number' &&
        message.validTo > Date.now()
      ) {
        setTwoFactorToken(message.token, message.validTo, false)
        finish(true)
      }
    })

    listener.postMessage({
      type: 'REQUEST_TOKEN',
      authorization,
    } satisfies SyncMessage)
  })
}
