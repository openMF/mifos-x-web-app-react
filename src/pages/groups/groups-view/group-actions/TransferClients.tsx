/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

import { GroupsApi, type GetGroupsGroupIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

const groupsApi = new GroupsApi(getConfiguration())

const TransferClients = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  const [group, setGroup] = useState<GetGroupsGroupIdResponse | null>(null)
  const [destOptions, setDestOptions] = useState<
    { id: number; name: string }[]
  >([])

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [inheritLoanOfficer, setInheritLoanOfficer] = useState(false)
  const [destinationGroupId, setDestinationGroupId] = useState('')

  // GET current group with associations
  useEffect(() => {
    ;(async () => {
      if (!id) return
      try {
        const res = await groupsApi.retrieveOne15(
          Number(id),
          undefined,
          undefined,
          { params: { associations: 'all' } }
        )
        setGroup(res.data)
      } catch (e) {
        console.error('Failed to fetch group (associations=all)', e)
      }
    })()
  }, [id])

  // GET list of groups for destination dropdown (filter out current)
  useEffect(() => {
    ;(async () => {
      try {
        // adjust if your SDK uses a different name for list-all
        const list: any = await (groupsApi as any).retrieveAll17?.()
        const items = list?.data?.pageItems ?? list?.data ?? []
        const opts = items
          .filter((g: any) => g?.id && String(g.id) !== id)
          .map((g: any) => ({ id: g.id, name: g.name ?? t('transferClients.groupFallback', { id: g.id }) }))
        setDestOptions(opts)
      } catch (e) {
        // if list call isn't available, leave empty; you can fallback to manual input below
        console.error('Failed to fetch destination groups', e)
      }
    })()
  }, [id])

  const submitDisabled =
    selectedMemberIds.length === 0 || destinationGroupId.trim().length === 0

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/groups' },
          { label: group?.name ?? t('view.groupName'), href: `/groups/${id}/general` },
          { label: t('transferClients.breadcrumb'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('transferClients.heading')}</h2>

        <div className="space-y-8">
          {/* Members (multi) */}
          <div className="space-y-2">
            <Label>{t('transferClients.labelSelectMembers')}</Label>
          </div>

          {/* Inherit LO */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="inherit-lo"
              checked={inheritLoanOfficer}
              onCheckedChange={v => setInheritLoanOfficer(Boolean(v))}
            />
            <Label htmlFor="inherit-lo" className="cursor-pointer">
              {t('transferClients.labelInheritLoanOfficer')}
            </Label>
          </div>

          {/* Destination Group (AppSelect) */}
          {destOptions.length > 0 ? (
            <AppSelect
              selectLabel={t('transferClients.labelDestinationGroup')}
              selectValue={destinationGroupId}
              selectOnChange={(val: string) => setDestinationGroupId(val)}
              selectPlaceholder={t('transferClients.placeholderDestinationGroup')}
              selectOptions={destOptions}
              selectClassname="w-full"
            />
          ) : (
            // fallback if list isn't available; remove if you always have options
            <div className="space-y-2">
              <Label htmlFor="destination-group">{t('transferClients.labelDestinationGroup')}</Label>
              <Input
                id="destination-group"
                placeholder={t('transferClients.placeholderInputGroup')}
                value={destinationGroupId}
                onChange={e => setDestinationGroupId(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate(`/groups/${id}/general`)}
            >
              {tc('actions.cancel')}
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              disabled={submitDisabled}
              onClick={() =>
                console.log('Would submit:', {
                  selectedMemberIds,
                  inheritLoanOfficer,
                  destinationGroupId,
                })
              }
            >
              {tc('actions.submit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferClients
