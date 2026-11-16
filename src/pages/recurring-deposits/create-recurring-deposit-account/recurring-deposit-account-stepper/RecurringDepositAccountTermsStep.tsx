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
import NumberField from './NumberField'
import {
  toSelectOptions,
  withoutInvalid,
  type EnumOption,
  type RecurringDepositAccountForm,
  type RecurringDepositAccountStepProps,
} from '../recurring-deposit-account-form'

type SelectField =
  | 'depositPeriodFrequencyId'
  | 'recurringFrequencyType'
  | 'interestCompoundingPeriodType'
  | 'interestPostingPeriodType'
  | 'interestCalculationType'
  | 'interestCalculationDaysInYearType'

const RecurringDepositAccountTermsStep = ({
  formData,
  onChange,
  productTemplate,
}: RecurringDepositAccountStepProps) => {
  const { t } = useTranslation('clients')
  const currency = productTemplate?.currency

  const renderSelect = (
    field: SelectField,
    label: string,
    options: EnumOption[] | undefined
  ) => (
    <AppSelect
      selectLabel={`${label}*`}
      selectPlaceholder={t('recurringDepositApplication.select')}
      selectValue={formData[field]?.toString() ?? ''}
      selectOnChange={value =>
        onChange({ ...formData, [field]: Number(value) })
      }
      selectOptions={toSelectOptions(options)}
      selectClassname="flex-1 space-y-2"
    />
  )

  const setNumber = (
    field: keyof Pick<
      RecurringDepositAccountForm,
      | 'mandatoryRecommendedDepositAmount'
      | 'depositPeriod'
      | 'recurringFrequency'
    >,
    value: number | undefined
  ) => onChange({ ...formData, [field]: value })

  const frequencyOptions = withoutInvalid(
    productTemplate?.periodFrequencyTypeOptions
  )

  return (
    <div className="flex flex-col gap-6">
      {currency && (
        <p className="text-sm text-muted-foreground">
          {t('recurringDepositApplication.fields.currency')}:{' '}
          <span className="font-medium text-foreground">
            {currency.code}
            {currency.displaySymbol ? ` (${currency.displaySymbol})` : ''}
          </span>
        </p>
      )}

      <NumberField
        id="rd-deposit-amount"
        label={`${t('recurringDepositApplication.fields.depositAmount')}*`}
        step={0.01}
        value={formData.mandatoryRecommendedDepositAmount}
        onChange={value =>
          setNumber('mandatoryRecommendedDepositAmount', value)
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <NumberField
          id="rd-deposit-period"
          label={`${t('recurringDepositApplication.fields.depositPeriod')}*`}
          min={1}
          value={formData.depositPeriod}
          onChange={value => setNumber('depositPeriod', value)}
        />
        {renderSelect(
          'depositPeriodFrequencyId',
          t('recurringDepositApplication.fields.depositPeriodType'),
          frequencyOptions
        )}
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('recurringDepositApplication.headings.depositFrequency')}
        </h3>
        <div className="flex items-center gap-3">
          <Checkbox
            id="rd-calendar-inherited"
            checked={formData.isCalendarInherited}
            onCheckedChange={checked =>
              onChange({ ...formData, isCalendarInherited: !!checked })
            }
          />
          <Label
            htmlFor="rd-calendar-inherited"
            className="cursor-pointer font-normal"
          >
            {t('recurringDepositApplication.fields.isCalendarInherited')}
          </Label>
        </div>
        {!formData.isCalendarInherited && (
          <>
            <div className="space-y-2">
              <Label htmlFor="rd-first-deposit-on">
                {t('recurringDepositApplication.fields.depositStartDate')}
              </Label>
              <Input
                id="rd-first-deposit-on"
                type="date"
                min={formData.submittedOnDate || undefined}
                value={formData.expectedFirstDepositOnDate}
                onChange={e =>
                  onChange({
                    ...formData,
                    expectedFirstDepositOnDate: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <NumberField
                id="rd-deposit-frequency"
                label={`${t('recurringDepositApplication.fields.depositFrequency')}*`}
                min={1}
                value={formData.recurringFrequency}
                onChange={value => setNumber('recurringFrequency', value)}
              />
              {renderSelect(
                'recurringFrequencyType',
                t('recurringDepositApplication.fields.depositFrequencyType'),
                frequencyOptions
              )}
            </div>
          </>
        )}
      </div>

      <div className="border-t pt-4 flex flex-col md:flex-row gap-6">
        {renderSelect(
          'interestCompoundingPeriodType',
          t('recurringDepositApplication.fields.interestCompoundingPeriod'),
          productTemplate?.interestCompoundingPeriodTypeOptions
        )}
        {renderSelect(
          'interestPostingPeriodType',
          t('recurringDepositApplication.fields.interestPostingPeriod'),
          productTemplate?.interestPostingPeriodTypeOptions
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {renderSelect(
          'interestCalculationType',
          t('recurringDepositApplication.fields.interestCalculatedUsing'),
          productTemplate?.interestCalculationTypeOptions
        )}
        {renderSelect(
          'interestCalculationDaysInYearType',
          t('recurringDepositApplication.fields.daysInYear'),
          productTemplate?.interestCalculationDaysInYearTypeOptions
        )}
      </div>
    </div>
  )
}

export default RecurringDepositAccountTermsStep
