/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ReactReduxContext } from 'react-redux'

import type { RootState } from '@/app/store'
import {
  CopilotEntityContext,
  type CopilotEntityDetails,
} from '@/context/copilot-entity-context'
import {
  detectContextFromPath,
  getBackendOrigin,
  type CopilotContext,
} from '@/lib/copilot'

export type { CopilotEntityDetails } from '@/context/copilot-entity-context'
export { CopilotContextProvider } from '@/context/CopilotContext'

/**
 * Hook for views to attach active entity details (like clientName)
 * to the global Copilot context while mounted.
 */
export function useSetCopilotEntity(details: CopilotEntityDetails | null) {
  const { setEntity } = useContext(CopilotEntityContext)
  const clientName = details?.clientName
  const clientId = details?.clientId
  const loanId = details?.loanId
  const savingsId = details?.savingsId

  useEffect(() => {
    if (
      clientName != null ||
      clientId != null ||
      loanId != null ||
      savingsId != null
    ) {
      setEntity({ clientName, clientId, loanId, savingsId })
    } else {
      setEntity(null)
    }
    return () => {
      setEntity(null)
    }
  }, [clientName, clientId, loanId, savingsId, setEntity])
}

function useSafeAuth() {
  const context = useContext(ReactReduxContext)
  return useSyncExternalStore(
    context?.store ? context.store.subscribe : () => () => {},
    () => (context?.store ? (context.store.getState() as RootState).auth : null)
  )
}

function useSafePathname(): string {
  try {
    const location = useLocation()
    return location.pathname
  } catch {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname
    }
    return '/'
  }
}

/**
 * Verifies whether registered entity metadata belongs to the currently active route.
 * Prevents stale data from a previous client or loan leaking into the new route
 * while asynchronous data fetching is in-flight.
 */
export function resolveEntityContext(
  detected: Partial<CopilotContext>,
  entity: CopilotEntityDetails | null
): {
  clientId: number | null
  clientName: string | null
  loanId: number | null
  savingsId: number | null
} {
  // 1. URL route IDs are strictly authoritative
  const routeClientId = detected.clientId ?? null
  const routeLoanId = detected.loanId ?? null
  const routeSavingsId = detected.savingsId ?? null

  if (!entity) {
    return {
      clientId: routeClientId,
      clientName: null,
      loanId: routeLoanId,
      savingsId: routeSavingsId,
    }
  }

  // 2. Validate loan route
  if (routeLoanId != null) {
    if (entity.loanId === routeLoanId) {
      return {
        loanId: routeLoanId,
        // Enrich clientId only if not present in URL
        clientId: routeClientId ?? entity.clientId ?? null,
        clientName: entity.clientName ?? null,
        savingsId: null,
      }
    }
    // Stale loan entity: discard entity data while new loan is fetching
    return {
      loanId: routeLoanId,
      clientId: routeClientId,
      clientName: null,
      savingsId: null,
    }
  }

  // 3. Validate savings route
  if (routeSavingsId != null) {
    if (entity.savingsId === routeSavingsId) {
      return {
        savingsId: routeSavingsId,
        clientId: routeClientId ?? entity.clientId ?? null,
        clientName: entity.clientName ?? null,
        loanId: null,
      }
    }
    // Stale savings entity: discard entity data while new savings is fetching
    return {
      savingsId: routeSavingsId,
      clientId: routeClientId,
      clientName: null,
      loanId: null,
    }
  }

  // 4. Validate client-detail route
  if (routeClientId != null) {
    if (entity.clientId === routeClientId) {
      return {
        clientId: routeClientId,
        clientName: entity.clientName ?? null,
        loanId: null,
        savingsId: null,
      }
    }
    // Stale client entity: discard entity data while new client is fetching
    return {
      clientId: routeClientId,
      clientName: null,
      loanId: null,
      savingsId: null,
    }
  }

  // 5. General routes without entity IDs in URL (e.g. /home, /clients, /loans)
  return {
    clientId: null,
    clientName: null,
    loanId: null,
    savingsId: null,
  }
}

/**
 * Copilot Context Detection Service Hook (AIContextService equivalent).
 *
 * Observes:
 * 1. React Router (useLocation) -> Active route path and URL params
 * 2. Redux Store (state.auth) -> Officer authentication & tenant state
 * 3. CopilotEntityContext -> Screen-registered entity details (clientName, etc.)
 * 4. i18n -> Current language
 * 5. Fineract backend origin
 *
 * Returns a complete, populated CopilotContext object attached to Copilot chat turns.
 */
export function useCopilotContext(): CopilotContext {
  const pathname = useSafePathname()
  const { entity } = useContext(CopilotEntityContext)
  const { i18n } = useTranslation()
  const auth = useSafeAuth()

  const detected = useMemo(() => detectContextFromPath(pathname), [pathname])

  return useMemo<CopilotContext>(() => {
    const backendOrigin = getBackendOrigin()
    const language = i18n.language ? i18n.language.split('-')[0] : 'en'

    // Securely resolve entity details with route-match guards
    const resolved = resolveEntityContext(detected, entity)

    return {
      screen: detected.screen ?? 'home',
      clientId: resolved.clientId,
      clientName: resolved.clientName,
      loanId: resolved.loanId,
      savingsId: resolved.savingsId,
      language,
      ...(backendOrigin ? { backendOrigin } : {}),
      // Auth metadata readily available for gateway validation
      ...(auth?.isAuthenticated ? {} : {}),
    }
  }, [detected, entity, i18n.language, auth?.isAuthenticated])
}
