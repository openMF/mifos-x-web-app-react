/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'frequentlyAccessed'

type VisitCounts = Record<string, number>

const readCounts = (): VisitCounts => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}'
    )
    return parsed && typeof parsed === 'object' ? (parsed as VisitCounts) : {}
  } catch {
    return {}
  }
}

const writeCounts = (counts: VisitCounts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
  } catch {
    // Storage can be unavailable (private mode, quota), tracking is optional
  }
}

/**
 * Counts visits to the given routes and returns the most visited ones,
 * most visited first. A visit is counted when the current path is the
 * route itself or one of its sub-pages.
 */
export const useFrequentlyAccessed = (routes: string[], limit = 3) => {
  const { pathname } = useLocation()
  const [counts, setCounts] = useState<VisitCounts>(readCounts)

  useEffect(() => {
    const visited = routes.find(
      route => pathname === `/${route}` || pathname.startsWith(`/${route}/`)
    )
    if (!visited) return

    const next = readCounts()
    next[visited] = (next[visited] ?? 0) + 1
    writeCounts(next)
    setCounts(next)
    // routes is a static list, only a navigation should count as a visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return routes
    .filter(route => (counts[route] ?? 0) > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, limit)
}
