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

## Backend-Dependent Tests

Set `SKIP_BACKEND_TESTS=true` to skip tests that require a running Fineract backend.

## Test Data Layer

`fixtures/`, `factories/`, `utils/` and `types/` are copied unchanged from the
[openMF/web-app](https://github.com/openMF/web-app/tree/dev/playwright) suite,
formatted with this repo's Prettier config. They talk to Fineract over REST and
contain nothing specific to either app. Change them upstream first and copy the
result here, so the two suites stay identical. React's defaults for the shared
`E2E_*` variables are set in `playwright.config.ts`.

Two projects run this code without a browser:

- `npx playwright test --project=unit` runs the helper specs. It needs no backend.
- `npx playwright test --project=integration` runs the factory specs against a
  live Fineract. Start one with
  `docker compose -f docker-compose-zitadel.yml up -d fineractpostgres fineract-server`
  after creating `.env.docker` from `.env.docker.sample`. It listens on
  `https://localhost:3000`, the default `E2E_FINERACT_URL`.

## Porting Workflow (Angular -> React)

1. Copy `*.spec.ts` (no changes)
2. Copy page object class
3. Swap only the `SELECTORS` block
4. Keep all public methods unchanged
