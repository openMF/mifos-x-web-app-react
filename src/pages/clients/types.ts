/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  GetClientsTemplateResponse,
  PostClientsRequest,
} from '@/fineract-api'

/** A code value (Admin > System > Manage Codes) as the template returns it */
export interface ClientCodeValueOption {
  id?: number
  name?: string
  active?: boolean
}

/**
 * The generated `GetClientsTemplateResponse` is incomplete (see ISSUES.md):
 * the real `/clients/template` also returns the code value option lists for
 * the Gender, Client Type and Client Classification dropdowns.
 */
export interface ExtendedClientTemplate extends GetClientsTemplateResponse {
  genderOptions?: ClientCodeValueOption[]
  clientTypeOptions?: ClientCodeValueOption[]
  clientClassificationOptions?: ClientCodeValueOption[]
}

/**
 * The generated `PostClientsRequest` is incomplete (see ISSUES.md): the real
 * `POST /clients` also accepts these fields, which the Angular web app sends.
 */
export interface ExtendedPostClientsRequest extends PostClientsRequest {
  genderId?: number
  clientTypeId?: number
  clientClassificationId?: number
  staffId?: number
  isStaff?: boolean
}
