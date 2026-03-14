/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'
import { CentersApi, type GetCentersCenterIdResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const centersApi = new CentersApi(getConfiguration())

const EditCenters = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const [center, setCenter] = useState<GetCentersCenterIdResponse>()
  const [staffId, setStaffId] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await centersApi.retrieveOne14(Number(id))
        setCenter(res.data)
      } catch (err) {
        console.log("Can't fetch center", err)
      }
    })()
  }, [id])

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/centers' },
          { label: center?.name ?? t('title'), href: `/centers/${id}` },
          { label: t('edit.breadcrumb'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('edit.heading')}</h2>

        <div className="space-y-6">
          <div className="flex flex-col gap-6">
            <div className="w-full space-y-2">
              <Label htmlFor="center-name">{t('edit.labelName')}</Label>
              <Input
                id="center-name"
                defaultValue={center?.name ?? ''}
                placeholder={t('edit.placeholderName')}
                className="w-full"
              />
            </div>

            {/* <AppSelect
                selectLabel="Staff"
                selectValue={staffId} // string
                selectOnChange={(val: string) => setStaffId(val)} // keep as string
                selectPlaceholder="Select Staff"
                selectOptions={
                  center?.staffOptions?.map((s) => ({
                    label: s.displayName,
                    value: String(s.id),
                  })) ?? []
                }
                selectClassname="w-full space-y-2"
              /> */}

            <div className="w-full space-y-2">
              <Label htmlFor="external-id">{t('edit.labelExternalId')}</Label>
              <Input
                id="external-id"
                defaultValue={center?.officeId ?? ''}
                placeholder={t('edit.placeholderExternalId')}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate(`/centers/${id}/general`)}
            >
              {tc('actions.cancel')}
            </Button>

            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              // no submit logic per your request
              onClick={() => console.log('Selected staff:', staffId)}
            >
              {tc('actions.submit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditCenters
