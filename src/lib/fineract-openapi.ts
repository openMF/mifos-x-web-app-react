/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
//This file has the configuration for base url for fineract using openapi generator

import { Configuration } from '@/fineract-api'
import { getAllHeaders, getApiBaseUrl } from '@/lib/http-client'

export const getConfiguration = () => {
  const configuration = new Configuration({ basePath: getApiBaseUrl() })

  // The generated clients read baseOptions on every request. Most pages build
  // their client once, when the module loads, and every route is imported
  // before sign-in; reading the headers here keeps those clients on the
  // current credential and tenant instead of whatever existed at load time.
  Object.defineProperty(configuration, 'baseOptions', {
    get: () => ({ headers: getAllHeaders(), withCredentials: true }),
  })

  return configuration
}
