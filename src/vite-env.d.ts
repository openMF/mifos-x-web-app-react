/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINERACT_API_URL: string
  readonly VITE_FINERACT_API_PROVIDER: string
  readonly VITE_FINERACT_API_VERSION: string
  readonly VITE_FINERACT_PLATFORM_TENANT_IDENTIFIER: string
  readonly VITE_FINERACT_PLATFORM_TENANTS_IDENTIFIER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Version from package.json and short commit hash, set in vite.config.ts */
declare const __APP_VERSION__: string
declare const __APP_HASH__: string
