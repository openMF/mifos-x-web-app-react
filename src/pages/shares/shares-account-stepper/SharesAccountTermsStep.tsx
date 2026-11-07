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
import AppSelect from '@/components/custom/select/AppSelect'
import type { AccountRequest, GetClientsSavingsAccounts } from '@/fineract-api'

interface SharesAccountTermsStepProps {
  formData: AccountRequest
  onChange: (data: AccountRequest) => void
  savingsAccounts: GetClientsSavingsAccounts[]
}

const SharesAccountTermsStep = ({
  formData,
  onChange,
  savingsAccounts,
}: SharesAccountTermsStepProps) => {
  const savingsAccountOptions = savingsAccounts.map(a => ({
    id: a.id!.toString(),
    name: `${a.accountNo} - ${a.productName}`,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Currency</Label>
          <Input
            placeholder="Currency Code"
            value={formData.currencyCode ?? ''}
            onChange={e =>
              onChange({ ...formData, currencyCode: e.target.value })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Current Price</Label>
          <Input
            type="number"
            min={0}
            value={formData.unitPrice ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                unitPrice: e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Total Number of Shares*</Label>
          <Input
            type="number"
            min={0}
            value={formData.requestedShares ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                requestedShares:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <AppSelect
            selectLabel="Default Savings Account*"
            selectPlaceholder="Select Savings Account"
            selectValue={formData.savingsAccountId?.toString() ?? ''}
            selectOnChange={val =>
              onChange({ ...formData, savingsAccountId: +val })
            }
            selectOptions={savingsAccountOptions}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Application Date*</Label>
          <Input
            type="date"
            value={formData.applicationDate ?? ''}
            onChange={e =>
              onChange({ ...formData, applicationDate: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="allowDividendCalculationForInactiveClients"
          checked={
            formData.allowDividendCalculationForInactiveClients === 'true'
          }
          onCheckedChange={v =>
            onChange({
              ...formData,
              allowDividendCalculationForInactiveClients: v ? 'true' : 'false',
            })
          }
        />
        <Label
          htmlFor="allowDividendCalculationForInactiveClients"
          className="cursor-pointer font-normal"
        >
          Allow dividends for inactive clients
        </Label>
      </div>

      <h4 className="text-sm font-semibold">Minimum Active Period</h4>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Frequency</Label>
          <Input
            type="number"
            min={0}
            value={formData.minimumActivePeriod ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                minimumActivePeriod:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <Input
            placeholder="Frequency Type"
            value={formData.minimumActivePeriodFrequencyType ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                minimumActivePeriodFrequencyType: e.target.value,
              })
            }
          />
        </div>
      </div>

      <h4 className="text-sm font-semibold">Lock-in Period</h4>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Frequency</Label>
          <Input
            type="number"
            min={0}
            value={formData.lockinPeriodFrequency ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                lockinPeriodFrequency:
                  e.target.value === '' ? undefined : +e.target.value,
              })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <Input
            placeholder="Frequency Type"
            value={formData.lockinPeriodFrequencyType ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                lockinPeriodFrequencyType: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

export default SharesAccountTermsStep
