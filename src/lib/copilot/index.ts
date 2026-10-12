/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { envConfig } from '@/lib/env-config'
import { getAuthHeaders } from '@/lib/http-client'
import { isSecureUrl } from '@/lib/secure-url'
import type { CopilotEvent } from './events'
import { createMockTransport } from './mock'
import { createV1Transport, type CopilotTransport } from './transport'

export type * from './events'
export type {
  ChatInput,
  CopilotContext,
  CopilotTransport,
  Decision,
} from './transport'
export type {
  CopilotAction,
  CopilotMessage,
  CopilotThread,
  ToolStep,
  TurnPhase,
} from './reducer'
export { copilotReducer, initialThread, isTurnActive } from './reducer'
export {
  MAX_INPUT_LENGTH,
  sanitizeInput,
  type SanitizeResult,
} from './input-sanitizer'

/**
 * The transport this deployment is configured for: the mock when the gateway
 * URL is 'mock' or empty, otherwise the gateway itself, called with the
 * signed-in officer's credential so Fineract's permissions and audit trail
 * apply to everything the assistant does.
 */
export function createCopilotTransport(): CopilotTransport {
  const url = envConfig.copilotGatewayUrl.trim()
  if (!url || url === 'mock') return createMockTransport()

  // The officer's credential travels with every call, so a cleartext gateway
  // would expose it. Fail closed, as getAuthHeaders does for Fineract.
  if (!isSecureUrl(url)) {
    console.error(
      'Copilot disabled: the gateway URL is not https, so the credential would be sent in cleartext.'
    )
    return unavailableTransport()
  }

  return createV1Transport({
    baseUrl: url,
    getHeaders: () => ({
      ...getAuthHeaders(),
      // The tenant chosen at sign-in, which the axios client sends on every
      // Fineract call (lib/axios.ts). The assistant must act in that tenant.
      'Fineract-Platform-TenantId':
        localStorage.getItem('mifosTenant') || 'default',
    }),
    getBackendOrigin,
  })
}

/**
 * Origin of the Fineract this screen talks to, for the gateway's check that
 * it acts on the same bank. It follows the axios client (lib/axios.ts): the
 * server chosen at sign-in, unless the API URL is empty or relative. Then
 * requests go through a proxy and the real backend is not known here;
 * sending the page's own origin would make the gateway refuse every turn.
 */
export function getBackendOrigin(): string | undefined {
  const apiUrl = envConfig.apiUrl.trim()
  if (!apiUrl || apiUrl.startsWith('/')) return undefined
  const server = (
    localStorage.getItem('mifosServer') || 'https://localhost:8443'
  ).trim()
  try {
    return new URL(server).origin
  } catch {
    return undefined
  }
}

function unavailableTransport(): CopilotTransport {
  async function* unavailable(): AsyncGenerator<CopilotEvent> {
    yield { type: 'RunError', code: 'INTERNAL', retryable: false }
  }
  return { chat: unavailable, decide: unavailable }
}
