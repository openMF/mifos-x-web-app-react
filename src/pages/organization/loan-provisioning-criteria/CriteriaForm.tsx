/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AppMultiSelect from '@/components/custom/select/AppMultiSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  categoryLabel,
  type CriteriaDefinition,
  type CriteriaLoanProduct,
  type GlAccount,
} from './types'

/** The body of POST /provisioningcriteria and PUT /provisioningcriteria/{id} */
export type CriteriaPayload = {
  criteriaName: string
  locale: string
  loanProducts: { id: number }[]
  definitions: {
    categoryId: number
    categoryName: string
    minAge: number
    maxAge: number
    provisioningPercentage: number
    liabilityAccount: number
    expenseAccount: number
  }[]
}

/** One editable row; inputs are kept as strings until submit */
type DefinitionRow = {
  categoryId: number
  categoryName: string
  minAge: string
  maxAge: string
  provisioningPercentage: string
  liabilityAccount: string
  expenseAccount: string
}

const FIELD_LABEL_KEYS = {
  minAge: 'provisioningCriteria.fields.minAge',
  maxAge: 'provisioningCriteria.fields.maxAge',
  provisioningPercentage: 'provisioningCriteria.fields.percentage',
} as const

const toText = (v?: number) => (v === undefined || v === null ? '' : String(v))

const toRow = (d: CriteriaDefinition): DefinitionRow => ({
  categoryId: d.categoryId ?? 0,
  categoryName: d.categoryName ?? '',
  minAge: toText(d.minAge),
  maxAge: toText(d.maxAge),
  provisioningPercentage: toText(d.provisioningPercentage),
  liabilityAccount: toText(d.liabilityAccount),
  expenseAccount: toText(d.expenseAccount),
})

type CriteriaFormProps = {
  title: string
  initialName?: string
  initialProductIds?: string[]
  initialDefinitions: CriteriaDefinition[]
  productOptions: CriteriaLoanProduct[]
  glAccounts: GlAccount[]
  cancelPath: string
  /** Sends the request; resolves to an error message, or null on success */
  onSubmit: (payload: CriteriaPayload) => Promise<string | null>
}

/**
 * The Create and Edit Loan Provisioning Criteria form of the Angular web app:
 * a name, the loan products it covers, and for each provisioning category
 * (Standard, Sub-standard, Doubtful, Loss) the overdue age range, the
 * percentage to provision, and the liability and expense GL accounts.
 */
