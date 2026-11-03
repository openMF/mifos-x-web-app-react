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
  type ShareProductForm,
  type ShareProductTemplate,
} from '../share-product-form'

interface ShareProductAccountingStepProps {
  form: ShareProductForm
  update: FormUpdater
  template?: ShareProductTemplate
}

const GL_TYPE_ORDER: GlAccountType[] = [
  'asset',
  'liability',
  'equity',
  'income',
]

const ShareProductAccountingStep = ({
  form,
  update,
  template,
}: ShareProductAccountingStepProps) => {
  const { t } = useTranslation('products')

  const accountingRules = [
    {
      id: ACCOUNTING_RULE.none,
      label: t('createShareProduct.accounting.none'),
    },
    {
      id: ACCOUNTING_RULE.cash,
      label: t('createShareProduct.accounting.cash'),
    },
  ]

  const mappingOptions = template?.accountingMappingOptions
  const accountsByType: Record<GlAccountType, GlAccountOption[]> = {
    asset: mappingOptions?.assetAccountOptions ?? [],
    liability: mappingOptions?.liabilityAccountOptions ?? [],
    equity: mappingOptions?.equityAccountOptions ?? [],
    income: mappingOptions?.incomeAccountOptions ?? [],
  }
  const typeHeadings: Record<GlAccountType, string> = {
    asset: t('createShareProduct.accounting.assets'),
    liability: t('createShareProduct.accounting.liabilities'),
    equity: t('createShareProduct.accounting.equity'),
    income: t('createShareProduct.accounting.income'),
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
              id={`sp-rule-${rule.id}`}
            />
            <Label htmlFor={`sp-rule-${rule.id}`}>{rule.label}</Label>
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
                  selectLabel={t(`createShareProduct.accounting.${key}`)}
                  selectPlaceholder={t('createShareProduct.select')}
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

export default ShareProductAccountingStep
