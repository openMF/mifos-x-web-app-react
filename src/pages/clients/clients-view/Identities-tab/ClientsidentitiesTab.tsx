/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

import { ClientIdentifierApi, type ClientIdentifierData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Button } from '@/components/ui/button'
import EntityDocumentsTab from '@/components/documents/EntityDocumentsTab'

// Built per call so it picks up the current credentials; see EntityDocumentsTab.
const identifierApi = () => new ClientIdentifierApi(getConfiguration())

const ClientsIdentitiesTab = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [identifiers, setIdentifiers] = useState<ClientIdentifierData[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)

  const load = useCallback(async () => {
    // Moving from client A to client B keeps this component mounted, and A's response
    // can land last. Rendering A's identifiers under B's route would point the upload
    // and delete actions at the wrong identifier.
    const requestId = ++loadIdRef.current
    if (!id) {
      setIdentifiers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setFailed(false)
    try {
      const res = await identifierApi().retrieveAllClientIdentifiers(Number(id))
      if (requestId !== loadIdRef.current) return
      setIdentifiers(res?.data ?? [])
    } catch (e) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to load client identifiers', e)
      setIdentifiers([])
      // Distinguished from an empty list: claiming the client has no identifiers when
      // the request simply failed would be misleading.
      setFailed(true)
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="bg-transparent space-y-6">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {t('identities.heading')}
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={() => navigate(`/clients/${id}/identities/add`)}
        >
          <Plus /> {t('identities.addButton')}
        </Button>
      </div>

      {loading && (
        <p className="px-4 text-sm text-zinc-500">{tc('documents.loading')}</p>
      )}

      {!loading && failed && (
        <p className="px-4 text-sm text-red-600">
          {tc('documents.identifiersLoadFailed')}
        </p>
      )}

      {!loading && !failed && identifiers.length === 0 && (
        <p className="px-4 text-sm text-zinc-500">
          {tc('documents.noIdentifiers')}
        </p>
      )}

      {/* Each identifier owns its own set of scanned documents. */}
      {!loading &&
        identifiers.map(identifier => (
          <section
            key={identifier.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <header className="mb-3">
              <h4 className="font-medium text-black dark:text-white">
                {identifier.documentType?.name || tc('documents.identifier')}
              </h4>
              {identifier.documentKey && (
                <p className="text-sm text-zinc-500">
                  {identifier.documentKey}
                </p>
              )}
            </header>

            <EntityDocumentsTab
              entityType="client_identifiers"
              entityId={identifier.id}
              heading={tc('documents.heading')}
            />
          </section>
        ))}
    </div>
  )
}

export default ClientsIdentitiesTab
