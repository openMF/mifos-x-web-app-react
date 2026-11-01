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
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  chargeNeedsDate,
  chargeNeedsInterval,
  toOptionalNumber,
  type AccountCharge,
  type RecurringDepositAccountStepProps,
} from '../recurring-deposit-account-form'

const RecurringDepositAccountChargesStep = ({
  formData,
  onChange,
  productTemplate,
}: RecurringDepositAccountStepProps) => {
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const [selectedChargeId, setSelectedChargeId] = useState('')

  // A charge can only be added to an account in the same currency
  const currencyCode = productTemplate?.currency?.code
  const charges = (productTemplate?.chargeOptions ?? []).filter(
    charge => !charge.currency?.code || charge.currency.code === currencyCode
  )
  const availableCharges = charges
    .filter(
      charge => !formData.charges.some(added => added.chargeId === charge.id)
    )
    .map(charge => ({
      id: charge.id.toString(),
      name: charge.name ?? charge.id.toString(),
    }))

  const handleAdd = () => {
    const charge = charges.find(c => c.id === Number(selectedChargeId))
    if (!charge) return
    onChange({
      ...formData,
      charges: [
        ...formData.charges,
        {
          chargeId: charge.id,
          name: charge.name,
          calculationType: charge.chargeCalculationType?.value,
          timeType: charge.chargeTimeType,
          amount: charge.amount,
          feeInterval: charge.feeInterval,
        },
      ],
    })
    setSelectedChargeId('')
  }

  const updateCharge = (chargeId: number, changes: Partial<AccountCharge>) =>
    onChange({
      ...formData,
      charges: formData.charges.map(charge =>
        charge.chargeId === chargeId ? { ...charge, ...changes } : charge
      ),
    })

  const handleRemove = (chargeId: number) =>
    onChange({
      ...formData,
      charges: formData.charges.filter(charge => charge.chargeId !== chargeId),
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <AppSelect
          selectLabel={t('recurringDepositApplication.fields.charge')}
          selectPlaceholder={t('recurringDepositApplication.select')}
          selectValue={selectedChargeId}
          selectOnChange={setSelectedChargeId}
          selectOptions={availableCharges}
          selectClassname="flex-1 space-y-2"
          selectEmptyMessage={t('recurringDepositApplication.noChargeOptions')}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!selectedChargeId}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('recurringDepositApplication.addCharge')}
        </Button>
      </div>

      {formData.charges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('recurringDepositApplication.noCharges')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('recurringDepositApplication.fields.name')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.type')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.amount')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.collectedOn')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.date')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.repaymentsEvery')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositApplication.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.charges.map(charge => (
              <TableRow key={charge.chargeId}>
                <TableCell>{charge.name}</TableCell>
                <TableCell>{charge.calculationType}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label={t('recurringDepositApplication.fields.amount')}
                    className="w-28"
                    value={charge.amount ?? ''}
                    onChange={e =>
                      updateCharge(charge.chargeId, {
                        amount: toOptionalNumber(e.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>{charge.timeType?.value}</TableCell>
                <TableCell>
                  {chargeNeedsDate(charge) ? (
                    <Input
                      type="date"
                      aria-label={t('recurringDepositApplication.fields.date')}
                      className="w-40"
                      value={charge.dueDate ?? ''}
                      onChange={e =>
                        updateCharge(charge.chargeId, {
                          dueDate: e.target.value,
                        })
                      }
                    />
                  ) : (
                    tc('actions.na')
                  )}
                </TableCell>
                <TableCell>
                  {chargeNeedsInterval(charge) ? (
                    <Input
                      type="number"
                      min={1}
                      aria-label={t(
                        'recurringDepositApplication.fields.repaymentsEvery'
                      )}
                      className="w-20"
                      value={charge.feeInterval ?? ''}
                      onChange={e =>
                        updateCharge(charge.chargeId, {
                          feeInterval: toOptionalNumber(e.target.value),
                        })
                      }
                    />
                  ) : (
                    tc('actions.na')
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={tc('actions.delete')}
                    onClick={() => handleRemove(charge.chargeId)}
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

export default RecurringDepositAccountChargesStep
