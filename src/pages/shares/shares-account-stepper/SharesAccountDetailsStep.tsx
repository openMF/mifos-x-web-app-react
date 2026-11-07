/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import AppSelect from '@/components/custom/select/AppSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  AccountRequest,
  GetAccountsTypeTemplateResponse,
} from '@/fineract-api'

interface SharesAccountDetailsStepProps {
  formData: AccountRequest
  onChange: (data: AccountRequest) => void
  template: GetAccountsTypeTemplateResponse | undefined
}

const SharesAccountDetailsStep = ({
  formData,
  onChange,
  template,
}: SharesAccountDetailsStepProps) => {
  const productOptions = Array.from(template?.productOptions ?? []).map(p => ({
    id: p.id!.toString(),
    name: p.name!,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <AppSelect
          selectLabel="Product Name*"
          selectPlaceholder="Select Product"
          selectValue={formData.productId?.toString() ?? ''}
          selectOnChange={val => onChange({ ...formData, productId: +val })}
          selectOptions={productOptions}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Submitted On*</Label>
          <Input
            type="date"
            value={formData.submittedDate ?? ''}
            onChange={e =>
              onChange({ ...formData, submittedDate: e.target.value })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>External Id</Label>
          <Input
            maxLength={100}
            placeholder="External Id"
            value={formData.externalId ?? ''}
            onChange={e =>
              onChange({ ...formData, externalId: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  )
}

export default SharesAccountDetailsStep
