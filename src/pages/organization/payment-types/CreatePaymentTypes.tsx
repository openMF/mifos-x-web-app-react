/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { PaymentTypeApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const paymentTypeApi = new PaymentTypeApi(getConfiguration())

const CreatePaymentTypes = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    paymentType: '',
    description: '',
    position: '',
    isCashPayment: false,
  })

  // create payment type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await paymentTypeApi.createPaymentType({
        name: formData.paymentType,
        description: formData.description || undefined,
        position: Number(formData.position),
        isCashPayment: formData.isCashPayment,
      })

      navigate('/organization/payment-types')
    } catch (err) {
      console.error('Failed to create payment type', err)
      alert('Failed to create payment type')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Payment Types', href: '/organization/payment-types' },
          { label: 'Create Payment Type', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Payment Type</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type*</Label>
            <Input
              value={formData.paymentType}
              onChange={e =>
                setFormData(prev => ({ ...prev, paymentType: e.target.value }))
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          {/* Cash Payment checkbox */}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isCashPayment}
              onCheckedChange={val =>
                setFormData(prev => ({ ...prev, isCashPayment: Boolean(val) }))
              }
            />
            <Label className="text-md">Is Cash Payment?</Label>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Position*</Label>
            <Input
              type="number"
              value={formData.position}
              onChange={e =>
                setFormData(prev => ({ ...prev, position: e.target.value }))
              }
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/payment-types')}
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

export default CreatePaymentTypes
