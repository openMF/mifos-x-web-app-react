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
import AppSelect from '@/components/custom/select/AppSelect'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  FormUpdater,
  ShareProductForm,
  ShareProductTemplate,
} from '../share-product-form'

interface ShareProductChargesStepProps {
  form: ShareProductForm
  update: FormUpdater
  template?: ShareProductTemplate
}

const ShareProductChargesStep = ({
  form,
  update,
  template,
}: ShareProductChargesStepProps) => {
  const { t } = useTranslation('products')
  const [selectedChargeId, setSelectedChargeId] = useState('')

  // Fineract rejects charges whose currency differs from the product's
  const charges = (template?.chargeOptions ?? []).filter(
    charge =>
      charge.id !== undefined && charge.currency?.code === form.currencyCode
  )
  const availableOptions = charges
    .filter(charge => !form.chargeIds.includes(charge.id!))
    .map(charge => ({ id: charge.id!.toString(), name: charge.name ?? '' }))
  const addedCharges = charges.filter(charge =>
    form.chargeIds.includes(charge.id!)
  )

  // The selection may belong to a currency the user has since changed
  const canAdd = availableOptions.some(option => option.id === selectedChargeId)

  const handleAdd = () => {
    if (!canAdd) return
    update({ chargeIds: [...form.chargeIds, Number(selectedChargeId)] })
    setSelectedChargeId('')
  }

  const handleRemove = (id: number) =>
    update({ chargeIds: form.chargeIds.filter(chargeId => chargeId !== id) })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <AppSelect
          selectLabel={t('createShareProduct.charges.charge')}
          selectPlaceholder={t('createShareProduct.select')}
          selectValue={selectedChargeId}
          selectOnChange={setSelectedChargeId}
          selectOptions={availableOptions}
          selectEmptyMessage={t('createShareProduct.charges.none')}
          selectClassname="flex-1 space-y-2"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          {t('createShareProduct.charges.add')}
        </Button>
      </div>

      {addedCharges.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('createShareProduct.charges.name')}</TableHead>
              <TableHead>{t('createShareProduct.charges.type')}</TableHead>
              <TableHead>{t('createShareProduct.charges.amount')}</TableHead>
              <TableHead>
                {t('createShareProduct.charges.collectedOn')}
              </TableHead>
              <TableHead className="text-right">
                {t('createShareProduct.charges.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addedCharges.map(charge => (
              <TableRow key={charge.id}>
                <TableCell>{charge.name}</TableCell>
                <TableCell>{charge.chargeCalculationType?.value}</TableCell>
                <TableCell>{charge.amount}</TableCell>
                <TableCell>{charge.chargeTimeType?.value}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('createShareProduct.charges.remove')}
                    onClick={() => handleRemove(charge.id!)}
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

export default ShareProductChargesStep
