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
  ACCOUNT_MAPPING_FIELDS,
  ACCOUNTING_RULE_ACCRUAL_PERIODIC,
  ACCOUNTING_RULE_CASH,
  ACCOUNTING_RULE_NONE,
  ACCRUAL_ONLY_FIELDS,
  type FixedDepositStepProps,
  type GlAccountOption,
} from '../fixed-deposit-product-form'

// Deposit products support the same rules as savings, without upfront accrual
const ACCOUNTING_RULES = [
  { id: ACCOUNTING_RULE_NONE, label: 'none' },
  { id: ACCOUNTING_RULE_CASH, label: 'cash' },
  { id: ACCOUNTING_RULE_ACCRUAL_PERIODIC, label: 'accrualPeriodic' },
] as const

const FixedDepositProductAccountingStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')
  const mappingOptions = template?.accountingMappingOptions
  const isAccrual = formData.accountingRule === ACCOUNTING_RULE_ACCRUAL_PERIODIC

  const accountOptions: Record<
    keyof typeof ACCOUNT_MAPPING_FIELDS,
    GlAccountOption[] | undefined
  > = {
    assets: mappingOptions?.assetAccountOptions,
    liabilities: mappingOptions?.liabilityAccountOptions,
    expenses: mappingOptions?.expenseAccountOptions,
    income: mappingOptions?.incomeAccountOptions,
  }

  const groups = (
    Object.keys(
      ACCOUNT_MAPPING_FIELDS
    ) as (keyof typeof ACCOUNT_MAPPING_FIELDS)[]
  ).map(group => ({
    group,
    fields: ACCOUNT_MAPPING_FIELDS[group].filter(
      field => isAccrual || !ACCRUAL_ONLY_FIELDS.includes(field)
    ),
    options: (accountOptions[group] ?? []).map(account => ({
      id: account.id.toString(),
      name: account.glCode
        ? `${account.name} (${account.glCode})`
        : (account.name ?? account.id.toString()),
    })),
  }))

  return (
    <div className="flex flex-col gap-6">
      <RadioGroup
        value={formData.accountingRule.toString()}
        onValueChange={value =>
          onChange({ ...formData, accountingRule: Number(value) })
        }
        className="flex flex-wrap gap-6"
      >
        {ACCOUNTING_RULES.map(rule => (
          <div key={rule.id} className="flex items-center space-x-2">
            <RadioGroupItem
              value={rule.id.toString()}
              id={`fd-accounting-${rule.id}`}
            />
            <Label htmlFor={`fd-accounting-${rule.id}`}>
              {t(`createFixedDepositProduct.accountingRules.${rule.label}`)}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {formData.accountingRule !== ACCOUNTING_RULE_NONE &&
        groups.map(({ group, fields, options }) => (
          <div key={group} className="border-t pt-4 flex flex-col gap-4">
            <h3 className="font-semibold">
              {t(`createFixedDepositProduct.headings.${group}`)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => (
                <AppSelect
                  key={field}
                  selectLabel={`${t(`createFixedDepositProduct.accounts.${field}`)}*`}
                  selectPlaceholder={t('createFixedDepositProduct.select')}
                  selectValue={formData.accounts[field]?.toString() ?? ''}
                  selectOnChange={value =>
                    onChange({
                      ...formData,
                      accounts: {
                        ...formData.accounts,
                        [field]: Number(value),
                      },
                    })
                  }
                  selectOptions={options}
                  selectClassname="space-y-2"
                  selectEmptyMessage={t('createFixedDepositProduct.noAccounts')}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

export default FixedDepositProductAccountingStep
