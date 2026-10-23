/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppSelect from '@/components/custom/select/AppSelect'
import NumberField from './NumberField'
import {
  toSelectOptions,
  type ChartForm,
  type ChartSlabForm,
  type FieldLabelKey,
  type FixedDepositStepProps,
} from '../fixed-deposit-product-form'

const formatRange = (from?: number, to?: number) => {
  if (from === undefined) return '—'
  return to === undefined ? `${from}+` : `${from} - ${to}`
}

const FixedDepositProductInterestRateChartStep = ({
  formData,
  onChange,
  template,
}: FixedDepositStepProps) => {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const periodTypeOptions = toSelectOptions(
    template?.chartTemplate?.periodTypes
  )
  const [slab, setSlab] = useState<ChartSlabForm>({})
  const [slabError, setSlabError] = useState<string | null>(null)

  const chart = formData.chart
  const setChart = (changes: Partial<ChartForm>) =>
    onChange({ ...formData, chart: { ...chart, ...changes } })

  const field = (name: FieldLabelKey) =>
    t(`createFixedDepositProduct.fields.${name}`)

  const validateSlab = (): string | null => {
    const required: [keyof ChartSlabForm, FieldLabelKey][] = [
      ['periodType', 'periodType'],
      ['fromPeriod', 'periodFrom'],
      ['annualInterestRate', 'annualInterestRate'],
      ['description', 'slabDescription'],
    ]
    if (chart.isPrimaryGroupingByAmount) {
      required.push(['amountRangeFrom', 'amountRangeFrom'])
    }
    const missing = required.find(([key]) => {
      const value = slab[key]
      return (
        value === undefined ||
        (typeof value === 'string' && value.trim() === '')
      )
    })
    if (missing) {
      return t('createFixedDepositProduct.validation.required', {
        field: field(missing[1]),
      })
    }
    const numeric: [keyof ChartSlabForm, FieldLabelKey][] = [
      ['fromPeriod', 'periodFrom'],
      ['toPeriod', 'periodTo'],
      ['amountRangeFrom', 'amountRangeFrom'],
      ['amountRangeTo', 'amountRangeTo'],
      ['annualInterestRate', 'annualInterestRate'],
    ]
    const invalid = numeric.find(([key]) => {
      const value = slab[key]
      return value !== undefined && !Number.isFinite(value)
    })
    if (invalid) {
      return t('createFixedDepositProduct.validation.invalidNumber', {
        field: field(invalid[1]),
      })
    }
    if (slab.toPeriod !== undefined && slab.toPeriod < (slab.fromPeriod ?? 0)) {
      return t('createFixedDepositProduct.validation.periodRange')
    }
    if (
      slab.amountRangeTo !== undefined &&
      slab.amountRangeTo < (slab.amountRangeFrom ?? 0)
    ) {
      return t('createFixedDepositProduct.validation.amountRange')
    }
    return null
  }

  const handleAddSlab = () => {
    const error = validateSlab()
    setSlabError(error)
    if (error) return
    setChart({
      chartSlabs: [
        ...chart.chartSlabs,
        { ...slab, description: slab.description?.trim() },
      ],
    })
    setSlab({ periodType: slab.periodType })
  }

  const handleRemoveSlab = (index: number) =>
    setChart({ chartSlabs: chart.chartSlabs.filter((_, i) => i !== index) })

  const periodName = (periodType?: number) =>
    periodTypeOptions.find(option => option.id === periodType?.toString())
      ?.name ?? ''

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-chart-name">{field('chartName')}</Label>
          <Input
            id="fd-chart-name"
            value={chart.name}
            onChange={e => setChart({ name: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-chart-description">
            {field('chartDescription')}
          </Label>
          <Input
            id="fd-chart-description"
            value={chart.description}
            onChange={e => setChart({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-chart-from-date">{field('fromDate')}*</Label>
          <Input
            id="fd-chart-from-date"
            type="date"
            value={chart.fromDate}
            onChange={e => setChart({ fromDate: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="fd-chart-end-date">{field('endDate')}</Label>
          <Input
            id="fd-chart-end-date"
            type="date"
            min={chart.fromDate || undefined}
            value={chart.endDate}
            onChange={e => setChart({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="fd-chart-grouping"
          checked={chart.isPrimaryGroupingByAmount}
          onCheckedChange={checked =>
            setChart({ isPrimaryGroupingByAmount: !!checked })
          }
        />
        <Label
          htmlFor="fd-chart-grouping"
          className="cursor-pointer font-normal"
        >
          {field('primaryGroupingByAmount')}
        </Label>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('createFixedDepositProduct.headings.slabs')}*
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppSelect
            selectLabel={`${field('periodType')}*`}
            selectPlaceholder={t('createFixedDepositProduct.select')}
            selectValue={slab.periodType?.toString() ?? ''}
            selectOnChange={value =>
              setSlab({ ...slab, periodType: Number(value) })
            }
            selectOptions={periodTypeOptions}
            selectClassname="space-y-2"
          />
          <NumberField
            id="fd-slab-from-period"
            label={`${field('periodFrom')}*`}
            className="space-y-2"
            value={slab.fromPeriod}
            onChange={fromPeriod => setSlab({ ...slab, fromPeriod })}
          />
          <NumberField
            id="fd-slab-to-period"
            label={field('periodTo')}
            className="space-y-2"
            value={slab.toPeriod}
            onChange={toPeriod => setSlab({ ...slab, toPeriod })}
          />
          <NumberField
            id="fd-slab-amount-from"
            label={
              chart.isPrimaryGroupingByAmount
                ? `${field('amountRangeFrom')}*`
                : field('amountRangeFrom')
            }
            className="space-y-2"
            step={0.01}
            value={slab.amountRangeFrom}
            onChange={amountRangeFrom => setSlab({ ...slab, amountRangeFrom })}
          />
          <NumberField
            id="fd-slab-amount-to"
            label={field('amountRangeTo')}
            className="space-y-2"
            step={0.01}
            value={slab.amountRangeTo}
            onChange={amountRangeTo => setSlab({ ...slab, amountRangeTo })}
          />
          <NumberField
            id="fd-slab-interest"
            label={`${field('annualInterestRate')}*`}
            className="space-y-2"
            step={0.01}
            value={slab.annualInterestRate}
            onChange={annualInterestRate =>
              setSlab({ ...slab, annualInterestRate })
            }
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="fd-slab-description">
              {field('slabDescription')}*
            </Label>
            <Input
              id="fd-slab-description"
              value={slab.description ?? ''}
              onChange={e => setSlab({ ...slab, description: e.target.value })}
            />
          </div>
          <Button type="button" variant="outline" onClick={handleAddSlab}>
            <Plus className="w-4 h-4 mr-1" />
            {t('createFixedDepositProduct.addSlab')}
          </Button>
        </div>
        {slabError && (
          <p role="alert" className="text-sm text-red-600">
            {slabError}
          </p>
        )}

        {chart.chartSlabs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('createFixedDepositProduct.noSlabs')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{field('period')}</TableHead>
                <TableHead>{field('amountRange')}</TableHead>
                <TableHead>{field('annualInterestRate')}</TableHead>
                <TableHead>{field('slabDescription')}</TableHead>
                <TableHead className="text-right">
                  {t('createFixedDepositProduct.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chart.chartSlabs.map((chartSlab, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {formatRange(chartSlab.fromPeriod, chartSlab.toPeriod)}{' '}
                    {periodName(chartSlab.periodType)}
                  </TableCell>
                  <TableCell>
                    {formatRange(
                      chartSlab.amountRangeFrom,
                      chartSlab.amountRangeTo
                    )}
                  </TableCell>
                  <TableCell>{chartSlab.annualInterestRate}%</TableCell>
                  <TableCell>{chartSlab.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={tc('actions.delete')}
                      onClick={() => handleRemoveSlab(index)}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default FixedDepositProductInterestRateChartStep
