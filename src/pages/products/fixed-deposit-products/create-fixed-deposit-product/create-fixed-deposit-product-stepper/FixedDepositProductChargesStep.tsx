/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppSelect from '@/components/custom/select/AppSelect'
import type { FixedDepositStepProps } from '../fixed-deposit-product-form'

const FixedDepositProductChargesStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const [selectedChargeId, setSelectedChargeId] = useState('')

  // A charge can only be added to a product in the same currency
  const charges = (template?.chargeOptions ?? []).filter(
    charge =>
      !charge.currency?.code || charge.currency.code === formData.currencyCode
  )
  const addedCharges = formData.chargeIds
    .map(id => charges.find(charge => charge.id === id))
    .filter(charge => charge !== undefined)
  const availableCharges = charges
    .filter(charge => !formData.chargeIds.includes(charge.id))
    .map(charge => ({
      id: charge.id.toString(),
      name: charge.name ?? charge.id.toString(),
    }))

  const handleAdd = () => {
    if (!selectedChargeId) return
    onChange({
      ...formData,
      chargeIds: [...formData.chargeIds, Number(selectedChargeId)],
    })
    setSelectedChargeId('')
  }

  const handleRemove = (id: number) =>
    onChange({
      ...formData,
      chargeIds: formData.chargeIds.filter(chargeId => chargeId !== id),
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <AppSelect
          selectLabel={t('createFixedDepositProduct.fields.charge')}
          selectPlaceholder={t('createFixedDepositProduct.select')}
          selectValue={selectedChargeId}
          selectOnChange={setSelectedChargeId}
          selectOptions={availableCharges}
          selectClassname="flex-1 space-y-2"
          selectEmptyMessage={t('createFixedDepositProduct.noChargeOptions')}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!selectedChargeId}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('addCharge')}
        </Button>
      </div>

      {addedCharges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('createFixedDepositProduct.noCharges')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('createFixedDepositProduct.fields.name')}
              </TableHead>
              <TableHead>
                {t('createFixedDepositProduct.fields.type')}
              </TableHead>
              <TableHead>
                {t('createFixedDepositProduct.fields.amount')}
              </TableHead>
              <TableHead>
                {t('createFixedDepositProduct.fields.collectedOn')}
              </TableHead>
              <TableHead className="text-right">
                {t('createFixedDepositProduct.actions')}
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
                    aria-label={tc('actions.delete')}
                    onClick={() => handleRemove(charge.id)}
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

export default FixedDepositProductChargesStep
