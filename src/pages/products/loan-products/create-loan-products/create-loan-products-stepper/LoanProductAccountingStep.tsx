/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
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
  ADVANCED_MAPPINGS,
  type AccountList,
  type AdvancedMapping,
  type AdvancedMappingOptions,
  type AdvancedMappingRow,
  type GlAccountOption,
  accountingFieldsFor,
  emptyMappingRow,
  glAccountLabel,
  isAccrual,
  mappingRows,
  usedMappingValues,
  usesAccounts,
  usesAdvancedMappings,
  withAdvancedMappings,
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

type NamedOption = { id?: number; name?: string; penalty?: boolean }

const toNamedOptions = (items?: Iterable<NamedOption>) =>
  Array.from(items ?? [])
    .filter(i => i.id !== undefined)
    .map(i => ({ id: i.id as number, name: i.name ?? String(i.id) }))

type Option = { id: number; name: string }

interface MappingTableProps {
  mapping: AdvancedMapping
  rows: AdvancedMappingRow[]
  valueOptions: Option[]
  accountOptions: Option[]
  onChange: (rows: AdvancedMappingRow[]) => void
}

/** One table of the advanced accounting rules: a row per mapping, add and remove */
const MappingTable = ({
  mapping,
  rows,
  valueOptions,
  accountOptions,
  onChange,
}: MappingTableProps) => {
  const { t } = useTranslation('products')
  const label = (
    part: 'title' | 'value' | 'selectValue' | 'account' | 'noOptions'
  ) => t(`loanProductAccounting.advanced.${mapping.label}.${part}`)
  // Each payment type, charge or reason can be mapped once
  const allMapped = rows.length >= valueOptions.length

  const setRow = (index: number, key: string, value: string) =>
    onChange(
      rows.map((row, i) =>
        i === index ? { ...row, [key]: value ? Number(value) : undefined } : row
      )
    )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-medium">{label('title')}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={allMapped}
          onClick={() => onChange([...rows, emptyMappingRow(mapping)])}
        >
          <Plus className="w-4 h-4" />
          {t('loanProductAccounting.advanced.add')}
        </Button>
      </div>
      {valueOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{label('noOptions')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('loanProductAccounting.advanced.noRows')}
        </p>
      ) : (
        rows.map((row, index) => {
          const used = usedMappingValues(rows, mapping, index)
          return (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
            >
              <AppSelect
                selectLabel={label('value')}
                selectPlaceholder={label('selectValue')}
                selectValue={
                  row[mapping.valueKey] ? String(row[mapping.valueKey]) : ''
                }
                selectOnChange={value => setRow(index, mapping.valueKey, value)}
                selectOptions={valueOptions.filter(o => !used.has(o.id))}
                selectClassname="w-full space-y-2"
              />
              <AppSelect
                selectLabel={label('account')}
                selectPlaceholder={t('loanProductAccounting.selectAccount')}
                selectValue={
                  row[mapping.accountKey] ? String(row[mapping.accountKey]) : ''
                }
                selectOnChange={value =>
                  setRow(index, mapping.accountKey, value)
                }
                selectOptions={accountOptions}
                selectEmptyMessage={t('loanProductAccounting.noAccounts')}
                selectClassname="w-full space-y-2"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('loanProductAccounting.advanced.remove')}
                title={t('loanProductAccounting.advanced.remove')}
                className="text-destructive"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )
        })
      )}
    </div>
  )
}

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
    // Fees can also be mapped to a liability account, as in Angular
    incomeOrLiability: [
      ...toOptions(mapping?.incomeAccountOptions),
      ...liabilities,
    ],
  }

  // penaltyOptions and writeOffReasonOptions are missing in the generated template type
  const extra = template as
    | {
        penaltyOptions?: NamedOption[]
        writeOffReasonOptions?: NamedOption[]
      }
    | undefined
  const valueOptions: Record<AdvancedMappingOptions, Option[]> = {
    paymentTypes: toNamedOptions(template?.paymentTypeOptions),
    fees: toNamedOptions(
      Array.from(template?.chargeOptions ?? []).filter(c => !c.penalty)
    ),
    penalties: toNamedOptions(extra?.penaltyOptions),
    chargeOffReasons: toNamedOptions(template?.chargeOffReasonOptions),
    writeOffReasons: toNamedOptions(extra?.writeOffReasonOptions),
  }
  const advanced = usesAdvancedMappings(values)

  const setRows = (key: string, rows: AdvancedMappingRow[]) =>
    onChange({ ...formData, [key]: rows } as PostLoanProductsRequest)

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

          <Separator />
          <div className="flex items-center gap-2">
            <Checkbox
              id="advancedAccountingRules"
              checked={advanced}
              onCheckedChange={checked =>
                onChange(
                  withAdvancedMappings(
                    values,
                    checked === true
                  ) as PostLoanProductsRequest
                )
              }
            />
            <Label
              htmlFor="advancedAccountingRules"
              className="cursor-pointer font-semibold"
            >
              {t('loanProductAccounting.advanced.title')}
            </Label>
          </div>
          {advanced &&
            ADVANCED_MAPPINGS.map(m => (
              <MappingTable
                key={m.key}
                mapping={m}
                rows={mappingRows(values, m)}
                valueOptions={valueOptions[m.options]}
                accountOptions={lists[m.list]}
                onChange={rows => setRows(m.key, rows)}
              />
            ))}
        </>
      )}
    </div>
  )
}
export default LoanProductAccountingStep
