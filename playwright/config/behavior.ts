/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Layer 2 — Behavior flags.
 *
 * Isolates the places where Angular and React differ in UI behavior
 * so specs stay identical and only this file changes per framework.
 *
 * The Angular counterpart at
 * `openMF/web-app:playwright/config/behavior.ts`
 * carries the inverted values for the routing / snackbar / form
 * flags and a different `authStorageKey`.
 *
 * Not every flag is consumed today. The full set ships here so that
 * follow-on tickets (MXR-1.2 auth setup, MXR-2.x client specs) can
 * import from a stable contract instead of growing the file mid-PR.
 */

export const BEHAVIOR = {
  /**
   * React's login button stays enabled while the form is empty — it
   * only becomes disabled while the network request is in flight
   * (covered by `LoginPage.loadingIndicator`). Angular disables on
   * form invalidity (reactive forms).
   */
  loginButtonStartsDisabled: false,

  /**
   * React uses history-based routing — no `#` fragment. Specs that
   * branch on URL shape (e.g. regex assertions) read this flag.
   */
  usesHashRouting: false,

  /**
   * React surfaces authentication failures as inline error text
   * (`LOGIN_SELECTORS.errorMessage`). Angular surfaces them via a
   * Material snackbar overlay. Cross-framework auth helpers read
   * this flag to pick the correct assertion strategy.
   */
  authErrorShowsSnackbar: false,

  /**
   * React persists the Fineract auth token in `localStorage` under
   * this key. The `auth.setup.ts` work in MXR-1.2 reads this flag
   * to validate the session before writing `storageState`. The
   * Angular variant uses `sessionStorage` and a different key
   * (`mifosXCredentials`).
   */
  authStorageKey: 'mifosToken',

  /**
   * The `localStorage` key where the resolved Fineract server URL
   * is persisted at runtime. Exercised today by the
   * `should persist server and tenant values on submit` spec.
   */
  serverStorageKey: 'mifosServer',

  /**
   * The `localStorage` key where the active tenant identifier is
   * persisted at runtime. Exercised today by the same persistence
   * spec.
   */
  tenantStorageKey: 'mifosTenant',
} as const

export type Behavior = typeof BEHAVIOR
