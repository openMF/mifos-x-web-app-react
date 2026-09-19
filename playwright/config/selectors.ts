/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Layer 2 — Typed selector contracts.
 *
 * One of three Layer-2 contracts (along with `routes.ts` and
 * `behavior.ts`) that differ between Angular and React. All page
 * objects consume these typed maps. Specs never reference selectors
 * directly — they call page object methods only.
 *
 * Angular counterpart lives in
 * `openMF/web-app:playwright/config/selectors.ts`
 * and uses `formcontrolname` / `mat-*` selectors instead of the
 * `name` / `data-testid` selectors used here.
 *
 * Interface signatures mirror the Angular file so a port across
 * frameworks is a configuration swap, not a code rewrite.
 *
 * Historical note: the `LoginSelectors` interface previously lived
 * in `playwright/types/selectors.ts` (added in MXWAR-76). This file
 * supersedes that location — keep the same interface shape so
 * existing consumers do not break, then add interfaces for future
 * page objects alongside.
 */

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface LoginSelectors {
  usernameInput: string
  passwordInput: string
  loginButton: string
  errorMessage: string
  loadingIndicator?: string
}

export const LOGIN_SELECTORS: LoginSelectors = {
  usernameInput: 'input[name="username"]',
  passwordInput: 'input[name="password"]',
  loginButton: 'submit|log\\s*in',
  errorMessage: '.text-red-500',
  loadingIndicator: 'button[type="submit"]:disabled',
}

// ---------------------------------------------------------------------------
// Dashboard / shell
// ---------------------------------------------------------------------------

export interface DashboardSelectors {
  toolbar: string
}

export const DASHBOARD_SELECTORS: DashboardSelectors = {
  toolbar: 'header',
}

// ---------------------------------------------------------------------------
// Client — create form (consumed by future ClientCreatePage in MXR-2.x)
// ---------------------------------------------------------------------------

export interface CreateClientSelectors {
  officeDropdown: string
  firstnameInput: string
  lastnameInput: string
  submitButton: string
  validationError: string
}

export const CREATE_CLIENT_SELECTORS: CreateClientSelectors = {
  officeDropdown: '[data-testid="office-select"]',
  firstnameInput: 'input[name="firstname"]',
  lastnameInput: 'input[name="lastname"]',
  submitButton: 'button[type="submit"]',
  validationError: '.text-destructive',
}

// ---------------------------------------------------------------------------
// Client — view / actions (consumed by future ClientViewPage in MXR-2.x)
// ---------------------------------------------------------------------------

export interface ClientViewSelectors {
  statusBadge: string
  actionsButton: string
  successSnackbar: string
  personalDataTab: string
  closedDateLabel: string
}

export const CLIENT_VIEW_SELECTORS: ClientViewSelectors = {
  statusBadge: '[data-testid="client-status"]',
  actionsButton: '[data-testid="client-actions-button"]',
  successSnackbar: '[data-testid="success-toast"]',
  personalDataTab: '[data-testid="tab-personal-data"]',
  closedDateLabel: '[data-testid="closed-date-value"]',
}

// ---------------------------------------------------------------------------
// Close client action form (consumed by future CloseClientPage in MXR-3.x)
// ---------------------------------------------------------------------------

export interface CloseClientSelectors {
  closureDateInput: string
  closureReasonSelect: string
  confirmButton: string
  cancelButton: string
}

export const CLOSE_CLIENT_SELECTORS: CloseClientSelectors = {
  closureDateInput: 'input[name="closureDate"]',
  closureReasonSelect: '[data-testid="closure-reason-select"]',
  confirmButton: 'button[type="submit"]',
  cancelButton: 'button[data-testid="cancel-button"]',
}
