/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { test } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { LogoutPage } from '../pages/logout.page'

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {}
const skipBackendTests = !!env.SKIP_BACKEND_TESTS

test.describe('Logout confirmation', () => {
  let loginPage: LoginPage
  let logoutPage: LogoutPage

  test.beforeEach(async ({ page }) => {
    test.skip(
      skipBackendTests,
      'Skipping backend-dependent test (SKIP_BACKEND_TESTS set).'
    )

    loginPage = new LoginPage(page)
    logoutPage = new LogoutPage(page)

    await loginPage.navigate()
    await loginPage.loginAndWaitForDashboard('mifos', 'password')
  })

  test('asks for confirmation and keeps the session when cancelled', async () => {
    await logoutPage.requestLogout()
    await logoutPage.assertDialogVisible()
    // Opening the gate must not sign the user out on its own.
    await logoutPage.assertStillSignedIn()

    await logoutPage.cancelLogout()
    await logoutPage.assertDialogHidden()
    await logoutPage.assertStillSignedIn()
  })

  test('keeps the session when the confirmation is dismissed with Escape', async () => {
    await logoutPage.requestLogout()
    await logoutPage.assertDialogVisible()

    await logoutPage.dismissWithEscape()
    await logoutPage.assertDialogHidden()
    await logoutPage.assertStillSignedIn()
  })

  test('signs out only after the confirmation is accepted', async () => {
    await logoutPage.requestLogout()
    await logoutPage.assertDialogVisible()

    await logoutPage.confirmLogout()
    await logoutPage.assertSignedOut()
  })

  test('confirms sign-out from the navbar user menu', async () => {
    await logoutPage.requestLogoutFromNavbar()
    await logoutPage.assertDialogVisible()
    await logoutPage.assertStillSignedIn()

    await logoutPage.confirmLogout()
    await logoutPage.assertSignedOut()
  })
})
