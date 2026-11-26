/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { isSecureUrl } from '@/lib/secure-url'

/**
 * What the configured gateway URL means for this deployment:
 * - `gateway`: a real gateway that is safe to send the credential to;
 * - `mock`: recorded answers, asked for by name;
 * - `off`: nothing usable, so the Copilot is not offered.
 */
export type GatewayMode = 'off' | 'mock' | 'gateway'

/**
 * Recorded answers are only served when the URL is the word `mock`. An empty
 * URL used to mean the same, so a deployment that switched the Copilot on
 * and forgot the URL showed officers invented clients and balances. Now it
 * means the Copilot is not configured.
 *
 * A cleartext URL is also `off`: the officer's credential travels with every
 * call. Loopback http is accepted in a development build only.
 */
export function gatewayMode(configuredUrl: string): GatewayMode {
  const url = configuredUrl.trim()
  if (!url) return 'off'
  if (url.toLowerCase() === 'mock') return 'mock'
  return isSecureUrl(url) ? 'gateway' : 'off'
}
