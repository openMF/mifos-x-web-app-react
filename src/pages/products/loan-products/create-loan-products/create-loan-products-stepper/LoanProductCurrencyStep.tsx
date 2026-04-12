/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LoanProductCurrencyStep = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Currency*</Label>
          <Input />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Decimal Places*</Label>
          <Input type="number" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Currency in multiples of</Label>
          <Input type="number" />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Installment in multiples of</Label>
          <Input type="number" />
        </div>
      </div>
    </div>
  )
}

export default LoanProductCurrencyStep
