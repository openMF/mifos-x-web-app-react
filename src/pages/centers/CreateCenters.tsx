/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import AppSelect from '@/components/custom/select/AppSelect'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'

import { getConfiguration } from '@/lib/fineract-openapi'
import {
  CentersApi,
  OfficesApi,
  StaffApi,
  type GetOfficesResponse,
  type StaffData,
} from '@/fineract-api'

// API instances
const centersApi = new CentersApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())

const CreateCenters = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  // Dropdown data
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [staff, setStaff] = useState<StaffData[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    officeId: '',
    staffId: '',
    active: false,
    externalId: '',
    submittedOnDate: '',
    activationDate: '',
    dateFormat: 'dd MMMM yyyy',
    locale: 'en',
  })

  // Fetch offices + staff on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [officesRes, staffRes] = await Promise.all([
          officesApi.retrieveOffices(),
          staffApi.retrieveAll16(),
        ])
        const officeItems = Array.from(officesRes.data ?? [])
        const staffItems = Array.from(staffRes.data ?? [])
        setOffices(officeItems)
        setStaff(staffItems)
      } catch (err) {
        console.error('Failed to fetch offices/staff', err)
      }
    }

    fetchInitialData()
  }, [])

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await centersApi.create7({
        ...formData,
        officeId: Number(formData.officeId),
        active: formData.active,
      })
      navigate('/centers')
    } catch (err) {
      console.error('Failed to create center', err)
      alert(t('create.errorCreate'))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/centers' },
          { label: t('create.heading'), current: true },
        ]}
      />

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('create.heading')}</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Center Name */}
          <div className="space-y-2">
            <Label>{t('create.labelName')}</Label>
            <Input
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Office select */}
          <AppSelect
            selectLabel={t('create.labelOffice')}
            selectValue={formData.officeId}
            selectPlaceholder={t('create.selectOffice')}
            selectClassname="w-full space-y-2"
            selectOnChange={value =>
              setFormData(prev => ({ ...prev, officeId: value }))
            }
            selectOptions={offices.map(o => ({
              id: o.id?.toString() ?? '',
              name: o.name ?? '',
            }))}
          />

          {/* Staff select */}
          <AppSelect
            selectLabel={t('create.labelStaff')}
            selectValue={formData.staffId}
            selectPlaceholder={t('create.selectStaff')}
            selectClassname="w-full space-y-2"
            selectOnChange={value =>
              setFormData(prev => ({ ...prev, staffId: value }))
            }
            selectOptions={staff.map(s => ({
              id: s.id?.toString() ?? '',
              name: s.displayName ?? '',
            }))}
          />

          {/* Active toggle */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.active}
              onCheckedChange={val =>
                setFormData(prev => ({ ...prev, active: Boolean(val) }))
              }
            />
            <Label className="text-md">{t('create.labelActive')}</Label>
          </div>

          {/* Activation date */}
          {formData.active && (
            <div className="space-y-2">
              <Label>{t('create.labelActivationDate')}</Label>
              <Input
                type="date"
                value={
                  formData.activationDate
                    ? new Date(formData.activationDate)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={e => {
                  const val = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    activationDate: val
                      ? new Date(val).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '',
                  }))
                }}
              />
            </div>
          )}

          {/* External ID */}
          <div className="space-y-2">
            <Label>{t('create.labelExternalId')}</Label>
            <Input
              value={formData.externalId}
              onChange={e =>
                setFormData(prev => ({ ...prev, externalId: e.target.value }))
              }
            />
          </div>

          {/* Submitted On date */}
          <div className="space-y-2">
            <Label>{t('create.labelSubmittedOn')}</Label>
            <Input
              type="date"
              value={
                formData.submittedOnDate
                  ? new Date(formData.submittedOnDate)
                      .toISOString()
                      .split('T')[0]
                  : ''
              }
              onChange={e => {
                const val = e.target.value
                setFormData(prev => ({
                  ...prev,
                  submittedOnDate: val
                    ? new Date(val).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '',
                }))
              }}
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/centers')}
            >
              {tc('actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {tc('actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCenters
