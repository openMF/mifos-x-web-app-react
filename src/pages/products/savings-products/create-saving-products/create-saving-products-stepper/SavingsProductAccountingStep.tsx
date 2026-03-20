/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface SavingsProductAccountingFormData {
  accountingRule: string
  [key: string]: unknown
}

const SavingsProductAccountingStep = ({
  formData,
  setFormData,
}: {
  formData: SavingsProductAccountingFormData
  setFormData: (
    updater: (
      prev: SavingsProductAccountingFormData
    ) => SavingsProductAccountingFormData
  ) => void
}) => {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={formData.accountingRule}
        onValueChange={val =>
          setFormData(prev => ({
            ...prev,
            accountingRule: val,
          }))
        }
        className="flex gap-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none">None</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash">Cash</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="accrual" id="accrual" />
          <Label htmlFor="accrual">Accrual (periodic)</Label>
        </div>
      </RadioGroup>
    </div>
  )
}

export default SavingsProductAccountingStep
