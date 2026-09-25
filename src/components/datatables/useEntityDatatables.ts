/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'

import { fetchDatatablesFor, formatDatatableLabel } from '@/lib/datatables-api'

export interface EntityDatatable {
  /** The registered name, as it goes into the route. */
  name: string
  /** The name made readable, for a tab or heading. */
  label: string
}

/**
 * The data tables registered against an application table, e.g. `m_client`.
 *
 * A failure resolves to an empty list rather than propagating: these drive
 * extra tabs on an entity view, and losing them should not take the rest of
 * the tab bar down with them.
 */
export const useEntityDatatables = (apptable: string): EntityDatatable[] => {
  const [datatables, setDatatables] = useState<EntityDatatable[]>([])

  useEffect(() => {
    let active = true

    fetchDatatablesFor(apptable)
      .then(tables => {
        if (!active) return
        setDatatables(
          tables
            .map(table => table.registeredTableName)
            .filter((name): name is string => Boolean(name))
            .map(name => ({ name, label: formatDatatableLabel(name) }))
        )
      })
      .catch(error => {
        console.error(`Failed to load data tables for ${apptable}`, error)
        if (active) setDatatables([])
      })

    return () => {
      active = false
    }
  }, [apptable])

  return datatables
}

export default useEntityDatatables
