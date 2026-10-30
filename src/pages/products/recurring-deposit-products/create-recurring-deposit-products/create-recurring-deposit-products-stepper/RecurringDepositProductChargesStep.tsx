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
  RecurringDepositProductForm,
  RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductChargesStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

const RecurringDepositProductChargesStep = ({
  form,
  update,
  template,
}: RecurringDepositProductChargesStepProps) => {
  const { t } = useTranslation('products')
  const [selectedChargeId, setSelectedChargeId] = useState('')

  const charges = (template?.chargeOptions ?? []).filter(
    charge => charge.id !== undefined
  )
  const availableOptions = charges
    .filter(charge => !form.chargeIds.includes(charge.id!))
    .map(charge => ({ id: charge.id!.toString(), name: charge.name ?? '' }))
  const addedCharges = charges.filter(charge =>
    form.chargeIds.includes(charge.id!)
  )

  const handleAdd = () => {
    if (!selectedChargeId) return
    update({ chargeIds: [...form.chargeIds, Number(selectedChargeId)] })
    setSelectedChargeId('')
  }

  const handleRemove = (id: number) =>
    update({ chargeIds: form.chargeIds.filter(chargeId => chargeId !== id) })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.charges.charge')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={selectedChargeId}
          selectOnChange={setSelectedChargeId}
          selectOptions={availableOptions}
          selectEmptyMessage={t('createRecurringDepositProduct.charges.none')}
          selectClassname="flex-1 space-y-2"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!selectedChargeId}
        >
          {t('createRecurringDepositProduct.charges.add')}
        </Button>
      </div>

      {addedCharges.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('createRecurringDepositProduct.charges.name')}
              </TableHead>
              <TableHead>
                {t('createRecurringDepositProduct.charges.type')}
              </TableHead>
              <TableHead>
                {t('createRecurringDepositProduct.charges.amount')}
              </TableHead>
              <TableHead>
                {t('createRecurringDepositProduct.charges.collectedOn')}
              </TableHead>
              <TableHead className="text-right">
                {t('createRecurringDepositProduct.charges.actions')}
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
                    aria-label={t(
                      'createRecurringDepositProduct.charges.remove'
                    )}
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

export default RecurringDepositProductChargesStep
