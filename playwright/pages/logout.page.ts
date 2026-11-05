/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { LOGOUT_SELECTORS } from '../config/selectors'
import { ROUTES } from '../config/routes'
import { BEHAVIOR } from '../config/behavior'

/**
 * LogoutPage - confirmation gate around the sign-out action.
 *
 * Selectors are sourced from `playwright/config/selectors.ts`
 * (Layer 2 — typed contracts); specs never reference them directly.
 *
 * The confirmation surface is a Radix `AlertDialog`, so the dialog
 * (`role="alertdialog"`) and its two controls are addressed by role. The
 * buttons are resolved *inside* the dialog locator, which stops the
 * affirmative control from matching the navbar user menu's own "Sign Out"
 * entry. The sidebar trigger keeps its test id because that same menu entry
 * makes a name-based lookup ambiguous.
 */
export class LogoutPage extends BasePage {
  readonly url = ROUTES.home

  get sidebarLogoutButton(): Locator {
    return this.page.locator(LOGOUT_SELECTORS.sidebarLogoutButton)
  }

  get navbarUserMenuButton(): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(LOGOUT_SELECTORS.navbarUserMenuButton, 'i'),
    })
  }

  get navbarSignOutItem(): Locator {
    return this.page.getByRole('menuitem', {
      name: new RegExp(LOGOUT_SELECTORS.navbarSignOutItem, 'i'),
    })
  }

  get dialog(): Locator {
    return this.page.getByRole(LOGOUT_SELECTORS.dialogRole)
  }

  get confirmButton(): Locator {
    return this.dialog.getByRole('button', {
      name: new RegExp(LOGOUT_SELECTORS.confirmButtonName, 'i'),
    })
  }

  get cancelButton(): Locator {
    return this.dialog.getByRole('button', {
      name: new RegExp(LOGOUT_SELECTORS.cancelButtonName, 'i'),
    })
  }

  /** Opens the confirmation from the sidebar without signing out yet. */
  async requestLogout(): Promise<void> {
    await this.sidebarLogoutButton.click()
  }

  /**
   * Opens the confirmation from the navbar user menu.
   *
   * The navbar renders its own "Sign Out" entry, so this path is separate from
   * the sidebar trigger even though both reach the same dialog.
   */
  async requestLogoutFromNavbar(): Promise<void> {
    await this.navbarUserMenuButton.click()
    await this.navbarSignOutItem.click()
  }

  async confirmLogout(): Promise<void> {
    await this.confirmButton.click()
  }

  async cancelLogout(): Promise<void> {
    await this.cancelButton.click()
  }

  /** Dismisses the confirmation with the keyboard, as a user would. */
  async dismissWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }

  async assertDialogVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.confirmButton).toBeVisible()
    await expect(this.cancelButton).toBeVisible()
  }

  async assertDialogHidden(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /**
   * Asserts the session is intact: still on home with the persisted token in
   * place. The token check is what actually proves the dialog did not sign the
   * user out — the URL alone has not changed yet when this runs.
   */
  async assertStillSignedIn(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${ROUTES.home}(\\?.*)?$`))
    await expect.poll(() => this.readAuthToken()).not.toBeNull()
  }

  async assertSignedOut(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${ROUTES.login}(\\?.*)?$`))
    await expect.poll(() => this.readAuthToken()).toBeNull()
  }

  /** Reads the persisted Fineract token from the configured storage key. */
  private readAuthToken(): Promise<string | null> {
    return this.page.evaluate(
      key => localStorage.getItem(key),
      BEHAVIOR.authStorageKey
    )
  }
}
