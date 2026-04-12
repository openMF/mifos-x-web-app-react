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
import { DelinquencyRangeAndBucketsManagementApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

// API instance for delinquency ranges
const delinquencyApi = new DelinquencyRangeAndBucketsManagementApi(
  getConfiguration()
)

const EditDelinquencyRange = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Local state for form fields
  const [formData, setFormData] = useState({
    classification: '',
    daysFrom: '',
    daysTo: '',
  })

  useEffect(() => {
    // Fetch existing delinquency range details for pre-filling form
    const fetchData = async () => {
      try {
        const res = await delinquencyApi.getDelinquencyRange(Number(id))
        setFormData({
          classification: res.data.classification ?? '',
          daysFrom: String(res.data.minimumAgeDays ?? ''),
          daysTo: String(res.data.maximumAgeDays ?? ''),
        })
      } catch (err) {
        console.error('Failed to fetch delinquency range', err)
      }
    }

    if (id) fetchData()
  }, [id])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.classification || !formData.daysFrom || !formData.daysTo) {
      alert('Please fill all required fields.')
      return
    }

    try {
      // Update delinquency range using API
      await delinquencyApi.updateDelinquencyRange(Number(id), {
        classification: formData.classification,
        minimumAgeDays: Number(formData.daysFrom),
        maximumAgeDays: Number(formData.daysTo),
        locale: 'en',
      })

      alert('Delinquency range updated!')
      navigate('/products/delinquency-bucket-configurations/ranges')
    } catch (err) {
      console.error('Failed to update delinquency range', err)
      alert('Failed to update delinquency range')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Delinquency Bucket Configurations',
            href: '/products/delinquency-bucket-configurations',
          },
          {
            label: 'Delinquency Ranges',
            href: '/products/delinquency-bucket-configurations/ranges',
          },
          { label: 'Edit', current: true },
        ]}
      />

      {/* Form container */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit</h2>

        {/* Edit delinquency range form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Classification*</Label>
            <Input
              value={formData.classification}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  classification: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Days From*</Label>
            <Input
              type="number"
              value={formData.daysFrom}
              onChange={e =>
                setFormData(prev => ({ ...prev, daysFrom: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Days Till*</Label>
            <Input
              type="number"
              value={formData.daysTo}
              onChange={e =>
                setFormData(prev => ({ ...prev, daysTo: e.target.value }))
              }
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate('/products/delinquency-bucket-configurations/ranges')
              }
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

export default EditDelinquencyRange
