/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useLayoutEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'theme'
const THEME_CHANGE_EVENT = 'mifos-theme-change'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

const getThemePreference = (): ThemePreference => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return isThemePreference(savedTheme) ? savedTheme : 'light'
}

const isDarkTheme = (theme: ThemePreference): boolean =>
  theme === 'dark' ||
  (theme === 'system' && window.matchMedia(SYSTEM_DARK_QUERY).matches)

const applyTheme = (theme: ThemePreference) => {
  document.documentElement.classList.toggle('dark', isDarkTheme(theme))
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemePreference>(getThemePreference)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia(SYSTEM_DARK_QUERY).matches
  )

  useLayoutEffect(() => {
    const syncPreference = () => setThemeState(getThemePreference())
    const syncStoragePreference = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        syncPreference()
      }
    }
    const syncSystemPreference = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches)
      if (getThemePreference() === 'system') {
        applyTheme('system')
      }
    }
    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY)

    applyTheme(theme)
    window.addEventListener(THEME_CHANGE_EVENT, syncPreference)
    window.addEventListener('storage', syncStoragePreference)
    mediaQuery.addEventListener('change', syncSystemPreference)

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncPreference)
      window.removeEventListener('storage', syncStoragePreference)
      mediaQuery.removeEventListener('change', syncSystemPreference)
    }
  }, [theme])

  const setTheme = (newTheme: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    setThemeState(newTheme)
    applyTheme(newTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return {
    theme,
    isDark: theme === 'dark' || (theme === 'system' && systemDark),
    setTheme,
  }
}
