/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defineConfig, devices } from '@playwright/test'
// Also sets the React defaults for the shared `E2E_*` variables.
import { nodeProjects, sharedConfig } from './playwright.node.config'

const isCI = !!process.env.CI

export default defineConfig({
  ...sharedConfig,
  testDir: './playwright/tests',
  projects: [
    // `unit` and `integration`. They need no browser; run them on their
    // own with `playwright.node.config.ts`, which starts no web server.
    ...nodeProjects,
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
