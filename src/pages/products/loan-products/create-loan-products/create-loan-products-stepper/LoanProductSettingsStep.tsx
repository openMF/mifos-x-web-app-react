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
import { Separator } from '@/components/ui/separator'

const LoanProductSettingsStep = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Product Name*</Label>
          <Input />
        </div>

        <div className="flex-1 space-y-2">
          <Label>External Id</Label>
          <Input />
        </div>

        <div className="flex-1 space-y-2">
          <Label>External Id</Label>
          <Input />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex">
          <Checkbox className="mr-4" />
          <Label className="text-sm">Is Equal Amortization?</Label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex">
          <Checkbox className="mr-4" />
          <Label className="text-sm">
            Calculate interest for exact days in partial period
          </Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-md font-semibold">Loan Schedule</Label>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Loan Schedule Type*</Label>
            <Input />
          </div>

          <div className="flex-1 space-y-2">
            <Label>Repayment Strategy</Label>
            <Input />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Label className="text-md font-semibold">Loan Tranche Details</Label>
        <div className="flex">
          <Checkbox className="mr-4" />
          <Label className="text-sm">Enable Multiple Disbursals</Label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Label className="text-md font-semibold">Down Payment</Label>
        <div className="flex">
          <Checkbox className="mr-4" />
          <Label className="text-sm">Enable Down Paymen</Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-md font-semibold">Moratorium </Label>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Grace on principal payment</Label>
            <Input type="number" />
          </div>

          <div className="flex-1 space-y-2">
            <Label>Grace on interest payment</Label>
            <Input type="number" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex-1 space-y-2 w-[50%]">
          <Label>Delinquency Bucket</Label>
          <Input />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-md font-semibold">Moratorium </Label>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Interest free period</Label>
            <Input type="number" />
          </div>

          <div className="flex-1 space-y-2">
            <Label>Arrears tolerance</Label>
            <Input type="number" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Days in year*</Label>
            <Input type="number" />
          </div>

          <div className="flex-1 space-y-2">
            <Label>Days in month*</Label>
            <Input type="number" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex">
            <Checkbox className="mr-4" />
            <Label className="text-sm">
              Allow fixing of the installment amount
            </Label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="md:flex-row gap-6">
            <div className="mt-2 flex-1 space-y-2">
              <Label className="font-semibold">
                Number of days a loan may be overdue before moving into arrears
              </Label>
              <Input type="number" />
            </div>

            <div className="mt-2 flex-1 space-y-2">
              <Label className="font-semibold">
                Maximum number of days a loan may be overdue before becoming a
                NPA (non performing asset)
              </Label>
              <Input type="number" />
            </div>

            <div className="mt-2 space-y-2">
              <Checkbox className="mr-4" />
              <Label className="text-sm">
                Account moves out of NPA only after all arrears have been
                cleared
              </Label>
              <Input type="number" />
            </div>

            <div className="mt-5 flex gap-5">
              <div className="flex">
                <Checkbox className="mr-4" />
                <Label className="text-sm">
                  Are Variable Installments allowed?
                </Label>
              </div>

              <div className="flex">
                <Checkbox className="mr-4" />
                <Label className="text-sm">
                  Allowed to be used for providing Top Up Loans
                </Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <Label className="text-md font-semibold">
            Interest Recalculation
          </Label>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Recalculate Interest</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <Label className="text-md font-semibold">
            Guarantee Requirements
          </Label>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Place Guarantee Funds On-Hold</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <Label className="text-md font-semibold">Event Settings</Label>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">
                Use the Global Configurations values to the Repayment Event
                (notifications)
              </Label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label>Due days for repayment event</Label>
              <Input type="number" />
            </div>

            <div className="flex-1 space-y-2">
              <Label>OverDue days for repayment event</Label>
              <Input type="number" />
            </div>
          </div>
        </div>
        <Separator />

        <div className="flex flex-col gap-4">
          <Label className="text-md font-semibold">
            Configurable Terms and Settings
          </Label>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">
                Allow overriding select terms and settings in loan accounts
              </Label>
            </div>

            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Amortization</Label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm"> AmortizationInterest method</Label>
            </div>

            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Repayment strategy</Label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Interest calculation period</Label>
            </div>

            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Arrears tolerance</Label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Repaid every</Label>
            </div>

            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">Moratorium</Label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex">
              <Checkbox className="mr-4" />
              <Label className="text-sm">
                Number of days a loan may be overdue before moving into arrears
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoanProductSettingsStep
