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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import { CollateralManagementApi, type CurrencyData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

// API instance
const collateralApi = new CollateralManagementApi(getConfiguration())

const CreateCollaterals = () => {
  const navigate = useNavigate()

  // Template data
  const [template, setTemplate] = useState<CurrencyData[] | null>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unitType: '',
    pctToBase: '',
    basePrice: '',
    currency: '',
    quality: '',
  })

  // Fetch collateral template (currencies, etc.) on mount
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await collateralApi.getCollateralTemplate()
        setTemplate(res.data)
      } catch (err) {
        console.error('Failed to fetch collateral template', err)
      }
    }

    fetchTemplate()
  }, [])

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ensure all fields are filled
    const missingField = Object.entries(formData).find(([_, val]) => !val)
    if (missingField) {
      alert('Please fill all required fields.')
      return
    }

    try {
      // API call to create collateral
      await collateralApi.createCollateral1({
        name: formData.name,
        unitType: formData.unitType,
        pctToBase: Number(formData.pctToBase),
        basePrice: Number(formData.basePrice),
        currency: formData.currency,
        quality: formData.quality,
        locale: 'en',
      })

      alert('Collateral created successfully!')
      navigate('/products/collaterals')
    } catch (err) {
      console.error('Failed to create collateral', err)
      alert('Failed to create collateral')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products' },
          { label: 'Collaterals', href: '/products/collaterals' },
          { label: 'Create Collateral', current: true },
        ]}
      />

      {/* Form Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Collateral</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Name*</Label>
              <Input
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="w-full md:w-[48%] space-y-2">
              <Label>Type/Quality*</Label>
              <Input
                value={formData.quality}
                onChange={e =>
                  setFormData(prev => ({ ...prev, quality: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Unit Type*</Label>
              <Input
                value={formData.unitType}
                onChange={e =>
                  setFormData(prev => ({ ...prev, unitType: e.target.value }))
                }
              />
            </div>

            <div className="w-full md:w-[48%] space-y-2">
              <Label>Base Price*</Label>
              <Input
                type="number"
                value={formData.basePrice}
                onChange={e =>
                  setFormData(prev => ({ ...prev, basePrice: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Percentage to Base*</Label>
              <Input
                type="number"
                value={formData.pctToBase}
                onChange={e =>
                  setFormData(prev => ({ ...prev, pctToBase: e.target.value }))
                }
              />
            </div>

            {/* Currency dropdown */}
            <AppSelect
              selectLabel="Currency *"
              selectValue={formData.currency}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, currency: value }))
              }
              selectPlaceholder="Select currency"
              selectOptions={(template || []).map(c => ({
                id: c.code!,
                name: c.name ?? c.code!,
              }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products/collaterals')}
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

export default CreateCollaterals
