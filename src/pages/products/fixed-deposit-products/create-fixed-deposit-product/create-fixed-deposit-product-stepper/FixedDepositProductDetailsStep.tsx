/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FixedDepositStepProps } from '../fixed-deposit-product-form'

const FixedDepositProductDetailsStep = ({
  formData,
  onChange,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-name">
            {t('createFixedDepositProduct.fields.productName')}*
          </Label>
          <Input
            id="fd-name"
            maxLength={100}
            value={formData.name}
            onChange={e => onChange({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-short-name">
            {t('createFixedDepositProduct.fields.shortName')}*
          </Label>
          <Input
            id="fd-short-name"
            maxLength={4}
            value={formData.shortName}
            onChange={e => onChange({ ...formData, shortName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fd-description">
          {t('createFixedDepositProduct.fields.description')}*
        </Label>
        <Textarea
          id="fd-description"
          maxLength={500}
          className="min-h-[100px]"
          value={formData.description}
          onChange={e => onChange({ ...formData, description: e.target.value })}
        />
      </div>
    </div>
  )
}

export default FixedDepositProductDetailsStep
