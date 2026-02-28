/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * @deprecated This module previously contained a custom axios-based
 * notifications API wrapper.
 *
 * The application now uses the generated OpenAPI `NotificationApi`
 * from '@/fineract-api' instead. This file is intentionally left
 * as a placeholder to avoid having a parallel, unused implementation
 * that could diverge from the canonical API client.
 *
 * If you need to interact with notifications, use:
 * ```typescript
 * import { NotificationApi } from '@/fineract-api'
 * import { getConfiguration } from '@/lib/fineract-openapi'
 *
 * const api = new NotificationApi(getConfiguration())
 * ```
 */

// Intentionally empty - use NotificationApi from @/fineract-api instead
export {}
