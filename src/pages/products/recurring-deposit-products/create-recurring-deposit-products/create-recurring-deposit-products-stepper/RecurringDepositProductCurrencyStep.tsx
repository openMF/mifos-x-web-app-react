/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  toOptionalNumber,
  type FormUpdater,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductCurrencyStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

const RecurringDepositProductCurrencyStep = ({
  form,
  update,
  template,
}: RecurringDepositProductCurrencyStepProps) => {
  const { t } = useTranslation('products')

  const currencies = template?.currencyOptions ?? []
  const currencyOptions = currencies
    .filter(currency => currency.code)
    .map(currency => ({
      id: currency.code!,
      name: currency.displayLabel ?? currency.name ?? currency.code!,
    }))

  const handleCurrencyChange = (code: string) => {
    const currency = currencies.find(c => c.code === code)
    update({
      currencyCode: code,
      digitsAfterDecimal: currency?.decimalPlaces ?? form.digitsAfterDecimal,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.currency.currency')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={form.currencyCode ?? ''}
          selectOnChange={handleCurrencyChange}
          selectOptions={currencyOptions}
          selectClassname="flex-1 space-y-2"
        />
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-decimal-places">
            {t('createRecurringDepositProduct.currency.decimalPlaces')}
          </Label>
          <Input
            id="rd-decimal-places"
            type="number"
            min={0}
            max={6}
            step={1}
            value={form.digitsAfterDecimal ?? ''}
            onChange={e =>
              update({ digitsAfterDecimal: toOptionalNumber(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-in-multiples-of">
            {t('createRecurringDepositProduct.currency.inMultiplesOf')}
          </Label>
          <Input
            id="rd-in-multiples-of"
            type="number"
            min={1}
            step={1}
            value={form.inMultiplesOf ?? ''}
            onChange={e =>
              update({ inMultiplesOf: toOptionalNumber(e.target.value) })
            }
          />
        </div>
        <div className="flex-1 hide-lt-md" />
      </div>
    </div>
  )
}

export default RecurringDepositProductCurrencyStep
