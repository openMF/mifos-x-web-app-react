/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type {
  PostSavingsProductsRequest,
  GetSavingsProductsTemplateResponse,
} from '@/fineract-api'

interface SavingsProductAccountingStepProps {
  formData: PostSavingsProductsRequest
  onChange: (data: PostSavingsProductsRequest) => void
  template: GetSavingsProductsTemplateResponse | undefined
}

const accountingRules = [
  { value: '1', label: 'None' },
  { value: '2', label: 'Cash' },
  { value: '3', label: 'Accrual (Periodic)' },
  { value: '4', label: 'Accrual (Upfront)' },
]

const SavingsProductAccountingStep = ({
  formData,
  onChange,
}: SavingsProductAccountingStepProps) => {
  return (
    <div className="space-y-6">
      <RadioGroup
        value={formData.accountingRule?.toString() ?? '1'}
        onValueChange={val => onChange({ ...formData, accountingRule: +val })}
        className="flex gap-6"
      >
        {accountingRules.map(rule => (
          <div key={rule.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={rule.value}
              id={`accounting-${rule.value}`}
            />
            <Label htmlFor={`accounting-${rule.value}`}>{rule.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default SavingsProductAccountingStep
