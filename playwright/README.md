# Playwright E2E Foundation (React / Vite)

This folder provides a **framework-agnostic E2E foundation** based on Page Object Model (POM).

## Core Principle

Tests (`*.spec.ts`) stay framework-agnostic.  
Only the `SELECTORS` block inside each page object changes between Angular and React.

## Structure

- `types/selectors.ts`: Selector map interfaces (contracts)
- `pages/BasePage.ts`: Shared abstract base page
- `pages/login.page.ts`: React login page object (selectors swapped)
- `tests/login.spec.ts`: Framework-agnostic login tests

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

## Porting Workflow (Angular -> React)

1. Copy `*.spec.ts` (no changes)
2. Copy page object class
3. Swap only the `SELECTORS` block
4. Keep all public methods unchanged
