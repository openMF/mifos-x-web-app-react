/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { envConfig } from '@/lib/env-config'
import { getAuthHeaders } from '@/lib/http-client'
import type { CopilotEvent } from './events'
import { gatewayMode, type GatewayMode } from './gateway-mode'
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

export { gatewayMode, type GatewayMode } from './gateway-mode'

/** What this deployment's gateway setting allows; see gatewayMode. */
export function copilotGatewayMode(): GatewayMode {
  return gatewayMode(envConfig.copilotGatewayUrl)
}

/**
 * The transport this deployment is configured for: the gateway itself,
 * called with the signed-in officer's credential so Fineract's permissions
 * and audit trail apply to everything the assistant does, or the mock when
 * the gateway URL is the word 'mock'.
 */
export function createCopilotTransport(): CopilotTransport {
  const mode = copilotGatewayMode()
  if (mode === 'mock') return createMockTransport()

  // The launcher is hidden in this state, so this is only reached if
  // something else asks for a transport. Fail closed: no request is made.
  if (mode === 'off') {
    console.error(
      'Copilot unavailable: MIFOS_COPILOT_MCP_BASE_URL is empty, or is not https, so the credential would be sent in cleartext.'
    )
    return unavailableTransport()
  }

  return createV1Transport({
    baseUrl: envConfig.copilotGatewayUrl.trim(),
    // The same credential and tenant every Fineract call from this screen
    // carries, so the assistant acts in the tenant signed in to.
    getHeaders: getAuthHeaders,
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
