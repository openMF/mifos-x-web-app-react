/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { DataTablesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { fetchDatatablesFor } from '@/lib/datatables-api'

import {
  toLoanDatatables,
  type DatatableRow,
  type LoanDatatable,
} from './columns'

/**
 * Rows are read through the query endpoint, one request per page of 500, so a
 * table costs a few requests in total rather than one per loan. Every page is
 * read, since a missing page would leave cells blank and filters wrong
 * without any sign that rows were left out.
 */
const PAGE_SIZE = 500

/** Rows of one table, by loan id */
export type DatatableRows = Map<number, DatatableRow>

type DatatablePage = { content?: DatatableRow[] } | DatatableRow[]

const fetchRows = async (table: LoanDatatable): Promise<DatatableRows> => {
  // built per call so the request carries the current credentials
  const api = new DataTablesApi(getConfiguration())
  const rows: DatatableRows = new Map()

  for (let page = 0; ; page++) {
    const res = await api.advancedQuery(table.name, {
      request: { resultColumns: table.resultColumns },
      page,
      size: PAGE_SIZE,
      // ISO dates, so parsing does not depend on the user's locale
      dateFormat: 'yyyy-MM-dd',
      dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
      locale: 'en',
    })
    const body = res.data as unknown as DatatablePage
    const content = Array.isArray(body) ? body : (body?.content ?? [])

    // a multi-row table holds several entries for a loan; the list shows
    // one value per cell. Fineract returns rows by id descending, so the
    // first entry seen for a loan is its latest and later ones are skipped.
    for (const row of content) {
      const loanId = Number(row.loan_id)
      if (!Number.isNaN(loanId) && !rows.has(loanId)) rows.set(loanId, row)
    }

    // The response is serialised without its "last" flag, so a page shorter
    // than the page size is what marks the end.
    if (content.length < PAGE_SIZE) break
  }
  return rows
}

/**
 * The datatables registered against loans, and the rows of the ones in use.
 *
 * @param wanted whether the table list is needed yet, so a visit that never
 *   uses a datatable column makes no extra request
 * @param neededTables tables whose rows are needed, because one of their
 *   columns is shown or filtered on
 */
export const useLoanDatatables = (wanted: boolean, neededTables: string[]) => {
  const [tables, setTables] = useState<LoanDatatable[] | null>(null)
  const [tablesFailed, setTablesFailed] = useState(false)
  const [rows, setRows] = useState<Record<string, DatatableRows>>({})
  const [loadingTables, setLoadingTables] = useState<string[]>([])
  const [failedTables, setFailedTables] = useState<string[]>([])

  // Guard against starting the same request twice, which state alone cannot
  // do since it only updates after the render.
  const tablesInFlight = useRef(false)
  const inFlight = useRef(new Set<string>())

  const loadTables = useCallback(() => {
    if (tablesInFlight.current) return
    tablesInFlight.current = true
    setTablesFailed(false)
    fetchDatatablesFor('m_loan')
      .then(registered => setTables(toLoanDatatables(registered)))
      .catch(e => {
        console.error('Failed to load loan datatables', e)
        setTablesFailed(true)
      })
      .finally(() => {
        tablesInFlight.current = false
      })
  }, [])

  useEffect(() => {
    if (wanted && tables === null && !tablesFailed) loadTables()
  }, [wanted, tables, tablesFailed, loadTables])

  const loadRows = useCallback((table: LoanDatatable) => {
    if (inFlight.current.has(table.name)) return
    inFlight.current.add(table.name)
    setLoadingTables(prev => [...prev, table.name])
    setFailedTables(prev => prev.filter(name => name !== table.name))
    fetchRows(table)
      .then(loaded => setRows(prev => ({ ...prev, [table.name]: loaded })))
      .catch(e => {
        console.error(`Failed to load datatable ${table.name}`, e)
        setFailedTables(prev => [...prev, table.name])
      })
      .finally(() => {
        inFlight.current.delete(table.name)
        setLoadingTables(prev => prev.filter(name => name !== table.name))
      })
  }, [])

  // load each needed table once; a failed one waits for a retry
  useEffect(() => {
    for (const table of tables ?? []) {
      if (
        neededTables.includes(table.name) &&
        !rows[table.name] &&
        !failedTables.includes(table.name)
      ) {
        loadRows(table)
      }
    }
  }, [tables, neededTables, rows, failedTables, loadRows])

  /** Tries the table list and every failed table again */
  const retry = useCallback(() => {
    if (tables === null) {
      loadTables()
      return
    }
    for (const table of tables) {
      if (failedTables.includes(table.name)) loadRows(table)
    }
  }, [tables, failedTables, loadTables, loadRows])

  return {
    tables,
    tablesFailed,
    rows,
    loadingTables,
    failedTables,
    retry,
  }
}
