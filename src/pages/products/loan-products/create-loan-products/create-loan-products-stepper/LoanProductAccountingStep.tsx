/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import type {
  GetLoanProductsTemplateResponse,
  PostLoanProductsRequest,
} from '@/fineract-api'

import {
  ACCOUNTING_RULE,
  ACCOUNTING_SECTIONS,
  type AccountList,
  type GlAccountOption,
  accountingFieldsFor,
  glAccountLabel,
  isAccrual,
  usesAccounts,
  withoutAccountMappings,
} from '../../loanProductAccounting'

const RULES = [
  { value: ACCOUNTING_RULE.none, label: 'none' },
  { value: ACCOUNTING_RULE.cash, label: 'cash' },
  { value: ACCOUNTING_RULE.accrualPeriodic, label: 'accrualPeriodic' },
  { value: ACCOUNTING_RULE.accrualUpfront, label: 'accrualUpfront' },
] as const

interface LoanProductAccountingStepProps {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
  template?: GetLoanProductsTemplateResponse
}

const toOptions = (accounts?: Iterable<GlAccountOption>) =>
  Array.from(accounts ?? [])
    .filter(a => a.id !== undefined)
    .map(a => ({ id: a.id as number, name: glAccountLabel(a) }))

const LoanProductAccountingStep = ({
  formData,
  onChange,
  template,
}: LoanProductAccountingStepProps) => {
  const { t } = useTranslation('products')
  const rule = formData.accountingRule ?? ACCOUNTING_RULE.none
  const values = formData as Record<string, unknown>

  const mapping = template?.accountingMappingOptions
  const assets = toOptions(mapping?.assetAccountOptions)
  const liabilities = toOptions(mapping?.liabilityAccountOptions)
  const lists: Record<AccountList, { id: number; name: string }[]> = {
    asset: assets,
    income: toOptions(mapping?.incomeAccountOptions),
    expense: toOptions(mapping?.expenseAccountOptions),
    liability: liabilities,
    // The fund source can be a cash (asset) or a bank liability account, as in Angular
    fund: [...assets, ...liabilities],
  }

  const fields = accountingFieldsFor(rule)

  const setRule = (value: string) =>
    onChange({
      // Accounts chosen for another rule would otherwise still be sent
      ...withoutAccountMappings(formData as Record<string, unknown>),
      accountingRule: Number(value),
    } as PostLoanProductsRequest)

  const setAccount = (key: string, value: string) =>
    onChange({
      ...formData,
      [key]: value ? Number(value) : undefined,
    } as PostLoanProductsRequest)

  return (
    <div className="flex flex-col gap-6">
      <RadioGroup
        value={String(rule)}
        onValueChange={setRule}
        className="flex flex-col md:flex-row gap-6"
      >
        {RULES.map(({ value, label }) => (
          <div key={value} className="flex items-center gap-2">
            <RadioGroupItem value={String(value)} id={`rule-${value}`} />
            <Label
              htmlFor={`rule-${value}`}
              className="cursor-pointer font-normal"
            >
              {t(`loanProductAccounting.rules.${label}`)}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {usesAccounts(rule) && (
        <>
          {isAccrual(rule) && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="enableAccrualActivityPosting"
                checked={Boolean(values.enableAccrualActivityPosting)}
                onCheckedChange={checked =>
                  onChange({
                    ...formData,
                    enableAccrualActivityPosting: checked === true,
                  } as PostLoanProductsRequest)
                }
              />
              <Label
                htmlFor="enableAccrualActivityPosting"
                className="cursor-pointer font-normal"
              >
                {t('loanProductAccounting.enableAccrualActivityPosting')}
              </Label>
            </div>
          )}

          {ACCOUNTING_SECTIONS.map(section => {
            const sectionFields = fields.filter(f => f.section === section)
            if (!sectionFields.length) return null
            return (
              <div key={section} className="flex flex-col gap-4">
                <Separator />
                <h3 className="font-semibold">
                  {t(`loanProductAccounting.sections.${section}`)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionFields.map(field => (
                    <AppSelect
                      key={field.key}
                      selectLabel={`${t(`loanProductAccounting.fields.${field.label}`)}${field.required ? ' *' : ''}`}
                      selectPlaceholder={t(
                        'loanProductAccounting.selectAccount'
                      )}
                      selectValue={
                        values[field.key] ? String(values[field.key]) : ''
                      }
                      selectOnChange={value => setAccount(field.key, value)}
                      selectOptions={lists[field.list]}
                      selectEmptyMessage={t('loanProductAccounting.noAccounts')}
                      selectClassname="w-full space-y-2"
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
export default LoanProductAccountingStep
