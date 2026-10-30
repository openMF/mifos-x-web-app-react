/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  toOptionalNumber,
  toSelectOptions,
  type FormUpdater,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductSettingsStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

type BooleanKey =
  | 'isMandatoryDeposit'
  | 'adjustAdvanceTowardsFuturePayments'
  | 'allowWithdrawal'
  | 'preClosurePenalApplicable'
  | 'withHoldTax'

type PeriodPair = {
  valueKey:
    | 'lockinPeriodFrequency'
    | 'minDepositTerm'
    | 'inMultiplesOfDepositTerm'
    | 'maxDepositTerm'
  typeKey:
    | 'lockinPeriodFrequencyType'
    | 'minDepositTermTypeId'
    | 'inMultiplesOfDepositTermTypeId'
    | 'maxDepositTermTypeId'
  label: string
  typeLabel: string
  options: { id: string; name: string }[]
}

const RecurringDepositProductSettingsStep = ({
  form,
  update,
  template,
}: RecurringDepositProductSettingsStepProps) => {
  const { t } = useTranslation('products')

  // Fineract also lists an "Invalid" frequency, which is not a usable choice
  const termTypeOptions = toSelectOptions(
    template?.periodFrequencyTypeOptions?.filter(
      option => !option.code?.endsWith('invalid')
    )
  )
  const lockinTypeOptions = toSelectOptions(
    template?.lockinPeriodFrequencyTypeOptions
  )
  const penalOnOptions = toSelectOptions(
    template?.preClosurePenalInterestOnTypeOptions
  )
  const taxGroupOptions = (template?.taxGroupOptions ?? [])
    .filter(group => group.id !== undefined)
    .map(group => ({ id: group.id!.toString(), name: group.name ?? '' }))

  const depositFlags: { key: BooleanKey; label: string }[] = [
    {
      key: 'isMandatoryDeposit',
      label: t('createRecurringDepositProduct.settings.isMandatoryDeposit'),
    },
    {
      key: 'adjustAdvanceTowardsFuturePayments',
      label: t('createRecurringDepositProduct.settings.adjustAdvancePayments'),
    },
    {
      key: 'allowWithdrawal',
      label: t('createRecurringDepositProduct.settings.allowWithdrawal'),
    },
  ]

  const periodPairs: PeriodPair[] = [
    {
      valueKey: 'lockinPeriodFrequency',
      typeKey: 'lockinPeriodFrequencyType',
      label: t('createRecurringDepositProduct.settings.lockinPeriod'),
      typeLabel: t('createRecurringDepositProduct.settings.lockinPeriodType'),
      options: lockinTypeOptions,
    },
    {
      valueKey: 'minDepositTerm',
      typeKey: 'minDepositTermTypeId',
      label: t('createRecurringDepositProduct.settings.minDepositTerm'),
      typeLabel: t('createRecurringDepositProduct.settings.minDepositTermType'),
      options: termTypeOptions,
    },
    {
      valueKey: 'inMultiplesOfDepositTerm',
      typeKey: 'inMultiplesOfDepositTermTypeId',
      label: t('createRecurringDepositProduct.settings.inMultiplesOfTerm'),
      typeLabel: t(
        'createRecurringDepositProduct.settings.inMultiplesOfTermType'
      ),
      options: termTypeOptions,
    },
    {
      valueKey: 'maxDepositTerm',
      typeKey: 'maxDepositTermTypeId',
      label: t('createRecurringDepositProduct.settings.maxDepositTerm'),
      typeLabel: t('createRecurringDepositProduct.settings.maxDepositTermType'),
      options: termTypeOptions,
    },
  ]

  const renderCheckbox = (key: BooleanKey, label: string) => (
    <div key={key} className="flex items-center gap-3">
      <Checkbox
        id={`rd-${key}`}
        checked={form[key]}
        onCheckedChange={checked => update({ [key]: checked === true })}
      />
      <Label htmlFor={`rd-${key}`} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {depositFlags.map(({ key, label }) => renderCheckbox(key, label))}
      </div>

      <div className="border-t pt-4 flex flex-col gap-6">
        {periodPairs.map(pair => (
          <div key={pair.valueKey} className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`rd-${pair.valueKey}`}>{pair.label}</Label>
              <Input
                id={`rd-${pair.valueKey}`}
                type="number"
                min={0}
                step={1}
                value={form[pair.valueKey] ?? ''}
                onChange={e =>
                  update({ [pair.valueKey]: toOptionalNumber(e.target.value) })
                }
              />
            </div>
            <AppSelect
              selectLabel={pair.typeLabel}
              selectPlaceholder={t('createRecurringDepositProduct.select')}
              selectValue={form[pair.typeKey]?.toString() ?? ''}
              selectOnChange={val => update({ [pair.typeKey]: Number(val) })}
              selectOptions={pair.options}
              selectClassname="flex-1 space-y-2"
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        {renderCheckbox(
          'preClosurePenalApplicable',
          t('createRecurringDepositProduct.settings.preClosurePenal')
        )}
        {form.preClosurePenalApplicable && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="rd-pre-closure-interest">
                {t('createRecurringDepositProduct.settings.penalInterest')}
              </Label>
              <Input
                id="rd-pre-closure-interest"
                type="number"
                min={0}
                step={0.01}
                value={form.preClosurePenalInterest ?? ''}
                onChange={e =>
                  update({
                    preClosurePenalInterest: toOptionalNumber(e.target.value),
                  })
                }
              />
            </div>
            <AppSelect
              selectLabel={t('createRecurringDepositProduct.settings.penalOn')}
              selectPlaceholder={t('createRecurringDepositProduct.select')}
              selectValue={
                form.preClosurePenalInterestOnTypeId?.toString() ?? ''
              }
              selectOnChange={val =>
                update({ preClosurePenalInterestOnTypeId: Number(val) })
              }
              selectOptions={penalOnOptions}
              selectClassname="flex-1 space-y-2"
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="rd-min-balance">
              {t('createRecurringDepositProduct.settings.minBalance')}
            </Label>
            <Input
              id="rd-min-balance"
              type="number"
              min={0}
              step={0.01}
              value={form.minBalanceForInterestCalculation ?? ''}
              onChange={e =>
                update({
                  minBalanceForInterestCalculation: toOptionalNumber(
                    e.target.value
                  ),
                })
              }
            />
          </div>
          <div className="flex-1 hide-lt-md" />
        </div>

        {renderCheckbox(
          'withHoldTax',
          t('createRecurringDepositProduct.settings.withHoldTax')
        )}
        {form.withHoldTax && (
          <div className="flex flex-col md:flex-row gap-6">
            <AppSelect
              selectLabel={t('createRecurringDepositProduct.settings.taxGroup')}
              selectPlaceholder={t('createRecurringDepositProduct.select')}
              selectValue={form.taxGroupId?.toString() ?? ''}
              selectOnChange={val => update({ taxGroupId: Number(val) })}
              selectOptions={taxGroupOptions}
              selectClassname="flex-1 space-y-2"
            />
            <div className="flex-1 hide-lt-md" />
          </div>
        )}
      </div>
    </div>
  )
}

export default RecurringDepositProductSettingsStep
