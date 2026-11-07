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
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { PaymentTypeApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const paymentTypeApi = new PaymentTypeApi(getConfiguration())

const EditPaymentTypes = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [isSystemDefined, setIsSystemDefined] = useState(false)

  //form payload
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isCashPayment: false,
    position: '1',
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const res = await paymentTypeApi.retrieveOnePaymentType(Number(id))
        const p = res.data ?? {}
        setIsSystemDefined(p.isSystemDefined ?? false)
        setFormData({
          name: p.name ?? '',
          description: p.description ?? '',
          isCashPayment: p.isCashPayment ?? false,
          position: p.position != null ? String(p.position) : '1',
        })
      } catch (err) {
        console.error('Failed to load payment type', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert('Payment Type is required.')
      return
    }
    const positionNum = Number(formData.position)
    if (
      !isSystemDefined &&
      (!formData.position || Number.isNaN(positionNum) || positionNum < 1)
    ) {
      alert('Position must be a positive number.')
      return
    }
    try {
      await paymentTypeApi.updatePaymentType(Number(id), {
        name: formData.name,
        description: formData.description,
        isCashPayment: isSystemDefined ? undefined : formData.isCashPayment,
        position: isSystemDefined ? undefined : positionNum,
      })
      alert('Payment Type updated successfully!')
      navigate('/organization/payment-types')
    } catch (err) {
      console.error('Failed to update payment type', err)
      alert('Failed to update payment type')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Payment Types', href: '/organization/payment-types' },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Payment Type</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Payment Type Name */}
          <div className="space-y-2">
            <Label>Payment Type*</Label>
            <Input
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          {!isSystemDefined && (
            <>
              {/* Is Cash Payment */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isCashPayment}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      isCashPayment: checked === true,
                    }))
                  }
                />
                <Label>Is Cash Payment?</Label>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position*</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.position}
                  onChange={e => handleChange('position', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6">
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

export default EditPaymentTypes
