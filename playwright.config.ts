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
// Set when `npm run build` has already produced dist/, as in the e2e
// workflow, which builds in its own step so the build's time and output
// show there and do not count against the webServer timeout.
const isPrebuilt = !!process.env.E2E_PREBUILT

// `--strictPort`, so a busy port fails the run instead of serving the app
// on another port the tests would not find.
const previewCommand = 'npx vite preview --port 5173 --strictPort'

const webServerCommand = isPrebuilt
  ? previewCommand
  : isCI
    ? `npm run build && ${previewCommand}`
    : 'npm run dev'

export default defineConfig({
  ...sharedConfig,
  // Checks that Fineract and the app are ready before any spec runs, and
  // prints the Fineract logs if not. CI only, as in openMF/web-app.
  globalSetup: isCI ? './playwright/global-setup.ts' : undefined,
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
    command: webServerCommand,
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 180000,
    ...(isCI && {
      stdout: 'pipe',
      stderr: 'pipe',
    }),
  },
})
