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
  TaxComponentsApi,
  type GetTaxesComponentsResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const taxComponentsApi = new TaxComponentsApi(getConfiguration())

//date format function
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const EditTaxComponents = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [taxComponent, setTaxComponent] =
    useState<GetTaxesComponentsResponse | null>(null)

  //formdata to edit
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
    startDate: '',
  })

  useEffect(() => {
    const fetchTaxComponent = async () => {
      try {
        const res = await taxComponentsApi.retrieveTaxComponent(Number(id))
        const data = res.data
        setTaxComponent(data)
        setFormData({
          name: data.name ?? '',
          percentage: data.percentage?.toString() ?? '',
          startDate: data.startDate ?? '',
        })
      } catch (err) {
        console.error('Failed to fetch tax component', err)
      }
    }
    fetchTaxComponent()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await taxComponentsApi.updateTaxCompoent(Number(id), {
        name: formData.name,
        percentage: +formData.percentage,
        startDate: formatDate(formData.startDate),
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      })
      navigate(`/products/tax-configurations/tax-components/${id}`)
    } catch (err) {
      console.error('Failed to update tax component', err)
    }
  }

  if (!taxComponent) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Tax Configurations',
            href: '/products/tax-configurations',
          },
          {
            label: 'Tax Components',
            href: '/products/tax-configurations/tax-components',
          },
          {
            label: taxComponent?.name || `${id}`,
            href: `/products/tax-configurations/tax-components/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Tax Component</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage*</Label>
            <Input
              id="percentage"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={formData.percentage}
              onChange={e =>
                setFormData(prev => ({ ...prev, percentage: e.target.value }))
              }
            />
          </div>

          {taxComponent.creditAccountType?.code && (
            <div className="space-y-2">
              <Label>Credit Account Type</Label>
              <Input value={taxComponent.creditAccountType.code} disabled />
            </div>
          )}

          {taxComponent.creditAccount?.name && (
            <div className="space-y-2">
              <Label>Credit Account</Label>
              <Input
                value={`(${taxComponent.creditAccount.glCode}) ${taxComponent.creditAccount.name}`}
                disabled
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date*</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={e =>
                setFormData(prev => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/products/tax-configurations/tax-components/${id}`)
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={
                !formData.name || !formData.percentage || !formData.startDate
              }
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTaxComponents
