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
  GetSavingsAccountsTemplateResponse,
  PostSavingsAccountsRequest,
} from '@/fineract-api'

interface SavingsAccountDetailsStepProps {
  formData: PostSavingsAccountsRequest
  onChange: (data: PostSavingsAccountsRequest) => void
  template: GetSavingsAccountsTemplateResponse | undefined
}

const SavingsAccountDetailsStep = ({
  formData,
  onChange,
  template,
}: SavingsAccountDetailsStepProps) => {
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

      {formData.productId && (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label>Submitted On*</Label>
              <Input
                type="date"
                value={formData.submittedOnDate ?? ''}
                onChange={e =>
                  onChange({ ...formData, submittedOnDate: e.target.value })
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

          <div className="space-y-2">
            <Label>Field Officer</Label>
            <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
              Missing in OpenAPI
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SavingsAccountDetailsStep
