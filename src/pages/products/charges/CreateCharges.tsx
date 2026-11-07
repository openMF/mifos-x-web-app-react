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
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { ChargesApi, type ChargeData, type ChargeRequest } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const chargesApi = new ChargesApi(getConfiguration())

const CreateCharges = () => {
  const navigate = useNavigate()

  //inital template state for dropdowns
  const [template, setTemplate] = useState<ChargeData | null>(null)

  //formstate
  const [formData, setFormData] = useState<ChargeRequest>({
    chargeAppliesTo: undefined,
    name: '',
    currencyCode: '',
    chargeTimeType: undefined,
    chargeCalculationType: undefined,
    chargePaymentMode: undefined,
    amount: undefined,
    active: false,
    penalty: false,
  })

  //api to fetch template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await chargesApi.retrieveNewChargeDetails()
        setTemplate(res.data)
      } catch (err) {
        console.error('Failed to fetch charge template', err)
      }
    }
    fetchTemplate()
  }, [])

  const chargeAppliesToOptions = (template?.chargeAppliesToOptions ?? []).map(
    o => ({
      id: o.id!.toString(),
      name: o.value!,
    })
  )

  const currencyOptions = (template?.currencyOptions ?? []).map(c => ({
    id: c.code!,
    name: c.name!,
  }))

  const chargeTimeTypeOptions = (template?.chargeTimeTypeOptions ?? []).map(
    o => ({
      id: o.id!.toString(),
      name: o.value!,
    })
  )

  const chargeCalculationTypeOptions = (
    template?.chargeCalculationTypeOptions ?? []
  ).map(o => ({
    id: o.id!.toString(),
    name: o.value!,
  }))

  const chargePaymentModeOptions = (
    template?.chargePaymetModeOptions ?? []
  ).map(o => ({
    id: o.id!.toString(),
    name: o.value!,
  }))

  const showPaymentMode =
    formData.chargeAppliesTo === 1 || formData.chargeAppliesTo === 5

  //submit form api
  const handleSubmit = async () => {
    try {
      const payload: ChargeRequest = {
        ...formData,
        locale: 'en',
        monthDayFormat: 'dd MMM',
      }
      await chargesApi.createCharge(payload)
      navigate('/products/charges')
    } catch (err) {
      console.error('Failed to create charge', err)
    }
  }

  const isValid =
    formData.chargeAppliesTo !== undefined &&
    formData.name &&
    formData.currencyCode &&
    formData.chargeTimeType !== undefined &&
    formData.chargeCalculationType !== undefined &&
    formData.amount !== undefined &&
    (!showPaymentMode || formData.chargePaymentMode !== undefined)

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          { label: 'Charges', href: '/products/charges' },
          { label: 'Create', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-5xl mx-auto mt-6">
        <div className="space-y-6">
          <AppSelect
            selectLabel="Charge Applies To*"
            selectPlaceholder="Select Charge Applies To"
            selectValue={formData.chargeAppliesTo?.toString() ?? ''}
            selectOnChange={val =>
              setFormData(prev => ({ ...prev, chargeAppliesTo: +val }))
            }
            selectOptions={chargeAppliesToOptions}
            selectClassname="space-y-2 max-w-md"
          />

          {formData.chargeAppliesTo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Charge Name*</Label>
                <Input
                  id="name"
                  value={formData.name ?? ''}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <AppSelect
                selectLabel="Currency*"
                selectPlaceholder="Select Currency"
                selectValue={formData.currencyCode ?? ''}
                selectOnChange={val =>
                  setFormData(prev => ({ ...prev, currencyCode: val }))
                }
                selectOptions={currencyOptions}
                selectClassname="space-y-2"
              />

              <AppSelect
                selectLabel="Charge Time Type*"
                selectPlaceholder="Select Charge Time Type"
                selectValue={formData.chargeTimeType?.toString() ?? ''}
                selectOnChange={val =>
                  setFormData(prev => ({ ...prev, chargeTimeType: +val }))
                }
                selectOptions={chargeTimeTypeOptions}
                selectClassname="space-y-2"
              />

              <AppSelect
                selectLabel="Charge Calculation Type*"
                selectPlaceholder="Select Calculation Type"
                selectValue={formData.chargeCalculationType?.toString() ?? ''}
                selectOnChange={val =>
                  setFormData(prev => ({
                    ...prev,
                    chargeCalculationType: +val,
                  }))
                }
                selectOptions={chargeCalculationTypeOptions}
                selectClassname="space-y-2"
              />

              {showPaymentMode && (
                <AppSelect
                  selectLabel="Charge Payment Mode*"
                  selectPlaceholder="Select Payment Mode"
                  selectValue={formData.chargePaymentMode?.toString() ?? ''}
                  selectOnChange={val =>
                    setFormData(prev => ({ ...prev, chargePaymentMode: +val }))
                  }
                  selectOptions={chargePaymentModeOptions}
                  selectClassname="space-y-2"
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount*</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount ?? ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      amount:
                        e.target.value === '' ? undefined : +e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tax Group</Label>
                <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
                  Missing in OpenAPI
                </div>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="active"
                    checked={formData.active ?? false}
                    onCheckedChange={v =>
                      setFormData(prev => ({ ...prev, active: !!v }))
                    }
                  />
                  <Label
                    htmlFor="active"
                    className="cursor-pointer font-normal"
                  >
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="penalty"
                    checked={formData.penalty ?? false}
                    onCheckedChange={v =>
                      setFormData(prev => ({ ...prev, penalty: !!v }))
                    }
                  />
                  <Label
                    htmlFor="penalty"
                    className="cursor-pointer font-normal"
                  >
                    is Penalty
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/products/charges')}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCharges
