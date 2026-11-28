/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/date-utils'

import {
  formatMoney,
  isPendingOrRejected,
  toDateParts,
  useRecurringDepositAccount,
} from '../recurring-deposit-account'

type DetailRow = { label: string; value: string; amount?: boolean }

const DetailsTable = ({
  title,
  rows,
}: {
  title: string
  rows: (DetailRow | false | undefined)[]
}) => (
  <div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <div className="border rounded bg-white dark:bg-zinc-900">
      <Table>
        <TableBody>
          {rows
            .filter((row): row is DetailRow => !!row)
            .map(row => (
              <TableRow key={row.label}>
                <TableCell className="bg-zinc-100 dark:bg-zinc-800 w-1/2">
                  {row.label}
                </TableCell>
                <TableCell
                  className={row.amount ? 'text-right tabular-nums' : ''}
                >
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  </div>
)

const RecurringDepositGeneralTab = () => {
  const account = useRecurringDepositAccount()
  const { t, i18n } = useTranslation('clients')

  const money = (value?: number) =>
    formatMoney(value, account.currency, i18n.language)
  const date = (value?: number[] | string) =>
    formatDate(toDateParts(value), i18n.language)

  const summary = account.summary ?? {}
  const percent = (value?: number) =>
    value == null
      ? '—'
      : t('recurringDepositAccount.general.percent', { value })

  const amounts: DetailRow[] = [
    {
      label: t('recurringDepositAccount.general.recurringDepositAmount'),
      value: money(account.mandatoryRecommendedDepositAmount),
      amount: true,
    },
    {
      label: t('recurringDepositAccount.general.principalAmount'),
      value: money(account.depositAmount),
      amount: true,
    },
    {
      label: t('recurringDepositAccount.general.maturityAmount'),
      value: money(account.maturityAmount),
      amount: true,
    },
  ]

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="md:w-1/2 flex flex-col gap-6">
        <DetailsTable
          title={t('recurringDepositAccount.general.recurringDepositDetails')}
          rows={[
            {
              label: t('recurringDepositAccount.general.externalId'),
              value:
                account.externalId ||
                t('recurringDepositAccount.general.notAvailable'),
            },
            {
              label: t('recurringDepositAccount.general.activatedOn'),
              value: account.timeline?.activatedOnDate
                ? date(account.timeline.activatedOnDate)
                : t('recurringDepositAccount.general.notActivated'),
            },
            !!account.timeline?.closedOnDate && {
              label: t('recurringDepositAccount.general.closedOn'),
              value: date(account.timeline.closedOnDate),
            },
            {
              label: t('recurringDepositAccount.general.fieldOfficer'),
              value:
                account.fieldOfficerName ||
                t('recurringDepositAccount.general.unassigned'),
            },
            {
              label: t(
                'recurringDepositAccount.general.expectedFirstDepositOn'
              ),
              value: date(account.expectedFirstDepositOnDate),
            },
            {
              label: t('recurringDepositAccount.general.maturityDate'),
              value: date(account.maturityDate),
            },
            {
              label: t('recurringDepositAccount.general.depositPeriod'),
              value:
                `${account.depositPeriod ?? '—'} ${account.depositPeriodFrequency?.value ?? ''}`.trim(),
            },
            {
              label: t('recurringDepositAccount.general.depositFrequency'),
              value:
                account.recurringFrequency == null
                  ? '—'
                  : t('recurringDepositAccount.general.every', {
                      count: account.recurringFrequency,
                      unit: account.recurringFrequencyType?.value ?? '',
                    }).trim(),
            },
            account.minBalanceForInterestCalculation != null && {
              label: t('recurringDepositAccount.general.minBalanceForInterest'),
              value: money(account.minBalanceForInterestCalculation),
              amount: true,
            },
            !!account.withHoldTax && {
              label: t('recurringDepositAccount.general.taxGroup'),
              value: account.taxGroup?.name ?? '—',
            },
            !!account.onAccountClosure && {
              label: t('recurringDepositAccount.general.maturityInstructions'),
              value: account.onAccountClosure.value ?? '—',
            },
          ]}
        />

        <DetailsTable
          title={t('recurringDepositAccount.general.interestDetails')}
          rows={[
            {
              label: t('recurringDepositAccount.general.interestRate'),
              value: percent(account.nominalAnnualInterestRate),
            },
            {
              label: t(
                'recurringDepositAccount.general.interestCompoundingPeriod'
              ),
              value: account.interestCompoundingPeriodType?.value ?? '—',
            },
            {
              label: t('recurringDepositAccount.general.interestPostingPeriod'),
              value: account.interestPostingPeriodType?.value ?? '—',
            },
            {
              label: t(
                'recurringDepositAccount.general.interestCalculatedUsing'
              ),
              value: account.interestCalculationType?.value ?? '—',
            },
            {
              label: t('recurringDepositAccount.general.daysInYear'),
              value: account.interestCalculationDaysInYearType?.value ?? '—',
            },
            !!account.preClosurePenalApplicable && {
              label: t('recurringDepositAccount.general.preClosurePenal'),
              value:
                `${percent(account.preClosurePenalInterest)} ${account.preClosurePenalInterestOnType?.value ?? ''}`.trim(),
            },
          ]}
        />
      </div>

      <div className="md:w-1/2">
        {isPendingOrRejected(account) ? (
          <DetailsTable
            title={t('recurringDepositAccount.general.otherDetails')}
            rows={amounts}
          />
        ) : (
          <DetailsTable
            title={t('recurringDepositAccount.general.performanceHistory')}
            rows={[
              ...amounts,
              !!summary.totalDeposits && {
                label: t('recurringDepositAccount.general.totalDeposits'),
                value: money(summary.totalDeposits),
                amount: true,
              },
              !!summary.totalWithdrawals && {
                label: t('recurringDepositAccount.general.totalWithdrawals'),
                value: money(summary.totalWithdrawals),
                amount: true,
              },
              (summary.totalInterestEarned ?? -1) >= 0 && {
                label: t('recurringDepositAccount.general.totalInterestEarned'),
                value: money(summary.totalInterestEarned),
                amount: true,
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}

export default RecurringDepositGeneralTab
