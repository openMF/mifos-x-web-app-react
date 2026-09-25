/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useParams } from 'react-router-dom'

import EntityDatatableTab from '@/components/datatables/EntityDatatableTab'

/** The entries one data table holds for a group. */
const GroupDatatableTab = () => {
  const { id, datatableName } = useParams()

  return (
    <EntityDatatableTab
      entityId={Number(id)}
      datatableName={decodeURIComponent(datatableName ?? '')}
    />
  )
}

export default GroupDatatableTab
