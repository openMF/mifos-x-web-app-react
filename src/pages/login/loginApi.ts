/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import fineract from '@/lib/axios'
import { captureTarget, requestTo, type RequestTarget } from '@/lib/http-client'

/** Signs in at the given server and tenant, by default the stored ones. */
export const loginFineract = async (
  username: string,
  password: string,
  target: RequestTarget = captureTarget()
) => {
  const { url, headers } = requestTo(target, '/v1/authentication')
  const response = await fineract.post(
    url,
    { username, password },
    {
      headers,
      params: {
        tenantIdentifier: target.tenant,
      },
    }
  )
  return response.data
}
