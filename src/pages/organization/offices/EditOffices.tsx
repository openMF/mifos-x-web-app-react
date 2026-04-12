/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import { OfficesApi, type GetOfficesResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const officesApi = new OfficesApi(getConfiguration())

const EditOffices = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [formData, setFormData] = useState({
    officeName: '',
    parentOffice: '',
    openedOn: '',
    externalId: '',
  })

  // fetch office list + details of office being edited
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allOfficesRes = await officesApi.retrieveOffices()
        setOffices(allOfficesRes.data || [])

        if (id) {
          const officeRes = await officesApi.retrieveOffice(Number(id))
          setFormData({
            officeName: officeRes.data.name ?? '',
            parentOffice: officeRes.data.allowedParents?.toString() ?? '',
            openedOn: officeRes.data.openingDate ?? '',
            externalId: officeRes.data.externalId ?? '',
          })
        }
      } catch (err) {
        console.error('Failed to fetch office data', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // update office
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formattedDate = new Date(formData.openedOn).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    )

    try {
      await officesApi.updateOffice(Number(id), {
        name: formData.officeName,
        openingDate: formattedDate,
        externalId: formData.externalId,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      })

      alert('Office updated successfully!')
      navigate('/organization/offices')
    } catch (err) {
      console.error('Failed to update office', err)
      alert('Failed to update office')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization' },
          { label: 'Offices', href: '/organization/offices' },
          { label: 'Edit Office', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Office</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office Name */}
          <div className="w-full space-y-2">
            <Label>Office Name*</Label>
            <Input
              value={formData.officeName}
              onChange={e => handleChange('officeName', e.target.value)}
              required
            />
          </div>

          {/* Parent Office */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Parent Office*"
              selectPlaceholder="Select Parent Office"
              selectValue={formData.parentOffice}
              selectOnChange={val => handleChange('parentOffice', val)}
              selectClassname="w-full space-y-2"
              selectOptions={offices.map(o => ({
                id: o.id?.toString() || '',
                name: o.name || '',
              }))}
            />
          </div>

          {/* Opened On */}
          <div className="w-full space-y-2">
            <Label>Opened On*</Label>
            <Input
              type="date"
              value={formData.openedOn}
              onChange={e => handleChange('openedOn', e.target.value)}
              required
            />
          </div>

          {/* External ID */}
          <div className="w-full space-y-2">
            <Label>External ID*</Label>
            <Input
              value={formData.externalId}
              onChange={e => handleChange('externalId', e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/offices')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditOffices
