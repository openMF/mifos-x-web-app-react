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
import type {
  PostSavingsProductsRequest,
  GetSavingsProductsTemplateResponse,
} from '@/fineract-api'

interface SavingsProductTermsStepProps {
  formData: PostSavingsProductsRequest
  onChange: (data: PostSavingsProductsRequest) => void
  template: GetSavingsProductsTemplateResponse | undefined
}

const SavingsProductTermsStep = ({
  formData,
  onChange,
  template,
}: SavingsProductTermsStepProps) => {
  const compoundingPeriodOptions = Array.from(
    template?.interestCompoundingPeriodTypeOptions ?? []
  ).map(option => ({ id: option.id!.toString(), name: option.value! }))

  const postingPeriodOptions = Array.from(
    template?.interestPostingPeriodTypeOptions ?? []
  ).map(option => ({ id: option.id!.toString(), name: option.value! }))

  const interestCalculationOptions = Array.from(
    template?.interestCalculationTypeOptions ?? []
  ).map(option => ({ id: option.id!.toString(), name: option.value! }))

  const daysInYearOptions = Array.from(
    template?.interestCalculationDaysInYearTypeOptions ?? []
  ).map(option => ({ id: option.id!.toString(), name: option.value! }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Nominal Annual Interest*</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g., 5.0"
            value={formData.nominalAnnualInterestRate ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                nominalAnnualInterestRate:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
        <div className="flex-1 hide-lt-md" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel="Interest Compounding Period*"
          selectPlaceholder="Select period"
          selectValue={formData.interestCompoundingPeriodType?.toString() ?? ''}
          selectOnChange={val =>
            onChange({ ...formData, interestCompoundingPeriodType: +val })
          }
          selectOptions={compoundingPeriodOptions}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel="Interest Posting Period*"
          selectPlaceholder="Select period"
          selectValue={formData.interestPostingPeriodType?.toString() ?? ''}
          selectOnChange={val =>
            onChange({ ...formData, interestPostingPeriodType: +val })
          }
          selectOptions={postingPeriodOptions}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel="Interest Calculated using*"
          selectPlaceholder="Select type"
          selectValue={formData.interestCalculationType?.toString() ?? ''}
          selectOnChange={val =>
            onChange({ ...formData, interestCalculationType: +val })
          }
          selectOptions={interestCalculationOptions}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel="Days in Year*"
          selectPlaceholder="Select days"
          selectValue={
            formData.interestCalculationDaysInYearType?.toString() ?? ''
          }
          selectOnChange={val =>
            onChange({ ...formData, interestCalculationDaysInYearType: +val })
          }
          selectOptions={daysInYearOptions}
          selectClassname="flex-1 space-y-2"
        />
      </div>
    </div>
  )
}

export default SavingsProductTermsStep
