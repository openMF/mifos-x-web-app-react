/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useState } from 'react'

import {
  isDisplayMode,
  type DisplayMode,
} from '@/components/copilot/copilot-ui'

const STORAGE_KEY = 'mifos-copilot-display-mode'

/** The officer's last display mode, kept on this browser only. */
export function useCopilotDisplayMode(): [
  DisplayMode,
  (mode: DisplayMode) => void,
] {
  const [mode, setMode] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return isDisplayMode(saved) ? saved : 'floating'
    } catch {
      return 'floating'
    }
  })

  const update = useCallback((next: DisplayMode) => {
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only.
    }
  }, [])

  return [mode, update]
}
