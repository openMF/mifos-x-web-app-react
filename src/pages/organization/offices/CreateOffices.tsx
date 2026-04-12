/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { OfficesApi, type GetOfficesResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import AppSelect from '@/components/custom/select/AppSelect'

const officesApi = new OfficesApi(getConfiguration())

const CreateOffices = () => {
  const navigate = useNavigate()
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])

  // form state
  const [formData, setFormData] = useState({
    officeName: '',
    parentOffice: '',
    openedOn: '',
    externalId: '',
  })

  // format input date to "dd MMMM yyyy"
  const formattedDate = new Date(formData.openedOn).toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  )

  // fetch offices for dropdown
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await officesApi.retrieveOffices()
        setOffices(response.data || [])
      } catch (err) {
        console.error('Failed to fetch offices', err)
      }
    }
    fetchOffices()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // submit new office
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.officeName || !formData.openedOn || !formData.parentOffice) {
      alert('Please fill all required fields.')
      return
    }

    try {
      await officesApi.createOffice({
        name: formData.officeName,
        parentId: Number(formData.parentOffice),
        openingDate: formattedDate,
        externalId: formData.externalId,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      })
      alert('Office created successfully!')
      navigate('/organization/offices')
    } catch (err) {
      console.error('Failed to create office', err)
      alert('Failed to create office')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Offices', href: '/organization/offices' },
          { label: 'Create Office', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Office</h2>

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

          {/* Parent Office Select */}
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
              type="text"
              value={formData.externalId}
              onChange={e => handleChange('externalId', e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
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

export default CreateOffices
