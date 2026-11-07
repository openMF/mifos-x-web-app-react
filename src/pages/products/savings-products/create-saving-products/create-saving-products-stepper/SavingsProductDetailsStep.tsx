/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PostSavingsProductsRequest } from '@/fineract-api'

interface SavingsProductDetailsStepProps {
  formData: PostSavingsProductsRequest
  onChange: (data: PostSavingsProductsRequest) => void
}

const SavingsProductDetailsStep = ({
  formData,
  onChange,
}: SavingsProductDetailsStepProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Saving Product details step */}
      <div className="space-y-2">
        <Label>Product Name*</Label>
        <Input
          maxLength={100}
          placeholder="Product Name"
          value={formData.name ?? ''}
          onChange={e => onChange({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Short Name*</Label>
          <Input
            maxLength={4}
            placeholder="Short Name"
            value={formData.shortName ?? ''}
            onChange={e => onChange({ ...formData, shortName: e.target.value })}
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
    </div>
  )
}

export default SavingsProductDetailsStep
