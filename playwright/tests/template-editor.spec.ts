/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { test, expect, type Page } from '@playwright/test'

/**
 * Regression cover for MXWAR-151: switching the template body between HTML and
 * plain text used to discard the formatting of whichever one was left behind.
 *
 * The template form is the only thing under test, so the two endpoints it
 * needs are stubbed and no Fineract instance is required.
 */

const TEMPLATE_FORM_DATA = {
  entities: [
    { id: 0, name: 'client' },
    { id: 1, name: 'loan' },
  ],
  types: [
    { id: 0, name: 'Document' },
    { id: 2, name: 'SMS' },
  ],
}

const signIn = async (page: Page) => {
  await page.addInitScript(() => {
    // Any stored credential satisfies the route guard; no request is made
    // with it because the endpoints below are stubbed.
    localStorage.setItem('mifosToken', btoa('mifos:password'))
    localStorage.setItem('mifosTenant', 'default')
  })
}

const stubTemplateEndpoints = async (page: Page) => {
  // Matched on the Fineract path rather than on `/templates`, so the stub
  // cannot intercept the app's own client-side navigation to the same prefix.
  await page.route('**/api/v1/templates/template', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TEMPLATE_FORM_DATA),
    })
  )
}

test.describe('Template body editor', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await stubTemplateEndpoints(page)
    await page.goto('/templates/create')
  })

  const richTextBody = (page: Page) =>
    page.getByRole('textbox', { name: 'Template body' })
  const htmlToggle = (page: Page) => page.getByRole('radio', { name: 'HTML' })
  const plainToggle = (page: Page) =>
    page.getByRole('radio', { name: 'Plain text' })

  test('keeps the formatting when switching format and back', async ({
    page,
  }) => {
    const body = richTextBody(page)
    await expect(body).toBeVisible()

    await body.click()
    await page.keyboard.type('Dear client,')
    await page.keyboard.press('ControlOrMeta+a')
    await page.getByRole('button', { name: 'Bold' }).click()

    const formatted = await body.innerHTML()
    expect(formatted).toMatch(/<(b|strong)>/i)

    // Plain text shows the body without markup...
    await plainToggle(page).click()
    const plain = page.getByRole('textbox', { name: 'Template body' })
    await expect(plain).toHaveValue('Dear client,')

    // ...and going back returns the markup rather than the flattened copy.
    await htmlToggle(page).click()
    await expect(richTextBody(page)).toHaveText('Dear client,')
    expect(await richTextBody(page).innerHTML()).toBe(formatted)
  })

  test('keeps line breaks when switching from plain text and back', async ({
    page,
  }) => {
    await plainToggle(page).click()

    const plain = page.getByRole('textbox', { name: 'Template body' })
    await plain.click()
    await page.keyboard.type('First line')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Third line')

    await htmlToggle(page).click()
    // The break survives as markup rather than collapsing into one line.
    expect(await richTextBody(page).innerHTML()).toContain('<br>')

    await plainToggle(page).click()
    await expect(
      page.getByRole('textbox', { name: 'Template body' })
    ).toHaveValue('First line\n\nThird line')
  })

  test('an edit in one format survives the switch to the other', async ({
    page,
  }) => {
    const body = richTextBody(page)
    await body.click()
    await page.keyboard.type('Original')

    await plainToggle(page).click()
    const plain = page.getByRole('textbox', { name: 'Template body' })
    await plain.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('Rewritten')

    // The stored markup is stale now, so the edit wins over it.
    await htmlToggle(page).click()
    await expect(richTextBody(page)).toHaveText('Rewritten')
  })

  test('typing into the rich text body keeps the caret in place', async ({
    page,
  }) => {
    const body = richTextBody(page)
    await body.click()
    await page.keyboard.type('abcdef')

    // A body re-rendered from React state on every keystroke would reverse
    // these characters, or scatter them.
    await expect(body).toHaveText('abcdef')
  })

  test('inserts a template parameter at the caret', async ({ page }) => {
    const body = richTextBody(page)
    await body.click()
    await page.keyboard.type('Hello ')

    await page.getByRole('button', { name: 'Client Parameters' }).click()
    await page.getByRole('button', { name: '{{client.displayName}}' }).click()

    await expect(body).toHaveText('Hello {{client.displayName}}')
  })
})
