/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
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
import type { RecurringDepositAccountStepProps } from '../recurring-deposit-account-form'

/** The product's interest rate chart, which the account is opened with */
const RecurringDepositAccountInterestRateChartStep = ({
  productTemplate,
}: RecurringDepositAccountStepProps) => {
  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const [expandedSlab, setExpandedSlab] = useState<number | null>(null)
  const chart = productTemplate?.accountChart

  if (!chart) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('recurringDepositApplication.noChart')}
      </p>
    )
  }

  const range = (from?: number, to?: number) =>
    from === undefined && to === undefined
      ? '—'
      : `${from ?? ''} - ${to ?? ''}`.trim()

  const details: [string, string | undefined][] = [
    [t('recurringDepositApplication.fields.name'), chart.name],
    [
      t('recurringDepositApplication.fields.validFrom'),
      formatDate(chart.fromDate, i18n.language),
    ],
    [
      t('recurringDepositApplication.fields.endDate'),
      chart.endDate ? formatDate(chart.endDate, i18n.language) : undefined,
    ],
    [t('recurringDepositApplication.fields.description'), chart.description],
    [
      t('recurringDepositApplication.fields.primaryGroupingByAmount'),
      chart.isPrimaryGroupingByAmount ? tc('actions.yes') : tc('actions.no'),
    ],
  ]
  const slabs = chart.chartSlabs ?? []

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="font-medium">{label}:</dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
      </dl>

      {slabs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('recurringDepositApplication.noSlabs')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('recurringDepositApplication.fields.period')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.amountRange')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.interest')}
              </TableHead>
              <TableHead>
                {t('recurringDepositApplication.fields.description')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositApplication.fields.incentives')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slabs.map((slab, index) => (
              <Fragment key={index}>
                <TableRow>
                  <TableCell>
                    {range(slab.fromPeriod, slab.toPeriod)}{' '}
                    {slab.periodType?.value}
                  </TableCell>
                  <TableCell>
                    {range(slab.amountRangeFrom, slab.amountRangeTo)}
                  </TableCell>
                  <TableCell>{slab.annualInterestRate}%</TableCell>
                  <TableCell>{slab.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedSlab(expandedSlab === index ? null : index)
                      }
                    >
                      {expandedSlab === index ? (
                        <EyeOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      {expandedSlab === index
                        ? t('recurringDepositApplication.hideIncentives')
                        : t('recurringDepositApplication.viewIncentives')}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedSlab === index && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/30">
                      {(slab.incentives ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('recurringDepositApplication.noIncentives')}
                        </p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {slab.incentives?.map((incentive, i) => (
                            <li key={i}>
                              {[
                                incentive.entityType?.value,
                                incentive.attributeName?.value,
                                incentive.conditionType?.value,
                                incentive.attributeValue,
                                incentive.incentiveType?.value,
                                incentive.amount,
                              ]
                                .filter(
                                  part => part !== undefined && part !== ''
                                )
                                .join(' · ')}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default RecurringDepositAccountInterestRateChartStep
