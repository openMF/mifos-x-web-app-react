/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import fineract from '@/lib/axios'

import OfficeNavigation from './office-navigation/OfficeNavigation'
import StaffNavigation from './staff-navigation/StaffNavigation'
import CenterNavigation from './center-navigation/CenterNavigation'
import GroupNavigation from './group-navigation/GroupNavigation'
import ClientNavigation from './client-navigation/ClientNavigation'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'

interface OfficeDetails {
  id: number
  name: string
  externalId: number
  openingDate: string
}
interface BasicItem {
  id: number
  name: string
}

const Navigation = () => {
  const [offices, setOffices] = useState<OfficeDetails[]>([])
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('')

  const [officers, setOfficers] = useState<BasicItem[]>([])
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('')

  const [centers, setCenters] = useState<BasicItem[]>([])
  const [selectedCenterId, setSelectedCenterId] = useState<string>('')

  const [groups, setGroups] = useState<BasicItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const [clients, setClients] = useState<BasicItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const { t } = useTranslation('common')

  // Offices
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fineract.get('/offices')
        setOffices(res.data ?? [])
      } catch (err) {
        console.error('Failed to fetch offices', err)
      }
    })()
  }, [])

  // Officers by office
  useEffect(() => {
    if (!selectedOfficeId) {
      setOfficers([])
      setSelectedOfficerId('')
      return
    }
    ;(async () => {
      try {
        const res = await fineract.get('/staff', {
          params: { officeId: Number(selectedOfficeId) },
        })
        const list = res.data?.pageItems ?? res.data ?? []
        setOfficers(
          (list as any[])
            .map(s => ({ id: s.id, name: s.displayName }))
            .filter(x => x.id != null)
        )
      } catch (err) {
        console.error('Failed to fetch officers', err)
        setOfficers([])
      }
    })()
  }, [selectedOfficeId])

  // Centers by officer
  useEffect(() => {
    if (!selectedOfficerId) {
      setCenters([])
      setSelectedCenterId('')
      return
    }
    ;(async () => {
      try {
        const res = await fineract.get('/runreports/GroupNamesByStaff', {
          params: {
            R_staffId: Number(selectedOfficerId),
            genericResultSet: false,
          },
        })
        // Normalize report rows
        const rows = res.data?.data ?? res.data ?? []
        const normalized: BasicItem[] = (rows as any[])
          .map((r: any) => {
            const id = r.id ?? r.row?.[0] ?? r[0]
            const name = r.name ?? r.row?.[1] ?? r[1]
            return { id: Number(id), name: String(name) }
          })
          .filter(x => x.id != null && !Number.isNaN(x.id))
        setCenters(normalized)
      } catch (err) {
        console.error('Failed to fetch centers', err)
        setCenters([])
      }
    })()
  }, [selectedOfficerId])

  // Groups by center
  useEffect(() => {
    if (!selectedCenterId) {
      setGroups([])
      setSelectedGroupId('')
      return
    }
    ;(async () => {
      try {
        const res = await fineract.get('/groups', {
          params: { centerId: Number(selectedCenterId) },
        })
        const list = res.data?.pageItems ?? []
        setGroups(list.map((g: any) => ({ id: g.id, name: g.name })))
      } catch (err) {
        console.error('Failed to fetch groups', err)
        setGroups([])
      }
    })()
  }, [selectedCenterId])

  // Clients by group
  useEffect(() => {
    if (!selectedGroupId) {
      setClients([])
      setSelectedClientId('')
      return
    }
    ;(async () => {
      try {
        const res = await fineract.get('/clients', {
          params: { groupId: Number(selectedGroupId) },
        })
        const list = res.data?.pageItems ?? []
        setClients(list.map((c: any) => ({ id: c.id, name: c.displayName })))
      } catch (err) {
        console.error('Failed to fetch clients', err)
        setClients([])
      }
    })()
  }, [selectedGroupId])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('nav.home'), href: '/home' },
          { label: t('nav.navigation'), current: true },
        ]}
      />

      <div className="flex gap-10 py-4">
        {/* LEFT Select  */}
        <div className="bg-white p-8 w-[36rem] dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col gap-6">
          {/* Office */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel={t('fields.office')}
              selectValue={selectedOfficeId}
              selectOnChange={value => {
                setSelectedOfficeId(value)
                setSelectedOfficerId('')
                setSelectedCenterId('')
                setSelectedGroupId('')
                setSelectedClientId('')
              }}
              selectPlaceholder={t('ui.selectOffice')}
              selectOptions={(offices ?? [])
                .filter(o => o?.id !== undefined)
                .map(o => ({ id: o.id!, name: o.name! }))}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* Officers */}
          {selectedOfficeId && (
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel={
                  officers.length
                    ? t('navigation.associatedOfficers')
                    : t('navigation.noAssociatedOfficers')
                }
                selectValue={selectedOfficerId}
                selectOnChange={value => {
                  setSelectedOfficerId(value)
                  setSelectedCenterId('')
                  setSelectedGroupId('')
                  setSelectedClientId('')
                }}
                selectPlaceholder={
                  officers.length
                    ? t('navigation.selectOfficer')
                    : t('navigation.noAssociatedOfficers')
                }
                selectOptions={officers.map(s => ({ id: s.id, name: s.name }))}
                selectClassname="w-full space-y-2"
              />
            </div>
          )}

          {/* Centers */}
          {selectedOfficerId && (
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel={
                  centers.length
                    ? t('navigation.selectCenter')
                    : t('navigation.noAssociatedCenters')
                }
                selectValue={selectedCenterId}
                selectOnChange={value => {
                  setSelectedCenterId(value)
                  setSelectedGroupId('')
                  setSelectedClientId('')
                }}
                selectPlaceholder={
                  centers.length
                    ? t('navigation.selectCenter')
                    : t('navigation.noAssociatedCenters')
                }
                selectOptions={centers.map(c => ({ id: c.id, name: c.name }))}
                selectClassname="w-full space-y-2"
              />
            </div>
          )}

          {/* Groups */}
          {selectedCenterId && (
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel={
                  groups.length
                    ? t('navigation.selectGroup')
                    : t('navigation.noAssociatedGroups')
                }
                selectValue={selectedGroupId}
                selectOnChange={value => {
                  setSelectedGroupId(value)
                  setSelectedClientId('')
                }}
                selectPlaceholder={
                  groups.length
                    ? t('navigation.selectGroup')
                    : t('navigation.noAssociatedGroups')
                }
                selectOptions={groups.map(g => ({ id: g.id, name: g.name }))}
                selectClassname="w-full space-y-2"
              />
            </div>
          )}

          {/* Clients */}
          {selectedGroupId && (
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel={
                  clients.length
                    ? t('navigation.selectClient')
                    : t('navigation.noAssociatedClients')
                }
                selectValue={selectedClientId}
                selectOnChange={value => setSelectedClientId(value)}
                selectPlaceholder={
                  clients.length
                    ? t('navigation.selectClient')
                    : t('navigation.noAssociatedClients')
                }
                selectOptions={clients.map(c => ({ id: c.id, name: c.name }))}
                selectClassname="w-full space-y-2"
              />
            </div>
          )}
        </div>

        {/* RIGHT Details */}
        <div className="bg-white h-full p-8 w-[36rem] dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col">
          {selectedClientId ? (
            <ClientNavigation clientId={parseInt(selectedClientId)} />
          ) : selectedGroupId ? (
            <GroupNavigation groupId={parseInt(selectedGroupId)} />
          ) : selectedCenterId ? (
            <CenterNavigation centerId={parseInt(selectedCenterId)} />
          ) : selectedOfficerId ? (
            <StaffNavigation staffId={parseInt(selectedOfficerId)} />
          ) : selectedOfficeId ? (
            <OfficeNavigation officeId={parseInt(selectedOfficeId)} />
          ) : (
            <p>{t('navigation.pleaseSelectOffice')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navigation
