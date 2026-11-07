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
import { Textarea } from '@/components/ui/textarea'
import type { PostLoanProductsRequest } from '@/fineract-api'

interface LoanProductDetailsStepProps {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
}

const LoanProductDetailsStep = ({
  formData,
  onChange,
}: LoanProductDetailsStepProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Loan Product details */}
      <div className="space-y-2">
        <Label>Loan Product Name*</Label>
        <Input
          maxLength={100}
          placeholder="Loan Product Name"
          value={formData.name ?? ''}
          onChange={e => {
            onChange({ ...formData, name: e.target.value })
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Short Name*</Label>
          <Input
            maxLength={4}
            placeholder="Short Name"
            value={formData.shortName ?? ''}
            onChange={e => {
              onChange({ ...formData, shortName: e.target.value })
            }}
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
        <Label>Description</Label>
        <Textarea
          maxLength={500}
          placeholder="Description"
          className="min-h-[100px]"
          value={formData.description ?? ''}
          onChange={e => onChange({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.startDate ?? ''}
            onChange={e => onChange({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Close Date</Label>
          <Input
            type="date"
            value={formData.closeDate ?? ''}
            onChange={e => onChange({ ...formData, closeDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-2">
          <Label>Fund</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex items-center gap-3 pb-1">
          <Checkbox
            id="includeInBorrowerCycle"
            checked={formData.includeInBorrowerCycle ?? false}
            onCheckedChange={v =>
              onChange({ ...formData, includeInBorrowerCycle: !!v })
            }
          />
          <Label
            htmlFor="includeInBorrowerCycle"
            className="cursor-pointer font-normal"
          >
            Include in Customer Loan Counter
          </Label>
        </div>
      </div>
    </div>
  )
}

export default LoanProductDetailsStep
