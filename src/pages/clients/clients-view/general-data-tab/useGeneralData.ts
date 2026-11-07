/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'

import {
  ClientApi,
  ClientIdentifierApi,
  ClientsAddressApi,
  DataTablesApi,
  type AddressData,
  type ClientData,
  type ClientIdentifierData,
  type GetDataTablesResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { ENTITY_DATATABLES, type SectionKey } from './generalDataConfig'
import {
  toRecords,
  type DatatableRecord,
  type GenericResultSet,
} from './generalDataUtils'

// Built per call so each request carries the current credentials.
const clientApi = () => new ClientApi(getConfiguration())
const addressApi = () => new ClientsAddressApi(getConfiguration())
const identifierApi = () => new ClientIdentifierApi(getConfiguration())
const datatablesApi = () => new DataTablesApi(getConfiguration())

export type DatatableSections = Partial<Record<SectionKey, DatatableRecord[]>>

export interface GeneralData {
  loading: boolean
  /** Only the client itself failing counts; every other source falls back to empty. */
  failed: boolean
  client: ClientData | null
  addresses: AddressData[]
  identifiers: ClientIdentifierData[]
  sections: DatatableSections
}

const EMPTY: Omit<GeneralData, 'loading' | 'failed'> = {
  client: null,
  addresses: [],
  identifiers: [],
  sections: {},
}

const valueOr = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
  result.status === 'fulfilled' ? result.value : fallback

/** The entity data tables registered for clients, read for one client. */
const loadSections = async (clientId: number): Promise<DatatableSections> => {
  const res = await datatablesApi().getDatatables('m_client')
  const registered = new Set(
    ((res.data as GetDataTablesResponse[]) ?? []).map(
      table => table.registeredTableName
    )
  )
  const keys = (Object.keys(ENTITY_DATATABLES) as SectionKey[]).filter(key =>
    registered.has(ENTITY_DATATABLES[key])
  )
  const results = await Promise.allSettled(
    keys.map(async key => {
      // The generated method has no genericResultSet parameter, so it is
      // passed as a query param. Headers are left alone: setting them here
      // would replace the tenant and authorization headers.
      const table = await datatablesApi().getDatatable1(
        ENTITY_DATATABLES[key],
        clientId,
        undefined,
        { params: { genericResultSet: true } }
      )
      return toRecords(table.data as unknown as GenericResultSet)
    })
  )
  return Object.fromEntries(
    keys.map((key, index) => [key, valueOr(results[index], [])])
  )
}

/** Everything the General Data tab shows for a client. */
export const useGeneralData = (id?: string): GeneralData => {
  const [state, setState] = useState<GeneralData>({
    ...EMPTY,
    loading: true,
    failed: false,
  })
  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++loadIdRef.current
    const clientId = Number(id)
    if (!id || Number.isNaN(clientId)) {
      setState({ ...EMPTY, loading: false, failed: true })
      return
    }
    setState(previous => ({ ...previous, loading: true, failed: false }))

    const load = async () => {
      const [client, addresses, identifiers, sections] =
        await Promise.allSettled([
          clientApi().retrieveOne11(clientId),
          addressApi().getAddresses1(clientId),
          identifierApi().retrieveAllClientIdentifiers(clientId),
          loadSections(clientId),
        ])
      if (requestId !== loadIdRef.current) return
      if (client.status === 'rejected') {
        console.error('Failed to load client', client.reason)
      }
      if (sections.status === 'rejected') {
        console.error('Failed to load client data tables', sections.reason)
      }
      const addressList = valueOr(addresses, undefined)?.data
      setState({
        loading: false,
        failed: client.status === 'rejected',
        // The generated response type omits legalForm and the non-person
        // details, which the full client payload carries.
        client:
          client.status === 'fulfilled'
            ? (client.value.data as unknown as ClientData)
            : null,
        addresses: Array.isArray(addressList) ? addressList : [],
        identifiers: valueOr(identifiers, undefined)?.data ?? [],
        sections: valueOr(sections, {}),
      })
    }
    load()
  }, [id])

  return state
}

export default useGeneralData
