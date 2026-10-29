/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  type DepositTransaction,
  formatMoney,
  toDateParts,
  useRecurringDepositAccount,
} from '../recurring-deposit-account'

// Older Fineract versions send no entryType, so go by the type flags
const isDebit = ({ transactionType: type }: DepositTransaction) =>
  !!(
    type?.withdrawal ||
    type?.feeDeduction ||
    type?.overdraftInterest ||
    type?.withholdTax
  )

const RecurringDepositTransactionsTab = () => {
  const account = useRecurringDepositAccount()
  const { t, i18n } = useTranslation('clients')
  const [hideReversed, setHideReversed] = useState(false)
  const [hideAccruals, setHideAccruals] = useState(false)

  const money = (value?: number) =>
    formatMoney(value, account.currency, i18n.language)

  const transactions = (account.transactions ?? []).filter(
    tx =>
      !(hideReversed && tx.reversed) &&
      !(hideAccruals && tx.transactionType?.accrual)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">
          {t('recurringDepositAccount.transactions.heading')}
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="rd-hide-reversed"
              checked={hideReversed}
              onCheckedChange={checked => setHideReversed(checked === true)}
            />
            <Label htmlFor="rd-hide-reversed">
              {t('recurringDepositAccount.transactions.hideReversed')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rd-hide-accruals"
              checked={hideAccruals}
              onCheckedChange={checked => setHideAccruals(checked === true)}
            />
            <Label htmlFor="rd-hide-accruals">
              {t('recurringDepositAccount.transactions.hideAccruals')}
            </Label>
          </div>
        </div>
      </div>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t('recurringDepositAccount.transactions.id')}
              </TableHead>
              <TableHead>
                {t('recurringDepositAccount.transactions.date')}
              </TableHead>
              <TableHead>
                {t('recurringDepositAccount.transactions.type')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositAccount.transactions.debit')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositAccount.transactions.credit')}
              </TableHead>
              <TableHead className="text-right">
                {t('recurringDepositAccount.transactions.balance')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow
                key={tx.id}
                className={tx.reversed ? 'line-through text-zinc-400' : ''}
              >
                <TableCell>{tx.id}</TableCell>
                <TableCell>
                  {formatDate(toDateParts(tx.date), i18n.language)}
                </TableCell>
                <TableCell>{tx.transactionType?.value ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {isDebit(tx) ? money(tx.amount) : ''}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {isDebit(tx) ? '' : money(tx.amount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {tx.reversed ? '' : money(tx.runningBalance)}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-zinc-500"
                >
                  {t('recurringDepositAccount.transactions.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RecurringDepositTransactionsTab
