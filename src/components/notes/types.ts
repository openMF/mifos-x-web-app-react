/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Supported entity types for notes in Fineract. */
export type NoteEntityType = 'clients' | 'groups' | 'centers' | 'loans'

export interface EntityNotesTabProps {
  entityType: NoteEntityType
  entityId?: number
  /** Heading shown above the notes section; defaults to "Notes". */
  heading?: string
}
