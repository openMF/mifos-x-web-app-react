/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Loopback hosts where cleartext http is acceptable for local development. */
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/**
 * Whether a URL is safe to carry credentials. Cleartext would expose bearer
 * tokens and authorization responses, so http is permitted only against
 * loopback, and only in a development build. Mirrors the Angular client's
 * requireHttps.
 */
export const isSecureUrl = (value: string): boolean => {
  if (!value) return true

  // A protocol-relative reference ("//example.com") looks relative but points
  // at another authority, so it must never take the same-origin shortcut.
  if (value.startsWith('//')) return false

  // Genuinely relative URLs (same-origin, e.g. behind the nginx proxy) are
  // governed by the page origin rather than by configuration.
  if (value.startsWith('/')) return true

  try {
    const url = new URL(value)
    if (url.protocol === 'https:') return true

    // Cleartext to loopback is a development convenience only. In a production
    // build, any process on the user's machine could receive the token, so the
    // exception does not apply there.
    return (
      import.meta.env.DEV &&
      url.protocol === 'http:' &&
      LOOPBACK_HOSTS.includes(url.hostname)
    )
  } catch {
    return false
  }
}
