/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface SavingsProductSettingsFormData {
  minOpeningBalance: number
  balanceRequiredForInterestCalculation: number
  lockinPeriodFrequency: number
  minBalance: number
  withdrawalFeeForTransfers: boolean
  enforceMinRequiredBalance: boolean
  withHoldTax: boolean
  allowOverdraft: boolean
  trackDormancy: boolean
  [key: string]: unknown
}

const SavingsProductSettingsStep = ({
  formData,
  setFormData,
}: {
  formData: SavingsProductSettingsFormData
  setFormData: (
    updater: (
      prev: SavingsProductSettingsFormData
    ) => SavingsProductSettingsFormData
  ) => void
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Min Opening Balance & Interest Calc Balance */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Minimum Opening Balance</Label>
          <Input
            type="number"
            placeholder="e.g., 500"
            value={formData.minOpeningBalance}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                minOpeningBalance: +e.target.value,
              }))
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Balance Required for Interest Calculation</Label>
          <Input
            type="number"
            placeholder="e.g., 1000"
            value={formData.balanceRequiredForInterestCalculation}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                balanceRequiredForInterestCalculation: +e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Row 2: Lock-in & Min Balance */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Lock-in Period</Label>
          <Input
            type="number"
            placeholder="e.g., 12 (months)"
            value={formData.lockinPeriodFrequency}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                lockinPeriodFrequency: +e.target.value,
              }))
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Minimum Balance</Label>
          <Input
            type="number"
            placeholder="e.g., 200"
            value={formData.minBalance}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                minBalance: +e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Row 3: Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="withdrawalFee"
            checked={formData.withdrawalFeeForTransfers}
            onCheckedChange={val =>
              setFormData(prev => ({
                ...prev,
                withdrawalFeeForTransfers: val as boolean,
              }))
            }
          />
          <Label htmlFor="withdrawalFee">
            Apply Withdrawal Fee for Transfers
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enforceMinBalance"
            checked={formData.enforceMinRequiredBalance}
            onCheckedChange={val =>
              setFormData(prev => ({
                ...prev,
                enforceMinRequiredBalance: val as boolean,
              }))
            }
          />
          <Label htmlFor="enforceMinBalance">Enforce Minimum Balance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="withholdTax"
            checked={formData.withHoldTax}
            onCheckedChange={val =>
              setFormData(prev => ({
                ...prev,
                withHoldTax: val as boolean,
              }))
            }
          />
          <Label htmlFor="withholdTax">Is Withhold Tax Applicable</Label>
        </div>
      </div>

      {/* Overdraft */}
      <div className="pt-4 border-t">
        <h2 className="font-semibold">Overdraft</h2>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="overdraftAllowed"
            checked={formData.allowOverdraft}
            onCheckedChange={val =>
              setFormData(prev => ({
                ...prev,
                allowOverdraft: val as boolean,
              }))
            }
          />
          <Label htmlFor="overdraftAllowed">Is Overdraft Allowed</Label>
        </div>
      </div>

      {/* Dormancy Tracking */}
      <div className="pt-4 border-t">
        <h2 className="font-semibold">Dormancy Tracking</h2>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="dormancyTracking"
            checked={formData.trackDormancy}
            onCheckedChange={val =>
              setFormData(prev => ({
                ...prev,
                trackDormancy: val as boolean,
              }))
            }
          />
          <Label htmlFor="dormancyTracking">Enable Dormancy Tracking</Label>
        </div>
      </div>
    </div>
  )
}

export default SavingsProductSettingsStep
