/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import fineract from '@/lib/axios'

export const loginFineract = async (username: string, password: string) => {
  const tenant = localStorage.getItem('mifosTenant') || 'default'
  const response = await fineract.post(
    '/v1/authentication',
    { username, password },
    {
      params: {
        tenantIdentifier: tenant,
      },
    }
  )
  return response.data
}
