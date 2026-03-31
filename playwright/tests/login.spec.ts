/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login.page'

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {}
const skipBackendTests = !!env.SKIP_BACKEND_TESTS

test.describe('Login Page', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.navigate()
  })

  test('should display the login form', async () => {
    await loginPage.assertOnLoginPage()
  })

  test('should keep login button enabled when form is empty', async () => {
    await expect(loginPage.loginButton).toBeEnabled()
  })

  test('should have proper page title', async ({ page }) => {
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(loginPage.loginButton).toBeVisible()
  })

  test('should fill form fields', async () => {
    await loginPage.fillField(loginPage.usernameInput, 'mifos')
    await loginPage.fillField(loginPage.passwordInput, 'password')

    await expect(loginPage.usernameInput).toHaveValue('mifos')
    await expect(loginPage.passwordInput).toHaveValue('password')
    await expect(loginPage.loginButton).toBeEnabled()
  })

  test('should support long and special-character credentials', async () => {
    const longUsername =
      'user.with+alias_and-very_long_name_1234567890@example.mifos.community'
    const specialPassword = 'P@$$w0rd!#%&*()_+{}[]|:;<>,.?/~'

    await loginPage.fillField(loginPage.usernameInput, longUsername)
    await loginPage.fillField(loginPage.passwordInput, specialPassword)

    await expect(loginPage.usernameInput).toHaveValue(longUsername)
    await expect(loginPage.passwordInput).toHaveValue(specialPassword)
  })

  test('should toggle remember me checkbox', async () => {
    await expect(loginPage.rememberMeCheckbox).toBeVisible()
    expect(await loginPage.isRememberMeChecked()).toBe(false)

    await loginPage.toggleRememberMe()
    expect(await loginPage.isRememberMeChecked()).toBe(true)

    await loginPage.toggleRememberMe()
    expect(await loginPage.isRememberMeChecked()).toBe(false)
  })

  test('should toggle password visibility', async () => {
    await loginPage.fillField(loginPage.passwordInput, 'password')

    expect(await loginPage.getPasswordInputType()).toBe('password')

    await loginPage.togglePasswordVisibility()
    expect(await loginPage.getPasswordInputType()).toBe('text')

    await loginPage.togglePasswordVisibility()
    expect(await loginPage.getPasswordInputType()).toBe('password')
  })

  test('should persist server and tenant values on submit', async () => {
    await loginPage.fillField(loginPage.usernameInput, 'mifos')
    await loginPage.fillField(loginPage.passwordInput, 'password')

    await loginPage.submitLoginForm()

    await expect
      .poll(async () => loginPage.getLocalStorageValue('mifosServer'))
      .toBeTruthy()
    await expect
      .poll(async () => loginPage.getLocalStorageValue('mifosTenant'))
      .toBe('default')
  })

  test('should show forgot password action', async () => {
    await expect(loginPage.forgotPasswordButton).toBeVisible()
    await expect(loginPage.forgotPasswordButton).toBeEnabled()
  })

  test('should successfully login', async () => {
    test.skip(
      skipBackendTests,
      'Skipping backend-dependent test (SKIP_BACKEND_TESTS set).'
    )

    await loginPage.loginAndWaitForDashboard('mifos', 'password')
    await loginPage.assertLoginSuccess()
  })

  test('should handle invalid credentials', async () => {
    test.skip(
      skipBackendTests,
      'Skipping backend-dependent test (SKIP_BACKEND_TESTS set).'
    )

    await loginPage.login('mifos', 'wrongpassword')
    await loginPage.assertValidationError()
    await loginPage.assertOnLoginPage()
  })

  test('codegen baseline: login with mifos credentials', async () => {
    test.skip(
      skipBackendTests,
      'Skipping backend-dependent test (SKIP_BACKEND_TESTS set).'
    )

    await loginPage.login('mifos', 'password')
    await loginPage.assertLoginSuccess()
  })
})
