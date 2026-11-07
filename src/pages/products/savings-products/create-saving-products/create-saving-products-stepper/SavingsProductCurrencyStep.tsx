/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import AppSelect from '@/components/custom/select/AppSelect'
import type {
  PostSavingsProductsRequest,
  GetSavingsProductsTemplateResponse,
} from '@/fineract-api'

interface SavingsProductCurrencyStepProps {
  formData: PostSavingsProductsRequest
  onChange: (data: PostSavingsProductsRequest) => void
  template: GetSavingsProductsTemplateResponse | undefined
}

const SavingsProductCurrencyStep = ({
  formData,
  onChange,
  template,
}: SavingsProductCurrencyStepProps) => {
  const [setMultiples, setSetMultiples] = useState(
    formData.inMultiplesOf !== undefined
  )

  const currencyOptions = Array.from(template?.currencyOptions ?? []).map(
    c => ({
      id: c.code!,
      name: c.name!,
      decimalPlaces: c.decimalPlaces!,
    })
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Saving products currency */}
      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel="Currency*"
          selectPlaceholder="Select Currency"
          selectValue={formData.currencyCode ?? ''}
          selectOnChange={code => {
            const selected = currencyOptions.find(c => c.id === code)
            onChange({
              ...formData,
              currencyCode: code,
              digitsAfterDecimal:
                selected?.decimalPlaces ?? formData.digitsAfterDecimal,
            })
          }}
          selectOptions={currencyOptions}
          selectClassname="flex-1 space-y-2"
        />

        <div className="flex-1 space-y-2">
          <Label>Decimal Places*</Label>
          <Input
            type="number"
            min={0}
            value={formData.digitsAfterDecimal ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                digitsAfterDecimal:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="setMultiples"
          checked={setMultiples}
          onCheckedChange={v => {
            setSetMultiples(!!v)
            if (!v) onChange({ ...formData, inMultiplesOf: undefined })
          }}
        />
        <Label htmlFor="setMultiples" className="cursor-pointer font-normal">
          Set the saving installment in multiples of
        </Label>
      </div>

      {setMultiples && (
        <div className="flex-1 space-y-2">
          <Label>Currency in multiples of</Label>
          <Input
            type="number"
            min={1}
            placeholder="Currency in multiples of"
            value={formData.inMultiplesOf ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                inMultiplesOf:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  )
}

export default SavingsProductCurrencyStep
