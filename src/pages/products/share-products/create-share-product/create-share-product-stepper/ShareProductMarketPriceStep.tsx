/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  toOptionalNumber,
  type FormUpdater,
  type ShareProductForm,
} from '../share-product-form'

interface ShareProductMarketPriceStepProps {
  form: ShareProductForm
  update: FormUpdater
}

const ShareProductMarketPriceStep = ({
  form,
  update,
}: ShareProductMarketPriceStepProps) => {
  const { t } = useTranslation('products')
  const [fromDate, setFromDate] = useState('')
  const [shareValue, setShareValue] = useState<number>()

  const canAdd = fromDate !== '' && shareValue !== undefined && shareValue > 0

  const handleAdd = () => {
    if (!canAdd) return
    const periods = [...form.marketPricePeriods, { fromDate, shareValue }]
    periods.sort((a, b) => a.fromDate.localeCompare(b.fromDate))
    update({ marketPricePeriods: periods })
    setFromDate('')
    setShareValue(undefined)
  }

  const handleRemove = (index: number) =>
    update({
      marketPricePeriods: form.marketPricePeriods.filter((_, i) => i !== index),
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 space-y-2 w-full">
          <Label htmlFor="sp-market-from-date">
            {t('createShareProduct.marketPrice.fromDate')}
          </Label>
          <Input
            id="sp-market-from-date"
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2 w-full">
          <Label htmlFor="sp-market-share-value">
            {t('createShareProduct.marketPrice.shareValue')}
          </Label>
          <Input
            id="sp-market-share-value"
            type="number"
            min={0}
            step="any"
            value={shareValue ?? ''}
            onChange={e => setShareValue(toOptionalNumber(e.target.value))}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          {t('createShareProduct.marketPrice.add')}
        </Button>
      </div>

      {form.marketPricePeriods.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('createShareProduct.marketPrice.none')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('createShareProduct.marketPrice.fromDate')}
              </TableHead>
              <TableHead>
                {t('createShareProduct.marketPrice.shareValue')}
              </TableHead>
              <TableHead className="text-right">
                {t('createShareProduct.marketPrice.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.marketPricePeriods.map((period, index) => (
              <TableRow key={`${period.fromDate}-${index}`}>
                <TableCell>{period.fromDate}</TableCell>
                <TableCell>{period.shareValue}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('createShareProduct.marketPrice.remove')}
                    onClick={() => handleRemove(index)}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default ShareProductMarketPriceStep
