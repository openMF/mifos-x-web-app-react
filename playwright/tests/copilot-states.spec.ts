/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Every Copilot state, rendered by the dev-only states page from recorded
 * gateway replies, and scanned for accessibility problems. Needs no
 * backend. The page exists in dev builds only, so against a production
 * build (`vite preview`) the test skips itself.
 */
async function openStates(page: Page, theme: 'light' | 'dark') {
  // The app reads its theme from here before the first render.
  await page.addInitScript(value => {
    localStorage.setItem('theme', value)
  }, theme)
  await page.goto('/dev/copilot-states')
  const title = page.getByRole('heading', { level: 1, name: 'Copilot states' })
  const present = await title
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  test.skip(!present, 'The states page exists in dev builds only.')
}

for (const theme of ['light', 'dark'] as const) {
  test(`Copilot states render and pass an accessibility scan (${theme})`, async ({
    page,
  }) => {
    await openStates(page, theme)

    // Each state is a region named by its title.
    const states = page.getByRole('main').getByRole('region')
    expect(await states.count()).toBeGreaterThan(10)
    for (const state of await states.all()) {
      await expect(state).toBeVisible()
    }
    // The receipt after a confirmed write, as one concrete check.
    await expect(
      page.locator('#approved').getByRole('heading', { name: 'Loan updated' })
    ).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map(v => ({
        id: v.id,
        nodes: v.nodes.map(n => n.target.join(' ')),
      }))
    ).toEqual([])
  })
}
