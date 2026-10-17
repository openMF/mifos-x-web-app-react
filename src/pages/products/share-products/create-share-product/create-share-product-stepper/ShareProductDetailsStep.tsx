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
import type { FormUpdater, ShareProductForm } from '../share-product-form'

interface ShareProductDetailsStepProps {
  form: ShareProductForm
  update: FormUpdater
}

const ShareProductDetailsStep = ({
  form,
  update,
}: ShareProductDetailsStepProps) => {
  const { t } = useTranslation('products')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-name">
            {t('createShareProduct.details.name')}
          </Label>
          <Input
            id="sp-name"
            maxLength={200}
            value={form.name}
            onChange={e => update({ name: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-short-name">
            {t('createShareProduct.details.shortName')}
          </Label>
          <Input
            id="sp-short-name"
            maxLength={4}
            value={form.shortName}
            onChange={e => update({ shortName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sp-description">
          {t('createShareProduct.details.description')}
        </Label>
        <Textarea
          id="sp-description"
          maxLength={500}
          className="min-h-[100px]"
          value={form.description}
          onChange={e => update({ description: e.target.value })}
        />
      </div>
    </div>
  )
}

export default ShareProductDetailsStep
