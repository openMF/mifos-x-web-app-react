/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  ACCOUNTING_RULE,
  getRequiredGlMappings,
  type FormUpdater,
  type GlAccountOption,
  type GlAccountType,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductAccountingStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

const GL_TYPE_ORDER: GlAccountType[] = [
  'asset',
  'liability',
  'expense',
  'income',
]

const RecurringDepositProductAccountingStep = ({
  form,
  update,
  template,
}: RecurringDepositProductAccountingStepProps) => {
  const { t } = useTranslation('products')

  const accountingRules = [
    {
      id: ACCOUNTING_RULE.none,
      label: t('createRecurringDepositProduct.accounting.none'),
    },
    {
      id: ACCOUNTING_RULE.cash,
      label: t('createRecurringDepositProduct.accounting.cash'),
    },
    {
      id: ACCOUNTING_RULE.accrualPeriodic,
      label: t('createRecurringDepositProduct.accounting.accrualPeriodic'),
    },
  ]

  const mappingOptions = template?.accountingMappingOptions
  const accountsByType: Record<GlAccountType, GlAccountOption[]> = {
    asset: mappingOptions?.assetAccountOptions ?? [],
    liability: mappingOptions?.liabilityAccountOptions ?? [],
    income: mappingOptions?.incomeAccountOptions ?? [],
    expense: mappingOptions?.expenseAccountOptions ?? [],
  }
  const typeHeadings: Record<GlAccountType, string> = {
    asset: t('createRecurringDepositProduct.accounting.assets'),
    liability: t('createRecurringDepositProduct.accounting.liabilities'),
    income: t('createRecurringDepositProduct.accounting.income'),
    expense: t('createRecurringDepositProduct.accounting.expenses'),
  }

  const requiredMappings = getRequiredGlMappings(form.accountingRule)

  const toAccountOptions = (type: GlAccountType) =>
    accountsByType[type]
      .filter(account => account.id !== undefined)
      .map(account => ({
        id: account.id!.toString(),
        name: account.glCode
          ? `${account.name} (${account.glCode})`
          : (account.name ?? ''),
      }))

  return (
    <div className="space-y-6">
      <RadioGroup
        value={form.accountingRule.toString()}
        onValueChange={val => update({ accountingRule: Number(val) })}
        className="flex flex-wrap gap-6"
      >
        {accountingRules.map(rule => (
          <div key={rule.id} className="flex items-center space-x-2">
            <RadioGroupItem
              value={rule.id.toString()}
              id={`rd-rule-${rule.id}`}
            />
            <Label htmlFor={`rd-rule-${rule.id}`}>{rule.label}</Label>
          </div>
        ))}
      </RadioGroup>

      {GL_TYPE_ORDER.map(type => {
        const mappings = requiredMappings.filter(m => m.type === type)
        if (mappings.length === 0) return null
        return (
          <div key={type} className="border-t pt-4 flex flex-col gap-4">
            <h3 className="font-semibold">{typeHeadings[type]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mappings.map(({ key }) => (
                <AppSelect
                  key={key}
                  selectLabel={t(
                    `createRecurringDepositProduct.accounting.${key}`
                  )}
                  selectPlaceholder={t('createRecurringDepositProduct.select')}
                  selectValue={form.glMappings[key]?.toString() ?? ''}
                  selectOnChange={val =>
                    update({
                      glMappings: { ...form.glMappings, [key]: Number(val) },
                    })
                  }
                  selectOptions={toAccountOptions(type)}
                  selectClassname="space-y-2"
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RecurringDepositProductAccountingStep
