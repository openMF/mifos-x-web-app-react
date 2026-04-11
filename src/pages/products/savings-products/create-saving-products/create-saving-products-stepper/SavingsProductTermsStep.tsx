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

type Option = { id: string; name: string }

interface SavingsProductTermsFormData {
  nominalAnnualInterestRate: number
  interestCompoundingPeriod: string
  interestPostingPeriod: string
  interestCalculationType: string
  interestCalculationDaysInYearType: string
  [key: string]: unknown
}

const SavingsProductTermsStep = ({
  formData,
  setFormData,
  compoundingPeriodOptions,
  postingPeriodOptions,
  interestCalculationOptions,
  daysInYearOptions,
}: {
  formData: SavingsProductTermsFormData
  setFormData: (
    updater: (prev: SavingsProductTermsFormData) => SavingsProductTermsFormData
  ) => void
  compoundingPeriodOptions: Option[]
  postingPeriodOptions: Option[]
  interestCalculationOptions: Option[]
  daysInYearOptions: Option[]
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/*Nominal Interest Rate */}
      <div className="flex flex-col space-y-2">
        <Label>Nominal Annual Interest*</Label>
        <Input
          type="number"
          placeholder="e.g., 5.0"
          value={formData.nominalAnnualInterestRate}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              nominalAnnualInterestRate: +e.target.value,
            }))
          }
        />
      </div>

      {/*Compounding and Posting Periods */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Interest Compounding Period*"
            selectPlaceholder="Select period"
            selectValue={formData.interestCompoundingPeriod}
            selectOnChange={val =>
              setFormData(prev => ({
                ...prev,
                interestCompoundingPeriod: val,
              }))
            }
            selectOptions={compoundingPeriodOptions}
          />
        </div>
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Interest Posting Period*"
            selectPlaceholder="Select period"
            selectValue={formData.interestPostingPeriod}
            selectOnChange={val =>
              setFormData(prev => ({
                ...prev,
                interestPostingPeriod: val,
              }))
            }
            selectOptions={postingPeriodOptions}
          />
        </div>
      </div>

      {/*Interest Calculation + Days in Year */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Interest Calculated using*"
            selectPlaceholder="Select type"
            selectValue={formData.interestCalculationType}
            selectOnChange={val =>
              setFormData(prev => ({
                ...prev,
                interestCalculationType: val,
              }))
            }
            selectOptions={interestCalculationOptions}
          />
        </div>
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Days in Year*"
            selectPlaceholder="Select days"
            selectValue={formData.interestCalculationDaysInYearType}
            selectOnChange={val =>
              setFormData(prev => ({
                ...prev,
                interestCalculationDaysInYearType: val,
              }))
            }
            selectOptions={daysInYearOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default SavingsProductTermsStep
