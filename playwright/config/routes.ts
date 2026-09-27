/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Layer 2 — Route registry.
 *
 * React uses history-based routing (`/login`, `/clients`).
 * Angular uses hash-based routing (`/#/login`, `/#/clients`).
 *
 * Specs never hard-code routes — they consume this registry through
 * page object `navigate()` calls. The `AppRoutes` interface mirrors
 * the Angular counterpart at
 * `openMF/web-app:playwright/config/routes.ts`
 * so a portability swap is config-only.
 */

export interface AppRoutes {
  login: string
  home: string
  clients: string
  clientCreate: string
  clientView: (id: number) => string
  clientAction: (id: number, action: string) => string
  groups: string
  groupCreate: string
  groupView: (id: number) => string
  users: string
  userCreate: string
  userView: (id: number) => string
}

export const ROUTES: AppRoutes = {
  login: '/login',
  home: '/home',
  clients: '/clients',
  clientCreate: '/clients/create',
  clientView: id => `/clients/${id}`,
  clientAction: (id, action) => `/clients/${id}/actions/${action}`,
  groups: '/groups',
  groupCreate: '/groups/create',
  groupView: id => `/groups/${id}`,
  users: '/users',
  userCreate: '/users/create',
  userView: id => `/users/${id}`,
}
