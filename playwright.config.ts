/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

// React defaults for the shared E2E variables. The test data layer in
// `playwright/{fixtures,factories,utils}` is shared verbatim with the
// openMF/web-app (Angular) suite, whose own defaults point at that
// stack (Fineract on 8443, the app on 4200). Setting the React values
// here, before any spec loads, keeps those files identical in both
// repos. Playwright loads this file in every worker, so the defaults
// reach the workers too. An explicitly exported variable still wins.
//
// Fineract: `docker-compose-zitadel.yml` publishes it on port 3000.
process.env.E2E_FINERACT_URL ??= 'https://localhost:3000'
process.env.E2E_BASE_URL ??= 'http://localhost:5173'

export default defineConfig({
  testDir: './playwright/tests',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 120000,
    actionTimeout: 30000,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  timeout: isCI ? 180000 : 120000,
  projects: [
    {
      // Pure-logic specs for the shared helpers: no browser, no app and
      // no backend.
      name: 'unit',
      testDir: '.',
      testMatch: [
        /playwright\/utils\/.*\.spec\.ts/,
        /playwright\/config\/.*\.spec\.ts/,
        /playwright\/pages\/.*\.spec\.ts/,
        /playwright\/fixtures\/.*\.spec\.ts/,
        /playwright\/factories\/client\.spec\.ts/,
        /playwright\/factories\/_shared\.spec\.ts/,
      ],
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      // Factory specs against a live Fineract (`E2E_FINERACT_URL`). They
      // talk to the REST API only, so no browser is started.
      name: 'integration',
      testDir: '.',
      testMatch: /playwright\/factories\/.*\.factory\.spec\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--ignore-certificate-errors'],
        },
      },
    },
  ],
  webServer: {
    command: isCI
      ? 'npm run build && npx vite preview --port 5173'
      : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 180000,
    ...(isCI && {
      stdout: 'pipe',
      stderr: 'pipe',
    }),
  },
})
