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
import type { FixedDepositStepProps } from '../fixed-deposit-product-form'

const FixedDepositProductCurrencyStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')

  const currencyOptions = (template?.currencyOptions ?? []).map(c => ({
    id: c.code,
    name: c.name ?? c.code,
    decimalPlaces: c.decimalPlaces,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={`${t('createFixedDepositProduct.fields.currency')}*`}
          selectPlaceholder={t('createFixedDepositProduct.select')}
          selectValue={formData.currencyCode}
          selectOnChange={code => {
            const selected = currencyOptions.find(c => c.id === code)
            onChange({
              ...formData,
              currencyCode: code,
              digitsAfterDecimal:
                selected?.decimalPlaces ?? formData.digitsAfterDecimal,
              // Charges are tied to a currency, so they no longer apply
              chargeIds: [],
            })
          }}
          selectOptions={currencyOptions}
          selectClassname="flex-1 space-y-2"
        />
        <NumberField
          id="fd-decimal-places"
          label={`${t('createFixedDepositProduct.fields.decimalPlaces')}*`}
          max={6}
          step={1}
          value={formData.digitsAfterDecimal}
          onChange={digitsAfterDecimal =>
            onChange({ ...formData, digitsAfterDecimal })
          }
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <NumberField
          id="fd-in-multiples-of"
          label={t('createFixedDepositProduct.fields.inMultiplesOf')}
          min={1}
          step={1}
          value={formData.inMultiplesOf}
          onChange={inMultiplesOf => onChange({ ...formData, inMultiplesOf })}
        />
        <div className="flex-1 hidden md:block" />
      </div>
    </div>
  )
}

export default FixedDepositProductCurrencyStep
