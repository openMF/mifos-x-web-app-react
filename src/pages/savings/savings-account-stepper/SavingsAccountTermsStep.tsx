/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

const SavingsAccountTermsStep = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Currency</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Decimal Places</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Nominal Annual Interest*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Interest Compounding Period*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Interest Posting Period*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Interest Calculated using*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Days in Year*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Minimum Opening Balance</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="withdrawalFeeForTransfers" disabled />
        <Label
          htmlFor="withdrawalFeeForTransfers"
          className="font-normal text-muted-foreground"
        >
          Apply Withdrawal Fee for Transfers
        </Label>
      </div>

      <h4 className="text-sm font-semibold">Lock-in Period</h4>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Frequency</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <Separator />

      <h3 className="text-base font-semibold">Overdraft</h3>

      <div className="flex items-center gap-3">
        <Checkbox id="allowOverdraft" disabled />
        <Label
          htmlFor="allowOverdraft"
          className="font-normal text-muted-foreground"
        >
          Is Overdraft Allowed
        </Label>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Minimum Overdraft Required for Interest Calculation</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Nominal Annual Interest for Overdraft</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Maximum Overdraft Amount Limit</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <Checkbox id="enforceMinRequiredBalance" disabled />
        <Label
          htmlFor="enforceMinRequiredBalance"
          className="font-normal text-muted-foreground"
        >
          Enforce Minimum Balance
        </Label>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Minimum Balance</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Balance Required for Interest Calculation</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavingsAccountTermsStep
