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
import {
  getShareCapital,
  toOptionalNumber,
  type FormUpdater,
  type ShareProductForm,
} from '../share-product-form'

interface ShareProductTermsStepProps {
  form: ShareProductForm
  update: FormUpdater
}

const ShareProductTermsStep = ({
  form,
  update,
}: ShareProductTermsStepProps) => {
  const { t } = useTranslation('products')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-total-shares">
            {t('createShareProduct.terms.totalShares')}
          </Label>
          <Input
            id="sp-total-shares"
            type="number"
            min={1}
            step={1}
            value={form.totalShares ?? ''}
            onChange={e =>
              update({ totalShares: toOptionalNumber(e.target.value) })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-shares-issued">
            {t('createShareProduct.terms.sharesIssued')}
          </Label>
          <Input
            id="sp-shares-issued"
            type="number"
            min={1}
            step={1}
            value={form.sharesIssued ?? ''}
            onChange={e =>
              update({ sharesIssued: toOptionalNumber(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-unit-price">
            {t('createShareProduct.terms.unitPrice')}
          </Label>
          <Input
            id="sp-unit-price"
            type="number"
            min={0}
            step="any"
            value={form.unitPrice ?? ''}
            onChange={e =>
              update({ unitPrice: toOptionalNumber(e.target.value) })
            }
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="sp-share-capital">
            {t('createShareProduct.terms.shareCapital')}
          </Label>
          <Input
            id="sp-share-capital"
            readOnly
            value={getShareCapital(form) ?? ''}
          />
          <p className="text-xs text-muted-foreground">
            {t('createShareProduct.terms.shareCapitalHint')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareProductTermsStep
