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

//Static page since OpenAPI spec is missing for these fields

const SavingsProductSettingsStep = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Minimum Opening Balance</Label>
          <Input type="number" min={0} step={0.01} placeholder="e.g., 500" />
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">Lock-in Period</h3>
        <div className="flex items-center gap-3">
          <Checkbox id="enableLockinPeriod" />
          <Label
            htmlFor="enableLockinPeriod"
            className="cursor-pointer font-normal"
          >
            Enable Lock-in Period
          </Label>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex items-center gap-3 flex-1 pt-2">
            <Checkbox id="withdrawalFee" />
            <Label
              htmlFor="withdrawalFee"
              className="cursor-pointer font-normal"
            >
              Apply Withdrawal Fee for Transfers
            </Label>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Balance Required for Interest Calculation</Label>
            <Input type="number" min={0} step={0.01} placeholder="e.g., 1000" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex items-center gap-3 flex-1 pt-2">
            <Checkbox id="enforceMinBalance" />
            <Label
              htmlFor="enforceMinBalance"
              className="cursor-pointer font-normal"
            >
              Enforce Minimum Balance
            </Label>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Minimum Balance</Label>
            <Input type="number" min={0} step={0.01} placeholder="e.g., 200" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox id="withHoldTax" />
          <Label htmlFor="withHoldTax" className="cursor-pointer font-normal">
            Is Withhold Tax Applicable
          </Label>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">Overdraft</h3>
        <div className="flex items-center gap-3">
          <Checkbox id="allowOverdraft" />
          <Label
            htmlFor="allowOverdraft"
            className="cursor-pointer font-normal"
          >
            Is Overdraft Allowed
          </Label>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">Dormancy Tracking</h3>
        <div className="flex items-center gap-3">
          <Checkbox id="isDormancyTrackingActive" />
          <Label
            htmlFor="isDormancyTrackingActive"
            className="cursor-pointer font-normal"
          >
            Enable Dormancy Tracking
          </Label>
        </div>
      </div>
    </div>
  )
}

export default SavingsProductSettingsStep
