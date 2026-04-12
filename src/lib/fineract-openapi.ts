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
  return new Configuration({
    basePath: getApiBaseUrl(),
    baseOptions: {
      headers: getAllHeaders(),
      withCredentials: true,
    },
  })
}
