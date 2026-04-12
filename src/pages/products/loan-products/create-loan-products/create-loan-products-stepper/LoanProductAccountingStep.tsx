/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const LoanProductAccountingStep = () => {
  return (
    <div className="flex flex-col gap-6">
      <RadioGroup className="flex flex-col md:flex-row gap-6">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none" className="text-sm">
            None
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash" className="text-sm">
            Cash
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="accrual_periodic" id="accrual_periodic" />
          <Label htmlFor="accrual_periodic" className="text-sm">
            Accrual (periodic)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="accrual_upfront" id="accrual_upfront" />
          <Label htmlFor="accrual_upfront" className="text-sm">
            Accrual (upfront)
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

export default LoanProductAccountingStep
