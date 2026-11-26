/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import AppSelect from '@/components/custom/select/AppSelect'
import NumberField from './NumberField'
import {
  toSelectOptions,
  type EnumOption,
  type FixedDepositAccountForm,
  type FixedDepositAccountStepProps,
} from '../fixed-deposit-account-form'

type SelectField =
  | 'depositPeriodFrequencyId'
  | 'interestCompoundingPeriodType'
  | 'interestPostingPeriodType'
  | 'interestCalculationType'
  | 'interestCalculationDaysInYearType'

const FixedDepositAccountTermsStep = ({
  formData,
  onChange,
  productTemplate,
}: FixedDepositAccountStepProps) => {
  const { t } = useTranslation('clients')
  const currency = productTemplate?.currency

  const renderSelect = (
    field: SelectField,
    label: string,
    options: EnumOption[] | undefined
  ) => (
    <AppSelect
      selectLabel={`${label}*`}
      selectPlaceholder={t('fixedDepositApplication.select')}
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
      FixedDepositAccountForm,
      'depositAmount' | 'depositPeriod'
    >,
    value: number | undefined
  ) => onChange({ ...formData, [field]: value })

  return (
    <div className="flex flex-col gap-6">
      {currency && (
        <p className="text-sm text-muted-foreground">
          {t('fixedDepositApplication.fields.currency')}:{' '}
          <span className="font-medium text-foreground">
            {currency.code}
            {currency.displaySymbol ? ` (${currency.displaySymbol})` : ''}
          </span>
        </p>
      )}

      <NumberField
        id="fd-deposit-amount"
        label={`${t('fixedDepositApplication.fields.depositAmount')}*`}
        step={0.01}
        value={formData.depositAmount}
        onChange={value => setNumber('depositAmount', value)}
      />

      <div className="flex flex-col md:flex-row gap-6">
        <NumberField
          id="fd-deposit-period"
          label={`${t('fixedDepositApplication.fields.depositPeriod')}*`}
          min={1}
          value={formData.depositPeriod}
          onChange={value => setNumber('depositPeriod', value)}
        />
        {renderSelect(
          'depositPeriodFrequencyId',
          t('fixedDepositApplication.fields.depositPeriodType'),
          // Fineract lists an "Invalid" frequency that cannot be used for a term
          productTemplate?.periodFrequencyTypeOptions?.filter(
            option => !option.code?.toLowerCase().endsWith('invalid')
          )
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {renderSelect(
          'interestCompoundingPeriodType',
          t('fixedDepositApplication.fields.interestCompoundingPeriod'),
          productTemplate?.interestCompoundingPeriodTypeOptions
        )}
        {renderSelect(
          'interestPostingPeriodType',
          t('fixedDepositApplication.fields.interestPostingPeriod'),
          productTemplate?.interestPostingPeriodTypeOptions
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {renderSelect(
          'interestCalculationType',
          t('fixedDepositApplication.fields.interestCalculatedUsing'),
          productTemplate?.interestCalculationTypeOptions
        )}
        {renderSelect(
          'interestCalculationDaysInYearType',
          t('fixedDepositApplication.fields.daysInYear'),
          productTemplate?.interestCalculationDaysInYearTypeOptions
        )}
      </div>
    </div>
  )
}

export default FixedDepositAccountTermsStep
