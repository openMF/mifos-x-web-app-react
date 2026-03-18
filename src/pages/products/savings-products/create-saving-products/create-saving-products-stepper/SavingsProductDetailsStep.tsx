/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SavingsProductDetailsFormData {
  name: string
  shortName: string
  description: string
  [key: string]: unknown
}

const SavingsProductDetailsStep = ({
  formData,
  setFormData,
}: {
  formData: SavingsProductDetailsFormData
  setFormData: (
    updater: (
      prev: SavingsProductDetailsFormData
    ) => SavingsProductDetailsFormData
  ) => void
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Product Name & Short Name */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="productName">Product Name*</Label>
          <Input
            id="productName"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="shortName">Short Name*</Label>
          <Input
            id="shortName"
            value={formData.shortName}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                shortName: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Row 2: Description */}
      <div className="flex-1 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              description: e.target.value,
            }))
          }
        />
      </div>
    </div>
  )
}

export default SavingsProductDetailsStep
