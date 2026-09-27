/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** A document attached to a Fineract entity, as returned by `DocumentsApi`. */
export type EntityDocument = {
  id?: number | string
  name?: string
  description?: string
  fileName?: string
  /** MIME type as recorded by Fineract; often `application/octet-stream`. */
  type?: string
}

/** Fineract entity types that own documents. */
export type DocumentEntityType =
  | 'clients'
  | 'loans'
  | 'savings'
  | 'client_identifiers'
