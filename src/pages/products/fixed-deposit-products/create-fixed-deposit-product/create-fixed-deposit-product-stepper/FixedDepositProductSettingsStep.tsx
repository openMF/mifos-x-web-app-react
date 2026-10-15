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
  fromSelectValue,
  toSelectOptions,
  withNoneOption,
  type FixedDepositProductForm,
  type FixedDepositStepProps,
} from '../fixed-deposit-product-form'

type NumericField = {
  [K in keyof FixedDepositProductForm]-?: FixedDepositProductForm[K] extends
    | number
    | undefined
    ? K
    : never
}[keyof FixedDepositProductForm]

const FixedDepositProductSettingsStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')

  // Fineract lists an "Invalid" frequency that cannot be used for a term
  const termTypeOptions = toSelectOptions(
    template?.periodFrequencyTypeOptions?.filter(
      option => !option.code?.toLowerCase().endsWith('invalid')
    )
  )
  const lockinTypeOptions = toSelectOptions(
    template?.lockinPeriodFrequencyTypeOptions
  )
  const penalInterestOnOptions = toSelectOptions(
    template?.preClosurePenalInterestOnTypeOptions
  )
  const taxGroupOptions = (template?.taxGroupOptions ?? []).map(group => ({
    id: group.id.toString(),
    name: group.name ?? group.id.toString(),
  }))

  const setNumber = (field: NumericField, value: number | undefined) =>
    onChange({ ...formData, [field]: value })

  const renderPeriodRow = (
    id: string,
    label: string,
    frequencyField: NumericField,
    typeField: NumericField,
    options: { id: string; name: string }[],
    required = false,
    // Deposit terms must be above 0, while a lock-in period may be 0
    minimum = 1
  ) => (
    <div className="flex flex-col md:flex-row gap-6">
      <NumberField
        id={id}
        label={required ? `${label}*` : label}
        min={minimum}
        step={1}
        value={formData[frequencyField]}
        onChange={value => setNumber(frequencyField, value)}
      />
      <AppSelect
        selectLabel={`${t('createFixedDepositProduct.fields.type')}${required ? '*' : ''}`}
        selectPlaceholder={t('createFixedDepositProduct.select')}
        selectValue={formData[typeField]?.toString() ?? ''}
        selectOnChange={value => setNumber(typeField, fromSelectValue(value))}
        selectOptions={
          required
            ? options
            : withNoneOption(options, t('createFixedDepositProduct.none'))
        }
        selectClassname="flex-1 space-y-2"
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold">
        {t('createFixedDepositProduct.headings.lockinPeriod')}
      </h3>
      {renderPeriodRow(
        'fd-lockin-period',
        t('createFixedDepositProduct.fields.frequency'),
        'lockinPeriodFrequency',
        'lockinPeriodFrequencyType',
        lockinTypeOptions,
        false,
        0
      )}

      <h3 className="font-semibold border-t pt-4">
        {t('createFixedDepositProduct.headings.depositTerm')}
      </h3>
      {renderPeriodRow(
        'fd-min-deposit-term',
        t('createFixedDepositProduct.fields.minDepositTerm'),
        'minDepositTerm',
        'minDepositTermTypeId',
        termTypeOptions,
        true
      )}
      {renderPeriodRow(
        'fd-in-multiples-of-deposit-term',
        t('createFixedDepositProduct.fields.inMultiplesOfDepositTerm'),
        'inMultiplesOfDepositTerm',
        'inMultiplesOfDepositTermTypeId',
        termTypeOptions
      )}
      {renderPeriodRow(
        'fd-max-deposit-term',
        t('createFixedDepositProduct.fields.maxDepositTerm'),
        'maxDepositTerm',
        'maxDepositTermTypeId',
        termTypeOptions
      )}

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('createFixedDepositProduct.headings.preClosure')}
        </h3>
        <div className="flex items-center gap-3">
          <Checkbox
            id="fd-pre-closure-penal"
            checked={formData.preClosurePenalApplicable}
            onCheckedChange={checked =>
              onChange({ ...formData, preClosurePenalApplicable: !!checked })
            }
          />
          <Label
            htmlFor="fd-pre-closure-penal"
            className="cursor-pointer font-normal"
          >
            {t('createFixedDepositProduct.fields.preClosurePenalApplicable')}
          </Label>
        </div>
        {formData.preClosurePenalApplicable && (
          <div className="flex flex-col md:flex-row gap-6">
            <NumberField
              id="fd-penal-interest"
              label={`${t('createFixedDepositProduct.fields.penalInterest')}*`}
              step={0.01}
              value={formData.preClosurePenalInterest}
              onChange={value => setNumber('preClosurePenalInterest', value)}
            />
            <AppSelect
              selectLabel={`${t('createFixedDepositProduct.fields.penalInterestOn')}*`}
              selectPlaceholder={t('createFixedDepositProduct.select')}
              selectValue={
                formData.preClosurePenalInterestOnTypeId?.toString() ?? ''
              }
              selectOnChange={value =>
                setNumber('preClosurePenalInterestOnTypeId', Number(value))
              }
              selectOptions={penalInterestOnOptions}
              selectClassname="flex-1 space-y-2"
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="fd-withhold-tax"
            checked={formData.withHoldTax}
            onCheckedChange={checked =>
              onChange({ ...formData, withHoldTax: !!checked })
            }
          />
          <Label
            htmlFor="fd-withhold-tax"
            className="cursor-pointer font-normal"
          >
            {t('createFixedDepositProduct.fields.withHoldTax')}
          </Label>
        </div>
        {formData.withHoldTax && (
          <AppSelect
            selectLabel={`${t('createFixedDepositProduct.fields.taxGroup')}*`}
            selectPlaceholder={t('createFixedDepositProduct.select')}
            selectValue={formData.taxGroupId?.toString() ?? ''}
            selectOnChange={value => setNumber('taxGroupId', Number(value))}
            selectOptions={taxGroupOptions}
            selectEmptyMessage={t('createFixedDepositProduct.noTaxGroups')}
          />
        )}
      </div>
    </div>
  )
}

export default FixedDepositProductSettingsStep
