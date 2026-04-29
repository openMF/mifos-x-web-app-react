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

import {
  HolidaysApi,
  type GetHolidaysResponse,
  type PutHolidaysHolidayIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const holidaysApi = new HolidaysApi(getConfiguration())

const EditHolidays = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const holidayId = Number(id)

  const [holiday, setHoliday] = useState<GetHolidaysResponse>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    const fetchHolidayData = async () => {
      try {
        const res = await holidaysApi.retrieveOne7(holidayId)
        const holidayData = res.data

        setHoliday(holidayData)
        setFormData({
          name: holidayData.name ?? '',
          description:
            (holidayData as GetHolidaysResponse & { description?: string })
              .description ?? '',
        })
      } catch (err) {
        console.error('Failed to fetch holiday', err)
        alert('Failed to fetch holiday')
      } finally {
        setIsLoading(false)
      }
    }

    if (holidayId) {
      fetchHolidayData()
    }
  }, [holidayId])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill all required fields.')
      return
    }

    const payload: PutHolidaysHolidayIdRequest = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    }

    try {
      setIsSubmitting(true)
      await holidaysApi.update6(holidayId, payload)
      alert('Holiday updated successfully!')
      navigate(`/organization/holidays/${holidayId}`)
    } catch (err) {
      console.error('Failed to update holiday', err)
      alert('Failed to update holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Holidays', href: '/organization/holidays' },
          {
            label: holiday?.name || (id ? `Holiday ${id}` : 'Holiday'),
            href: id
              ? `/organization/holidays/${id}`
              : '/organization/holidays',
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Holiday</h2>

        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Name*</Label>
              <Input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description*</Label>
              <Input
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/organization/holidays/${holidayId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditHolidays
