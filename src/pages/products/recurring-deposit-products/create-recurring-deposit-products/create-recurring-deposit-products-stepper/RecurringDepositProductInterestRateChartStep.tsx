/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Plus, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  emptyChartSlab,
  toOptionalNumber,
  toSelectOptions,
  type ChartSlabForm,
  type FormUpdater,
  type InterestRateChartForm,
  type RecurringDepositProductForm,
  type RecurringDepositProductTemplate,
} from '../recurring-deposit-product-form'

interface RecurringDepositProductInterestRateChartStepProps {
  form: RecurringDepositProductForm
  update: FormUpdater
  template?: RecurringDepositProductTemplate
}

type SlabNumberKey = Exclude<keyof ChartSlabForm, 'description' | 'periodType'>

const RecurringDepositProductInterestRateChartStep = ({
  form,
  update,
  template,
}: RecurringDepositProductInterestRateChartStepProps) => {
  const { t } = useTranslation('products')
  const { chart } = form

  const periodTypeOptions = toSelectOptions(
    template?.chartTemplate?.periodTypes
  )

  const updateChart = (patch: Partial<InterestRateChartForm>) =>
    update({ chart: { ...chart, ...patch } })

  const updateSlab = (index: number, patch: Partial<ChartSlabForm>) =>
    updateChart({
      chartSlabs: chart.chartSlabs.map((slab, i) =>
        i === index ? { ...slab, ...patch } : slab
      ),
    })

  const removeSlab = (index: number) =>
    updateChart({ chartSlabs: chart.chartSlabs.filter((_, i) => i !== index) })

  const slabNumberFields: {
    key: SlabNumberKey
    label: string
    step: number
  }[] = [
    {
      key: 'fromPeriod',
      label: t('createRecurringDepositProduct.chart.fromPeriod'),
      step: 1,
    },
    {
      key: 'toPeriod',
      label: t('createRecurringDepositProduct.chart.toPeriod'),
      step: 1,
    },
    {
      key: 'amountRangeFrom',
      label: t('createRecurringDepositProduct.chart.amountRangeFrom'),
      step: 0.01,
    },
    {
      key: 'amountRangeTo',
      label: t('createRecurringDepositProduct.chart.amountRangeTo'),
      step: 0.01,
    },
    {
      key: 'annualInterestRate',
      label: t('createRecurringDepositProduct.chart.annualInterestRate'),
      step: 0.01,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-chart-name">
            {t('createRecurringDepositProduct.chart.name')}
          </Label>
          <Input
            id="rd-chart-name"
            maxLength={100}
            value={chart.name}
            onChange={e => updateChart({ name: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-chart-description">
            {t('createRecurringDepositProduct.chart.description')}
          </Label>
          <Input
            id="rd-chart-description"
            maxLength={500}
            value={chart.description}
            onChange={e => updateChart({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-chart-from-date">
            {t('createRecurringDepositProduct.chart.fromDate')}
          </Label>
          <Input
            id="rd-chart-from-date"
            type="date"
            value={chart.fromDate}
            onChange={e => updateChart({ fromDate: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-chart-end-date">
            {t('createRecurringDepositProduct.chart.endDate')}
          </Label>
          <Input
            id="rd-chart-end-date"
            type="date"
            min={chart.fromDate || undefined}
            value={chart.endDate}
            onChange={e => updateChart({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="rd-chart-grouping"
          checked={chart.isPrimaryGroupingByAmount}
          onCheckedChange={checked =>
            updateChart({ isPrimaryGroupingByAmount: checked === true })
          }
        />
        <Label
          htmlFor="rd-chart-grouping"
          className="cursor-pointer font-normal"
        >
          {t('createRecurringDepositProduct.chart.groupingByAmount')}
        </Label>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {t('createRecurringDepositProduct.chart.slabs')}
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              updateChart({
                chartSlabs: [...chart.chartSlabs, emptyChartSlab()],
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('createRecurringDepositProduct.chart.addSlab')}
          </Button>
        </div>

        {chart.chartSlabs.map((slab, index) => (
          <div
            key={index}
            className="rounded-md border p-4 flex flex-col gap-4 dark:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t('createRecurringDepositProduct.chart.slabNumber', {
                  number: index + 1,
                })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('createRecurringDepositProduct.chart.removeSlab')}
                disabled={chart.chartSlabs.length === 1}
                onClick={() => removeSlab(index)}
              >
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AppSelect
                selectLabel={t(
                  'createRecurringDepositProduct.chart.periodType'
                )}
                selectPlaceholder={t('createRecurringDepositProduct.select')}
                selectValue={slab.periodType?.toString() ?? ''}
                selectOnChange={val =>
                  updateSlab(index, { periodType: Number(val) })
                }
                selectOptions={periodTypeOptions}
                selectClassname="space-y-2"
              />
              {slabNumberFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`rd-slab-${index}-${field.key}`}>
                    {field.label}
                  </Label>
                  <Input
                    id={`rd-slab-${index}-${field.key}`}
                    type="number"
                    min={0}
                    step={field.step}
                    value={slab[field.key] ?? ''}
                    onChange={e =>
                      updateSlab(index, {
                        [field.key]: toOptionalNumber(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`rd-slab-${index}-description`}>
                {t('createRecurringDepositProduct.chart.slabDescription')}
              </Label>
              <Input
                id={`rd-slab-${index}-description`}
                maxLength={500}
                value={slab.description}
                onChange={e =>
                  updateSlab(index, { description: e.target.value })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecurringDepositProductInterestRateChartStep
