/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import auth from '@/locales/en-US/auth.json'
import common from '@/locales/en-US/common.json'
import copilot from '@/locales/en-US/copilot.json'

/**
 * Setup for component tests (`*.test.tsx`, run in jsdom).
 *
 * Strings load synchronously in English, so tests can find elements by the
 * words an officer reads. Add a namespace here when a tested component
 * needs one.
 */
void i18next.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  ns: ['auth', 'common', 'copilot'],
  defaultNS: 'common',
  resources: { 'en-US': { auth, common, copilot } },
  interpolation: { escapeValue: false },
})

// Browser features jsdom does not have. Each stands in with the quietest
// answer: no media query matches, and nothing is ever resized.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
