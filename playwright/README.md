# Playwright E2E Foundation (React / Vite)

This folder provides a **framework-agnostic E2E foundation** based on Page Object Model (POM).

## Core Principle

Tests (`*.spec.ts`) stay framework-agnostic.  
Only the `SELECTORS` block inside each page object changes between Angular and React.

## Structure

- `config/`: the React values for the shared contracts: selectors, routes and behaviour flags
- `pages/`: page objects (`BasePage.ts`, `login.page.ts`)
- `tests/`: browser specs (`login.spec.ts`, `template-editor.spec.ts`)
- `fixtures/`: the Fineract REST client and the `test` fixtures (`fineractApi`, `apiSetup`, `cleanupGuard`)
- `factories/`: create clients, groups, loans, savings accounts, charges and users through the API
- `utils/`: retry, readiness, naming, cleanup and sleep helpers
- `types/`: shared test data types

## SelectorMap Pattern

Each page object implements a typed selector contract. Example:

- `LoginSelectors.usernameInput`
- `LoginSelectors.passwordInput`
- `LoginSelectors.loginButton`
- `LoginSelectors.errorMessage`

TypeScript enforces selector completeness and keeps framework-specific details localized.

## Run E2E

- Install browser: `npm run test:e2e:install`
- Headless: `npm run test:e2e`
- Headed: `npm run test:e2e:headed`
- UI mode: `npm run test:e2e:ui`
- Type-check this folder: `npm run typecheck:e2e` (CI runs it on every pull
  request)

## Backend-Dependent Tests

Set `SKIP_BACKEND_TESTS=true` to skip tests that require a running Fineract backend.
It also leaves out the `integration` project described below.

## E2E Backend

`docker-compose.e2e.yml` starts the backend the suite runs against, in CI and
locally: PostgreSQL and Fineract, published on `https://localhost:3000`, which
is what the Vite proxy and the default `E2E_FINERACT_URL` expect. Fineract is
pinned to the same build as the openMF/web-app suite, and every run starts
from an empty database.

- Start it: `npm run e2e:docker:up` (returns once Fineract is healthy; its
  first boot can take a few minutes)
- Follow its logs: `npm run e2e:docker:logs`
- Stop it and delete its data: `npm run e2e:docker:down`

The app is not part of the stack: Playwright's `webServer` starts it.

## CI

`.github/workflows/e2e.yml` runs the `integration` and `chromium` projects on
every pull request to `dev` and `main`, as the **Playwright E2E** check. It
starts the stack above, builds the app, serves the build with `vite preview`
and runs `npm run test:e2e:ci`. The HTML report is uploaded as the
`playwright-report` artifact, and the traces, videos and screenshots of
failed tests as `playwright-test-results`.

To run it the same way locally:

```sh
npm run e2e:docker:up
npm run build
CI=1 E2E_PREBUILT=1 npm run test:e2e:ci
```

With `CI` set, `global-setup.ts` first checks that Fineract answers with its
seed data and that the app responds, and prints the Fineract logs if not.
`copilot-states.spec.ts` skips here, because its page exists in dev builds
only.

## Test Data Layer

`fixtures/`, `factories/`, `utils/` and `types/` are copied unchanged from the
[openMF/web-app](https://github.com/openMF/web-app/tree/dev/playwright) suite,
formatted with this repo's Prettier config. They talk to Fineract over REST and
contain nothing specific to either app. Change them upstream first and copy the
result here, so the two suites stay identical. React's defaults for the shared
`E2E_*` variables are set in `playwright.node.config.ts`.

Two projects run this code without a browser. `playwright.node.config.ts`
holds just these two and starts no web server, so use it to run them on their
own:

- `npm run test:e2e:unit` runs the helper specs. It needs no backend, and CI
  runs it on every pull request.
- `npx playwright test -c playwright.node.config.ts --project=integration` runs
  the factory specs against a live Fineract, such as the
  [E2E backend](#e2e-backend). CI runs them on every pull request.

## Porting Workflow (Angular -> React)

1. Copy `*.spec.ts` (no changes)
2. Copy page object class
3. Swap only the `SELECTORS` block
4. Keep all public methods unchanged
