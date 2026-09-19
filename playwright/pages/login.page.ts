/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { LOGIN_SELECTORS } from '../config/selectors'
import { ROUTES } from '../config/routes'

/**
 * LoginPage - React implementation of login page object.
 *
 * Core rule: only the LOGIN_SELECTORS map and the ROUTES.login
 * literal should differ across frameworks. Public method signatures
 * are identical to the Angular `LoginPage` so spec files can be
 * shared cross-repo (proposal §8 portability claim).
 *
 * Selectors are sourced from `playwright/config/selectors.ts`
 * (Layer 2 — typed contracts). The login route is sourced from
 * `playwright/config/routes.ts` (Layer 2 — route registry). The
 * previous in-file `SELECTORS` const and `/login` literal were
 * migrated to those modules in MXWAR-98 with no behavior change.
 */
export class LoginPage extends BasePage {
  readonly url = ROUTES.login

  constructor(page: Page) {
    super(page)
  }

  get usernameInput(): Locator {
    return this.page.locator(LOGIN_SELECTORS.usernameInput)
  }

  get passwordInput(): Locator {
    return this.page.locator(LOGIN_SELECTORS.passwordInput)
  }

  get loginButton(): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(LOGIN_SELECTORS.loginButton, 'i'),
    })
  }

  get errorMessages(): Locator {
    return this.page.locator(LOGIN_SELECTORS.errorMessage)
  }

  get rememberMeCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /remember me/i })
  }

  get forgotPasswordButton(): Locator {
    return this.page.getByRole('button', { name: /forgot password/i })
  }

  get passwordVisibilityToggle(): Locator {
    return this.page.getByRole('button', {
      name: /show password|hide password/i,
    })
  }

  get loadingIndicator(): Locator {
    return this.page.locator(
      LOGIN_SELECTORS.loadingIndicator ?? 'button[type="submit"]:disabled'
    )
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded')
    await this.waitForVisible(this.usernameInput, 30000)
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillField(this.usernameInput, username)
    await this.fillField(this.passwordInput, password)
    await this.loginButton.click()
  }

  async toggleRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.click()
  }

  async isRememberMeChecked(): Promise<boolean> {
    const value = await this.rememberMeCheckbox.getAttribute('aria-checked')
    return value === 'true'
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordVisibilityToggle.click()
  }

  async getPasswordInputType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type')
  }

  async submitLoginForm(): Promise<void> {
    await this.loginButton.click()
  }

  async getLocalStorageValue(key: string): Promise<string | null> {
    return this.page.evaluate(
      storageKey => localStorage.getItem(storageKey),
      key
    )
  }

  async loginAndWaitForDashboard(
    username: string,
    password: string
  ): Promise<void> {
    await this.login(username, password)
    await this.page.waitForURL(url => !url.pathname.includes('/login'), {
      timeout: 30000,
      waitUntil: 'networkidle',
    })
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    return this.loginButton.isEnabled()
  }

  async assertOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(\?.*)?$/)
    await expect(this.usernameInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.loginButton).toBeVisible()
    await expect(this.rememberMeCheckbox).toBeVisible()
  }

  async assertLoginSuccess(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login(\?.*)?$/, { timeout: 30000 })
  }

  async assertValidationError(): Promise<void> {
    await expect(this.errorMessages.first()).toBeVisible()
  }
}
