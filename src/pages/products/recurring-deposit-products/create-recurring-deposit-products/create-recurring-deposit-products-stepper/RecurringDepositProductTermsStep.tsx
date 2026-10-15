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
  toSelectOptions,
  type FormUpdater,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductTermsStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

type AmountKey = 'minDepositAmount' | 'depositAmount' | 'maxDepositAmount'

const RecurringDepositProductTermsStep = ({
  form,
  update,
  template,
}: RecurringDepositProductTermsStepProps) => {
  const { t } = useTranslation('products')

  const amountFields: { key: AmountKey; label: string }[] = [
    {
      key: 'minDepositAmount',
      label: t('createRecurringDepositProduct.terms.minDepositAmount'),
    },
    {
      key: 'depositAmount',
      label: t('createRecurringDepositProduct.terms.depositAmount'),
    },
    {
      key: 'maxDepositAmount',
      label: t('createRecurringDepositProduct.terms.maxDepositAmount'),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        {amountFields.map(({ key, label }) => (
          <div key={key} className="flex-1 space-y-2">
            <Label htmlFor={`rd-${key}`}>{label}</Label>
            <Input
              id={`rd-${key}`}
              type="number"
              min={0}
              step={0.01}
              value={form[key] ?? ''}
              onChange={e =>
                update({ [key]: toOptionalNumber(e.target.value) })
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.terms.compounding')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={form.interestCompoundingPeriodType?.toString() ?? ''}
          selectOnChange={val =>
            update({ interestCompoundingPeriodType: Number(val) })
          }
          selectOptions={toSelectOptions(
            template?.interestCompoundingPeriodTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.terms.posting')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={form.interestPostingPeriodType?.toString() ?? ''}
          selectOnChange={val =>
            update({ interestPostingPeriodType: Number(val) })
          }
          selectOptions={toSelectOptions(
            template?.interestPostingPeriodTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.terms.calculation')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={form.interestCalculationType?.toString() ?? ''}
          selectOnChange={val =>
            update({ interestCalculationType: Number(val) })
          }
          selectOptions={toSelectOptions(
            template?.interestCalculationTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel={t('createRecurringDepositProduct.terms.daysInYear')}
          selectPlaceholder={t('createRecurringDepositProduct.select')}
          selectValue={form.interestCalculationDaysInYearType?.toString() ?? ''}
          selectOnChange={val =>
            update({ interestCalculationDaysInYearType: Number(val) })
          }
          selectOptions={toSelectOptions(
            template?.interestCalculationDaysInYearTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
      </div>
    </div>
  )
}

export default RecurringDepositProductTermsStep
