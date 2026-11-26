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
  type FixedDepositStepProps,
} from '../fixed-deposit-product-form'

const FixedDepositProductTermsStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')

  const interestSelects = [
    {
      field: 'interestCompoundingPeriodType',
      label: 'interestCompoundingPeriod',
      options: template?.interestCompoundingPeriodTypeOptions,
    },
    {
      field: 'interestPostingPeriodType',
      label: 'interestPostingPeriod',
      options: template?.interestPostingPeriodTypeOptions,
    },
    {
      field: 'interestCalculationType',
      label: 'interestCalculatedUsing',
      options: template?.interestCalculationTypeOptions,
    },
    {
      field: 'interestCalculationDaysInYearType',
      label: 'daysInYear',
      options: template?.interestCalculationDaysInYearTypeOptions,
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold">
        {t('createFixedDepositProduct.headings.depositAmount')}
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        <NumberField
          id="fd-min-deposit-amount"
          label={t('createFixedDepositProduct.fields.minDepositAmount')}
          step={0.01}
          value={formData.minDepositAmount}
          onChange={minDepositAmount =>
            onChange({ ...formData, minDepositAmount })
          }
        />
        <NumberField
          id="fd-deposit-amount"
          label={`${t('createFixedDepositProduct.fields.depositAmount')}*`}
          step={0.01}
          value={formData.depositAmount}
          onChange={depositAmount => onChange({ ...formData, depositAmount })}
        />
        <NumberField
          id="fd-max-deposit-amount"
          label={t('createFixedDepositProduct.fields.maxDepositAmount')}
          step={0.01}
          value={formData.maxDepositAmount}
          onChange={maxDepositAmount =>
            onChange({ ...formData, maxDepositAmount })
          }
        />
      </div>

      <h3 className="font-semibold border-t pt-4">
        {t('createFixedDepositProduct.headings.interest')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interestSelects.map(({ field, label, options }) => (
          <AppSelect
            key={field}
            selectLabel={`${t(`createFixedDepositProduct.fields.${label}`)}*`}
            selectPlaceholder={t('createFixedDepositProduct.select')}
            selectValue={formData[field]?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, [field]: Number(value) })
            }
            selectOptions={toSelectOptions(options)}
            selectClassname="space-y-2"
          />
        ))}
      </div>
    </div>
  )
}

export default FixedDepositProductTermsStep
