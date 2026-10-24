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
  useFixedDepositAccount,
} from '../fixed-deposit-account'

const FixedDepositInterestRateChartTab = () => {
  const account = useFixedDepositAccount()
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
      ? t('fixedDepositAccount.chart.periodFrom', {
          from: slab.fromPeriod,
          unit,
        })
      : t('fixedDepositAccount.chart.periodRange', {
          from: slab.fromPeriod,
          to: slab.toPeriod,
          unit,
        })
  }

  const amountRange = (slab: ChartSlab) => {
    if (slab.amountRangeFrom == null) return '—'
    return slab.amountRangeTo == null
      ? t('fixedDepositAccount.chart.amountFrom', {
          from: number(slab.amountRangeFrom),
        })
      : t('fixedDepositAccount.chart.amountRange', {
          from: number(slab.amountRangeFrom),
          to: number(slab.amountRangeTo),
        })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {t('fixedDepositAccount.chart.heading')}
        </h3>
        {chart?.fromDate && (
          <p className="text-sm text-zinc-500">
            {chart.endDate
              ? t('fixedDepositAccount.chart.validRange', {
                  from: formatDate(toDateParts(chart.fromDate), i18n.language),
                  till: formatDate(toDateParts(chart.endDate), i18n.language),
                })
              : t('fixedDepositAccount.chart.validFrom', {
                  from: formatDate(toDateParts(chart.fromDate), i18n.language),
                })}
          </p>
        )}
      </div>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fixedDepositAccount.chart.period')}</TableHead>
              <TableHead>
                {t('fixedDepositAccount.chart.amountRangeColumn')}
              </TableHead>
              <TableHead className="text-right">
                {t('fixedDepositAccount.chart.interest')}
              </TableHead>
              <TableHead>
                {t('fixedDepositAccount.chart.description')}
              </TableHead>
              <TableHead>{t('fixedDepositAccount.chart.incentives')}</TableHead>
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
                          ? t('fixedDepositAccount.chart.hideIncentives')
                          : t('fixedDepositAccount.chart.viewIncentives')}
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
                              {t('fixedDepositAccount.chart.entityType')}
                            </TableHead>
                            <TableHead>
                              {t('fixedDepositAccount.chart.attributeName')}
                            </TableHead>
                            <TableHead>
                              {t('fixedDepositAccount.chart.conditionType')}
                            </TableHead>
                            <TableHead>
                              {t('fixedDepositAccount.chart.attributeValue')}
                            </TableHead>
                            <TableHead>
                              {t('fixedDepositAccount.chart.incentiveType')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('fixedDepositAccount.chart.amount')}
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
                  {t('fixedDepositAccount.chart.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default FixedDepositInterestRateChartTab
