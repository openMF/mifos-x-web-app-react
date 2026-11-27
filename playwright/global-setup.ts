/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { dumpDockerLogs } from './utils/docker-logs'
import { pollFineract, pollWebApp } from './utils/readiness'
import type { RetryAttemptInfo } from './utils/retry'

/**
 * Playwright global setup, wired in CI only via
 * `playwright.config.ts → globalSetup`. Ported from the openMF/web-app
 * suite; only the defaults below differ.
 *
 * Playwright starts the `webServer` before this runs, so by now the app
 * is being served and Fineract (started by `docker-compose.e2e.yml`)
 * should be up. This checks both before any spec runs, so a backend that
 * is not ready fails once, with its logs, instead of failing every spec:
 *
 *  1. `FINERACT_SKIP_READINESS=1` skips the checks, for a backend you
 *     started yourself and know is ready. `SKIP_BACKEND_TESTS` skips
 *     only the Fineract check, since no spec that needs Fineract runs.
 *  2. Otherwise `pollFineract()` and `pollWebApp()` run in parallel, each
 *     with a 5s interval and a ~90s ceiling. Fineract counts as ready only
 *     when `/actuator/health` returns 200 and `GET /api/v1/offices`
 *     returns at least one office.
 *  3. On the first failure the last 200 lines of the Fineract log are
 *     printed via `docker compose logs`, and the error is rethrown with
 *     next steps. If the logs cannot be read, that is a one-line warning,
 *     so the readiness error stays the one that surfaces.
 *
 * The ~90s ceiling is not meant to cover Fineract's first boot. Start
 * the stack with `up -d --wait`, which waits for the compose healthcheck.
 */

// React defaults, matching `playwright.node.config.ts`: Fineract is
// published on port 3000 and `vite preview` serves the app on 5173.
const DEFAULT_FINERACT_URL = 'https://localhost:3000'
const DEFAULT_WEB_APP_URL = 'http://localhost:5173'
const DEFAULT_COMPOSE_FILE = 'docker-compose.e2e.yml'
const DEFAULT_FINERACT_SERVICE = 'fineract'

async function globalSetup(): Promise<void> {
  if (process.env.FINERACT_SKIP_READINESS === '1') {
    console.warn(
      '[global-setup] FINERACT_SKIP_READINESS=1 — readiness probes skipped. ' +
        'Assuming Fineract + web-app are already up.'
    )
    return
  }

  const fineractUrl = process.env.E2E_FINERACT_URL || DEFAULT_FINERACT_URL
  const webAppUrl = process.env.E2E_BASE_URL || DEFAULT_WEB_APP_URL
  const composeFile = process.env.E2E_COMPOSE_FILE || DEFAULT_COMPOSE_FILE
  const fineractService =
    process.env.E2E_FINERACT_SERVICE || DEFAULT_FINERACT_SERVICE
  // Same switch as `playwright.node.config.ts` and the specs.
  const skipBackend = !!process.env.SKIP_BACKEND_TESTS

  console.log(
    `[global-setup] readiness probe — Fineract=${
      skipBackend ? 'skipped (SKIP_BACKEND_TESTS)' : fineractUrl
    } web-app=${webAppUrl} (5s interval, ~90s ceiling, fast-fail)`
  )

  const logRetry =
    (label: string) =>
    (info: RetryAttemptInfo): void => {
      console.log(
        `[global-setup] ${label} attempt ${info.attempt} failed (${describe(info.error)}) — ` +
          `retrying in ${info.delayMs}ms`
      )
    }

  try {
    await Promise.all([
      skipBackend
        ? Promise.resolve()
        : pollFineract({
            url: fineractUrl,
            onRetry: logRetry('fineract'),
          }),
      pollWebApp({
        url: webAppUrl,
        onRetry: logRetry('web-app'),
      }),
    ])
    console.log(
      skipBackend
        ? '✅ [global-setup] web-app is ready.'
        : '✅ [global-setup] Fineract + web-app are functionally ready.'
    )
  } catch (error) {
    console.error(
      `\n[global-setup] readiness probe gave up: ${describe(error)}`
    )
    if (!skipBackend) {
      await dumpDockerLogs({
        composeFile,
        service: fineractService,
      })
    }
    throw new Error(
      'FATAL: E2E infrastructure not ready after ~90s.\n' +
        `  Fineract: ${fineractUrl}\n` +
        `  Web-app:  ${webAppUrl}\n` +
        `  Cause:    ${describe(error)}\n` +
        '\n' +
        'Next steps:\n' +
        `  - Bring the stack up:  docker compose -f ${composeFile} up -d --wait --wait-timeout 600\n` +
        `  - Tail full logs:      docker compose -f ${composeFile} logs -f ${fineractService}\n` +
        '  - Bypass (debug only): FINERACT_SKIP_READINESS=1 npx playwright test'
    )
  }
}

/** Compact, human-friendly stringification for unknown error shapes. */
function describe(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}

export default globalSetup
