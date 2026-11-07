/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import AppSelect from '@/components/custom/select/AppSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  GetLoanProductsTemplateResponse,
  PostLoanProductsRequest,
} from '@/fineract-api'

interface LoanProductCurrencyStepProp {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
  template: GetLoanProductsTemplateResponse
}

const LoanProductCurrencyStep = ({
  formData,
  onChange,
  template,
}: LoanProductCurrencyStepProp) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Loan products currency */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Currency*"
            selectPlaceholder="Select Currency"
            selectValue={formData.currencyCode ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, currencyCode: value })
            }
            selectOptions={Array.from(template.currencyOptions ?? [])
              .filter(
                (
                  option
                ): option is typeof option & {
                  code: string
                  name: string
                } => option.code != null && option.name != null
              )
              .map(option => ({
                id: option.code,
                name: option.name,
              }))}
            selectClassname="flex-1 space-y-2"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Decimal Places*</Label>
          <Input
            type="number"
            min={0}
            placeholder="Decimal Places"
            value={formData.digitsAfterDecimal ?? ''}
            onChange={e => {
              const value = e.target.value

              onChange({
                ...formData,
                digitsAfterDecimal: value === '' ? undefined : Number(value),
              })
            }}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Currency in multiples of*</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={formData.inMultiplesOf ?? ''}
            onChange={e => {
              const value = e.target.value

              onChange({
                ...formData,
                inMultiplesOf: value === '' ? undefined : Number(value),
              })
            }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Installment in multiples of</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={formData.installmentAmountInMultiplesOf ?? ''}
            onChange={e => {
              const value = e.target.value

              onChange({
                ...formData,
                installmentAmountInMultiplesOf:
                  value === '' ? undefined : Number(value),
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default LoanProductCurrencyStep
