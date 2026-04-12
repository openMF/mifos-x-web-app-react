/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'

interface CurrencyOption {
  id: string
  name: string
  decimalPlaces: number
}

interface SavingsProductCurrencyFormData {
  currency: CurrencyOption | null
  decimalPlaces: number
  currencyMultiples: string
  [key: string]: unknown
}

const SavingsProductCurrencyStep = ({
  formData,
  setFormData,
  currencyOptions,
}: {
  formData: SavingsProductCurrencyFormData
  setFormData: (
    updater: (
      prev: SavingsProductCurrencyFormData
    ) => SavingsProductCurrencyFormData
  ) => void
  currencyOptions: CurrencyOption[]
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Currency"
            selectValue={formData.currency?.id ?? ''}
            selectOnChange={code => {
              const selected = currencyOptions.find(c => c.id === code)
              if (selected) {
                setFormData(prev => ({
                  ...prev,
                  currency: selected,
                  decimalPlaces: selected.decimalPlaces,
                }))
              }
            }}
            selectPlaceholder="Select Currency"
            selectOptions={currencyOptions}
            selectClassname="w-full space-y-2"
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Decimal Places*</Label>
          <Input
            type="number"
            value={formData.decimalPlaces}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                decimalPlaces: +e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <Label>Currency in multiples of</Label>
        <Input
          type="number"
          placeholder="Currency in multiples of"
          value={formData.currencyMultiples}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              currencyMultiples: e.target.value,
            }))
          }
        />
      </div>
    </div>
  )
}

export default SavingsProductCurrencyStep
