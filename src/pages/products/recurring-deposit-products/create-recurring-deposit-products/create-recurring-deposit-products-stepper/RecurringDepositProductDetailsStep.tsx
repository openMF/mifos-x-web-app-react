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
import type {
  FormUpdater,
  RecurringDepositProductForm,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductDetailsStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
}

const RecurringDepositProductDetailsStep = ({
  form,
  update,
}: RecurringDepositProductDetailsStepProps) => {
  const { t } = useTranslation('products')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-name">
            {t('createRecurringDepositProduct.details.name')}
          </Label>
          <Input
            id="rd-name"
            aria-required="true"
            maxLength={100}
            value={form.name}
            onChange={e => update({ name: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-short-name">
            {t('createRecurringDepositProduct.details.shortName')}
          </Label>
          <Input
            id="rd-short-name"
            aria-required="true"
            maxLength={4}
            value={form.shortName}
            onChange={e => update({ shortName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rd-description">
          {t('createRecurringDepositProduct.details.description')}
        </Label>
        <Textarea
          id="rd-description"
          aria-required="true"
          maxLength={500}
          className="min-h-[100px]"
          value={form.description}
          onChange={e => update({ description: e.target.value })}
        />
      </div>
    </div>
  )
}

export default RecurringDepositProductDetailsStep