const CriteriaForm = ({
  title,
  initialName = '',
  initialProductIds = [],
  initialDefinitions,
  productOptions,
  glAccounts,
  cancelPath,
  onSubmit,
}: CriteriaFormProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [name, setName] = useState(initialName)
  const [productIds, setProductIds] = useState<string[]>(initialProductIds)
  const [rows, setRows] = useState<DefinitionRow[]>(
    initialDefinitions.map(toRow)
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const liabilityAccounts = glAccounts.filter(
    a => a.type?.value === 'LIABILITY'
  )
  const expenseAccounts = glAccounts.filter(a => a.type?.value === 'EXPENSE')

  const updateRow = (
    index: number,
    field: keyof DefinitionRow,
    value: string
  ) => {
    setRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
    setError(null)
  }

  /** Returns the first problem with a row, or null when it can be sent */
  const rowProblem = (r: DefinitionRow): string | null => {
    const category = categoryLabel(r.categoryName)
    const numbers = [r.minAge, r.maxAge, r.provisioningPercentage]
    if (
      numbers.some(v => v.trim() === '') ||
      !r.liabilityAccount ||
      !r.expenseAccount
    )
      return t('provisioningCriteria.validation.fillEveryField', { category })
    if (numbers.some(v => isNaN(Number(v)) || Number(v) < 0))
      return t('provisioningCriteria.validation.notNegative', { category })
    if (Number(r.minAge) > Number(r.maxAge))
      return t('provisioningCriteria.validation.minAboveMax', { category })
    if (Number(r.provisioningPercentage) > 100)
      return t('provisioningCriteria.validation.percentageAbove100', {
        category,
      })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!name.trim())
      return setError(t('provisioningCriteria.validation.nameRequired'))
    if (productIds.length === 0)
      return setError(t('provisioningCriteria.validation.productRequired'))
    const problem = rows.map(rowProblem).find(Boolean)
    if (problem) return setError(problem)

    setSubmitting(true)
    setError(null)
    const message = await onSubmit({
      criteriaName: name.trim(),
      locale: 'en',
      loanProducts: productIds.map(id => ({ id: Number(id) })),
      definitions: rows.map(r => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        minAge: Number(r.minAge),
        maxAge: Number(r.maxAge),
        provisioningPercentage: Number(r.provisioningPercentage),
        liabilityAccount: Number(r.liabilityAccount),
        expenseAccount: Number(r.expenseAccount),
      })),
    })
    // On success the page has already navigated away
    if (message) {
      setError(message)
      setSubmitting(false)
    }
  }

  const accountSelect = (
    index: number,
    field: 'liabilityAccount' | 'expenseAccount',
    accounts: GlAccount[],
    label: string
  ) => (
    <Select
      value={rows[index][field]}
      onValueChange={v => updateRow(index, field, v)}
    >
      <SelectTrigger
        className="w-full min-w-[140px] max-w-[200px]"
        aria-label={t('provisioningCriteria.fields.fieldForCategory', {
          field: label,
          category: categoryLabel(rows[index].categoryName),
        })}
      >
        <SelectValue
          placeholder={
            accounts.length
              ? t('provisioningCriteria.fields.selectAccount')
              : t('provisioningCriteria.fields.noAccounts')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {accounts.map(a => (
          <SelectItem key={a.id} value={String(a.id)}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="criteriaName">
              {t('provisioningCriteria.fields.criteriaNameRequired')}
            </Label>
            <Input
              id="criteriaName"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
            />
          </div>
          <AppMultiSelect
            selectLabel={t('provisioningCriteria.fields.loanProductsRequired')}
            selectPlaceholder={t(
              'provisioningCriteria.fields.selectLoanProducts'
            )}
            selectValues={productIds}
            selectOnChange={v => {
              setProductIds(v)
              setError(null)
            }}
            selectOptions={productOptions.map(p => ({
              id: p.id ?? '',
              name: p.name ?? '',
            }))}
          />
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('common:ui.category')}
                </TableHead>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('provisioningCriteria.fields.minAgeDaysRequired')}
                </TableHead>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('provisioningCriteria.fields.maxAgeDaysRequired')}
                </TableHead>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('provisioningCriteria.fields.percentageColumnRequired')}
                </TableHead>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('provisioningCriteria.fields.liabilityAccountRequired')}
                </TableHead>
                <TableHead className="px-2 py-3 whitespace-normal">
                  {t('provisioningCriteria.fields.expenseAccountRequired')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.categoryId}>
                  <TableCell className="px-2 py-3 font-medium">
                    {categoryLabel(r.categoryName)}
                  </TableCell>
                  {(
                    ['minAge', 'maxAge', 'provisioningPercentage'] as const
                  ).map(field => (
                    <TableCell key={field} className="px-2 py-3">
                      <Input
                        type="number"
                        min={0}
                        step={field === 'provisioningPercentage' ? 'any' : 1}
                        className="w-20"
                        aria-label={t(
                          'provisioningCriteria.fields.fieldForCategory',
                          {
                            field: t(FIELD_LABEL_KEYS[field]),
                            category: categoryLabel(r.categoryName),
                          }
                        )}
                        value={r[field]}
                        onChange={e => updateRow(i, field, e.target.value)}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="px-2 py-3">
                    {accountSelect(
                      i,
                      'liabilityAccount',
                      liabilityAccounts,
                      t('provisioningCriteria.fields.liabilityAccount')
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    {accountSelect(
                      i,
                      'expenseAccount',
                      expenseAccounts,
                      t('provisioningCriteria.fields.expenseAccount')
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(cancelPath)}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={submitting}
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CriteriaForm
