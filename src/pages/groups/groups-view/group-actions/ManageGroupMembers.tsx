/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { GroupsApi, type GetGroupsGroupIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const groupsApi = new GroupsApi(getConfiguration())

type LiteClient = {
  id: number
  displayName: string
  officeName?: string
  accountNo?: string
  status?: { value?: string }
}

const ManageGroupMembers = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  const [group, setGroup] = useState<GetGroupsGroupIdResponse>()
  const [clientMembers, setClientMembers] = useState<LiteClient[]>([])

  // left card – autocomplete + selected client details
  const [search, setSearch] = useState('')
  const [clientsData, setClientsData] = useState<LiteClient[]>([])
  const [selectedClient, setSelectedClient] = useState<LiteClient | null>(null)
  const [busy, setBusy] = useState(false)

  // load group + existing members
  useEffect(() => {
    ;(async () => {
      try {
        const res = await groupsApi.retrieveOne15(
          Number(id),
          undefined,
          undefined,
          {
            params: { associations: 'clientMembers' },
          }
        )
        setGroup(res.data)
        const members = Array.from(
          (res.data as any)?.clientMembers ?? []
        ) as LiteClient[]
        setClientMembers(members)
      } catch (e) {
        console.error('Failed to load group/members', e)
      }
    })()
  }, [id])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      if (!search.trim()) {
        setClientsData([])
        return
      }
      try {
        if (!cancel) {
          setClientsData([]) // <- replace with fetched results
        }
      } catch (e) {
        console.error('Client search failed', e)
      }
    })()
    return () => {
      cancel = true
    }
  }, [search])

  // compute what to show in the dropdown (client list)
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase()
    return clientsData
      .filter(c => c.displayName.toLowerCase().includes(q))
      .slice(0, 8)
  }, [clientsData, search])

  const addClient = async () => {
    if (!selectedClient || !id) return
    setBusy(true)
    try {
      // TODO: OpenAPI call to add client to group
      // e.g. await groupsApi.addClientToGroup(Number(id), { clientId: selectedClient.id })
      setClientMembers(prev => {
        if (prev.find(c => c.id === selectedClient.id)) return prev // no dupes
        return [...prev, selectedClient]
      })
      setSelectedClient(null)
      setSearch('')
    } catch (e) {
      console.error('Failed to add client', e)
    } finally {
      setBusy(false)
    }
  }

  const removeClient = async (client: LiteClient) => {
    if (!id) return
    if (!confirm(t('manageMembers.confirmRemove', { name: client.displayName }))) return
    setBusy(true)
    try {
      setClientMembers(prev => prev.filter(c => c.id !== client.id))
    } catch (e) {
      console.error('Failed to remove client', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/groups' },
          { label: group?.name ?? t('view.groupName'), href: `/groups/${id}/general` },
          { label: t('manageMembers.breadcrumb'), current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mt-2 mb-6">{t('manageMembers.heading')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Add Clients card */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-medium">{t('manageMembers.addClients')}</h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Autocomplete input */}
            <div className="relative">
              <Label className="mb-1 block">{t('manageMembers.labelClient')}</Label>
              <Input
                placeholder={t('manageMembers.placeholderSearch')}
                value={selectedClient ? selectedClient.displayName : search}
                onChange={e => {
                  setSelectedClient(null)
                  setSearch(e.target.value)
                }}
              />
              {/* lightweight dropdown – replace with your Autocomplete component if you prefer */}
              {!selectedClient && search && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white dark:bg-zinc-800 shadow">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      onClick={() => {
                        setSelectedClient(c)
                      }}
                    >
                      {c.displayName}
                      {c.officeName ? (
                        <span className="text-zinc-500"> • {c.officeName}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected client details table */}
            <div className="border rounded">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-medium">{t('manageMembers.clientDetails')}</div>
                <Button
                  size="icon"
                  className="bg-[#1074b9] hover:bg-[#0662a3]"
                  onClick={addClient}
                  disabled={!selectedClient || busy}
                  title={t('manageMembers.titleAdd')}
                >
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>

              <div className="divide-y">
                <div className="flex px-4 py-3">
                  <div className="w-40 text-zinc-600">{t('manageMembers.tableName')}</div>
                  <div className="flex-1">
                    {selectedClient?.displayName ?? '—'}
                  </div>
                </div>
                <div className="flex px-4 py-3">
                  <div className="w-40 text-zinc-600">{t('manageMembers.tableId')}</div>
                  <div className="flex-1">{selectedClient?.id ?? '—'}</div>
                </div>
                <div className="flex px-4 py-3">
                  <div className="w-40 text-zinc-600">{t('manageMembers.tableOffice')}</div>
                  <div className="flex-1">
                    {selectedClient?.officeName ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Client Members list */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-medium">{t('manageMembers.clientMembers')}</h3>
          </div>

          <div className="p-2">
            {clientMembers.length === 0 ? (
              <div className="p-6 text-zinc-500">{t('manageMembers.noMembers')}</div>
            ) : (
              <ul className="divide-y">
                {clientMembers.map(c => (
                  <li key={c.id} className="flex items-center px-4 py-3">
                    <span className="py-1">{c.displayName}</span>
                    <div className="ml-auto" />
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeClient(c)}
                      disabled={busy}
                      title={t('manageMembers.titleRemove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t('manageMembers.backToGroup')}
        </Button>
      </div>
    </div>
  )
}

export default ManageGroupMembers
