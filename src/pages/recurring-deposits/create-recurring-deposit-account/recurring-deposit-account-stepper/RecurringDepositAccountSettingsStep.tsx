/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import NumberField from './NumberField'
import {
  toSelectOptions,
  type EnumOption,
  type FieldLabelKey,
  type RecurringDepositAccountForm,
  type RecurringDepositAccountStepProps,
} from '../recurring-deposit-account-form'

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex-1 space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{value}</p>
  </div>
)

type FlagField = keyof Pick<
  RecurringDepositAccountForm,
  | 'isMandatoryDeposit'
  | 'adjustAdvanceTowardsFuturePayments'
  | 'allowWithdrawal'
>

const FLAGS: [FlagField, FieldLabelKey][] = [
  ['isMandatoryDeposit', 'isMandatoryDeposit'],
  ['adjustAdvanceTowardsFuturePayments', 'adjustAdvanceTowardsFuturePayments'],
  ['allowWithdrawal', 'allowWithdrawal'],
]

const RecurringDepositAccountSettingsStep = ({
  formData,
  onChange,
  productTemplate,
}: RecurringDepositAccountStepProps) => {
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const period = (value?: number, type?: EnumOption) =>
    value === undefined || value === null
      ? tc('actions.na')
      : `${value} ${type?.value ?? ''}`.trim()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {FLAGS.map(([name, label]) => (
          <div key={name} className="flex items-center gap-3">
            <Checkbox
              id={`rd-${name}`}
              checked={formData[name]}
              onCheckedChange={checked =>
                onChange({ ...formData, [name]: !!checked })
              }
            />
            <Label
              htmlFor={`rd-${name}`}
              className="cursor-pointer font-normal"
            >
              {t(`recurringDepositApplication.fields.${label}`)}
            </Label>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('recurringDepositApplication.headings.lockinPeriod')}
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <NumberField
            id="rd-lockin-period"
            label={t('recurringDepositApplication.fields.frequency')}
            value={formData.lockinPeriodFrequency}
            onChange={value =>
              onChange({ ...formData, lockinPeriodFrequency: value })
            }
          />
          <AppSelect
            selectLabel={t('recurringDepositApplication.fields.type')}
            selectPlaceholder={t('recurringDepositApplication.select')}
            selectValue={formData.lockinPeriodFrequencyType?.toString() ?? ''}
            selectOnChange={value =>
              onChange({
                ...formData,
                lockinPeriodFrequencyType: Number(value),
              })
            }
            selectOptions={toSelectOptions(
              productTemplate?.lockinPeriodFrequencyTypeOptions
            )}
            selectClassname="flex-1 space-y-2"
          />
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('recurringDepositApplication.headings.depositTerm')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('recurringDepositApplication.fromProduct')}
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <ReadOnlyField
            label={t('recurringDepositApplication.fields.minDepositTerm')}
            value={period(
              productTemplate?.minDepositTerm,
              productTemplate?.minDepositTermType
            )}
          />
          <ReadOnlyField
            label={t(
              'recurringDepositApplication.fields.inMultiplesOfDepositTerm'
            )}
            value={period(
              productTemplate?.inMultiplesOfDepositTerm,
              productTemplate?.inMultiplesOfDepositTermType
            )}
          />
          <ReadOnlyField
            label={t('recurringDepositApplication.fields.maxDepositTerm')}
            value={period(
              productTemplate?.maxDepositTerm,
              productTemplate?.maxDepositTermType
            )}
          />
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('recurringDepositApplication.headings.preClosure')}
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <ReadOnlyField
            label={t(
              'recurringDepositApplication.fields.preClosurePenalApplicable'
            )}
            value={
              productTemplate?.preClosurePenalApplicable
                ? tc('actions.yes')
                : tc('actions.no')
            }
          />
          {productTemplate?.preClosurePenalApplicable && (
            <>
              <ReadOnlyField
                label={t('recurringDepositApplication.fields.penalInterest')}
                value={`${productTemplate.preClosurePenalInterest ?? 0}%`}
              />
              <ReadOnlyField
                label={t('recurringDepositApplication.fields.penalInterestOn')}
                value={
                  productTemplate.preClosurePenalInterestOnType?.value ??
                  tc('actions.na')
                }
              />
            </>
          )}
          <ReadOnlyField
            label={t(
              'recurringDepositApplication.fields.minBalanceForInterestCalculation'
            )}
            value={String(
              productTemplate?.minBalanceForInterestCalculation ??
                tc('actions.na')
            )}
          />
        </div>
      </div>

      {productTemplate?.withHoldTax && (
        <div className="border-t pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="rd-withhold-tax"
              checked={formData.withHoldTax}
              onCheckedChange={checked =>
                onChange({ ...formData, withHoldTax: !!checked })
              }
            />
            <Label
              htmlFor="rd-withhold-tax"
              className="cursor-pointer font-normal"
            >
              {t('recurringDepositApplication.fields.withHoldTax')}
            </Label>
          </div>
          {formData.withHoldTax && (
            <ReadOnlyField
              label={t('recurringDepositApplication.fields.taxGroup')}
              value={productTemplate.taxGroup?.name ?? tc('actions.na')}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default RecurringDepositAccountSettingsStep
