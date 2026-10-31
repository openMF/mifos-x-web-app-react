/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/date-utils'

import {
  type ChartSlab,
  toDateParts,
  useRecurringDepositAccount,
} from '../recurring-deposit-account'

const RecurringDepositInterestRateChartTab = () => {
  const account = useRecurringDepositAccount()
  const { t, i18n } = useTranslation('clients')
  const [expanded, setExpanded] = useState<number | null>(null)

  const chart = account.accountChart
  const slabs = chart?.chartSlabs ?? []

  const number = (value: number) =>
    new Intl.NumberFormat(i18n.language).format(value)

  const period = (slab: ChartSlab) => {
    if (slab.fromPeriod == null) return '—'
    const unit = slab.periodType?.value ?? ''
    return slab.toPeriod == null
      ? t('recurringDepositAccount.chart.periodFrom', {
          from: slab.fromPeriod,
          unit,
        })
      : t('recurringDepositAccount.chart.periodRange', {
          from: slab.fromPeriod,
          to: slab.toPeriod,
          unit,
        })
  }

  const amountRange = (slab: ChartSlab) => {
    if (slab.amountRangeFrom == null) return '—'
    return slab.amountRangeTo == null
      ? t('recurringDepositAccount.chart.amountFrom', {
          from: number(slab.amountRangeFrom),
        })
      : t('recurringDepositAccount.chart.amountRange', {
          from: number(slab.amountRangeFrom),
          to: number(slab.amountRangeTo),
        })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {t('recurringDepositAccount.chart.heading')}
        </h3>
        {chart?.fromDate && (
          <p className="text-sm text-zinc-500">
            {chart.endDate
              ? t('recurringDepositAccount.chart.validRange', {
                  from: formatDate(toDateParts(chart.fromDate), i18n.language),
                  till: formatDate(toDateParts(chart.endDate), i18n.language),
                })
              : t('recurringDepositAccount.chart.validFrom', {
                  from: formatDate(toDateParts(chart.fromDate), i18n.language),
                })}
          </p>
        )}
      </div>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recurringDepositAccount.chart.period')}</TableHead>
              <TableHead>
                {t('recurringDepositAccount.chart.amountRangeColumn')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositAccount.chart.interest')}
              </TableHead>
              <TableHead>
                {t('recurringDepositAccount.chart.description')}
              </TableHead>
              <TableHead>
                {t('recurringDepositAccount.chart.incentives')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slabs.map((slab, index) => (
              <Fragment key={slab.id ?? index}>
                <TableRow>
                  <TableCell>{period(slab)}</TableCell>
                  <TableCell>{amountRange(slab)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {slab.annualInterestRate == null
                      ? '—'
                      : `${slab.annualInterestRate} %`}
                  </TableCell>
                  <TableCell>{slab.description || '—'}</TableCell>
                  <TableCell>
                    {slab.incentives?.length ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpanded(expanded === index ? null : index)
                        }
                      >
                        {expanded === index
                          ? t('recurringDepositAccount.chart.hideIncentives')
                          : t('recurringDepositAccount.chart.viewIncentives')}
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
                {expanded === index && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="bg-zinc-50 dark:bg-zinc-800"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t('recurringDepositAccount.chart.entityType')}
                            </TableHead>
                            <TableHead>
                              {t('recurringDepositAccount.chart.attributeName')}
                            </TableHead>
                            <TableHead>
                              {t('recurringDepositAccount.chart.conditionType')}
                            </TableHead>
                            <TableHead>
                              {t(
                                'recurringDepositAccount.chart.attributeValue'
                              )}
                            </TableHead>
                            <TableHead>
                              {t('recurringDepositAccount.chart.incentiveType')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('recurringDepositAccount.chart.amount')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slab.incentives?.map((incentive, i) => (
                            <TableRow key={incentive.id ?? i}>
                              <TableCell>
                                {incentive.entityType?.value ?? '—'}
                              </TableCell>
                              <TableCell>
                                {incentive.attributeName?.value ?? '—'}
                              </TableCell>
                              <TableCell>
                                {incentive.conditionType?.value ?? '—'}
                              </TableCell>
                              <TableCell>
                                {incentive.attributeValue ?? '—'}
                              </TableCell>
                              <TableCell>
                                {incentive.incentiveType?.value ?? '—'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {incentive.amount ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {slabs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-zinc-500"
                >
                  {t('recurringDepositAccount.chart.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RecurringDepositInterestRateChartTab
