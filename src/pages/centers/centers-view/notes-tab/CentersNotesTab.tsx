/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useParams } from 'react-router-dom'
import EntityNotesTab from '@/components/notes/EntityNotesTab'

const CentersNotesTab = () => {
  const { id } = useParams()

  return (
    // Centers are a subtype of groups in Fineract; notes are stored under the "groups" resource.
    <EntityNotesTab
      entityType="groups"
      entityId={id ? Number(id) : undefined}
    />
  )
}

export default CentersNotesTab
