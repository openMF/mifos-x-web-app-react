/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
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
  formatMoney,
  toDateParts,
  useFixedDepositAccount,
} from '../fixed-deposit-account'

const FixedDepositChargesTab = () => {
  const account = useFixedDepositAccount()
  const { t, i18n } = useTranslation('clients')
  const [showInactive, setShowInactive] = useState(false)

  const money = (value?: number) =>
    formatMoney(value, account.currency, i18n.language)

  // Fineract leaves isActive out on older versions; treat that as active
  const charges = (account.charges ?? []).filter(
    charge => (charge.isActive !== false) !== showInactive
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">
          {showInactive
            ? t('fixedDepositAccount.charges.inactiveHeading')
            : t('fixedDepositAccount.charges.heading')}
        </h3>
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive
            ? t('fixedDepositAccount.charges.viewActive')
            : t('fixedDepositAccount.charges.viewInactive')}
        </Button>
      </div>

      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fixedDepositAccount.charges.name')}</TableHead>
              <TableHead>
                {t('fixedDepositAccount.charges.feeOrPenalty')}
              </TableHead>
              <TableHead>
                {t('fixedDepositAccount.charges.paymentDueAt')}
              </TableHead>
              <TableHead>{t('fixedDepositAccount.charges.dueAsOf')}</TableHead>
              <TableHead>
                {t('fixedDepositAccount.charges.calculationType')}
              </TableHead>
              <TableHead className="text-right">
                {t('fixedDepositAccount.charges.due')}
              </TableHead>
              <TableHead className="text-right">
                {t('fixedDepositAccount.charges.paid')}
              </TableHead>
              <TableHead className="text-right">
                {t('fixedDepositAccount.charges.waived')}
              </TableHead>
              <TableHead className="text-right">
                {t('fixedDepositAccount.charges.outstanding')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.map(charge => (
              <TableRow key={charge.id}>
                <TableCell>{charge.name ?? '—'}</TableCell>
                <TableCell>
                  {charge.penalty
                    ? t('fixedDepositAccount.charges.penalty')
                    : t('fixedDepositAccount.charges.fee')}
                </TableCell>
                <TableCell>{charge.chargeTimeType?.value ?? '—'}</TableCell>
                <TableCell>
                  {formatDate(toDateParts(charge.dueDate), i18n.language)}
                </TableCell>
                <TableCell>
                  {charge.chargeCalculationType?.value ?? '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(charge.amount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(charge.amountPaid)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(charge.amountWaived)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(charge.amountOutstanding)}
                </TableCell>
              </TableRow>
            ))}
            {charges.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-6 text-center text-zinc-500"
                >
                  {showInactive
                    ? t('fixedDepositAccount.charges.noInactive')
                    : t('fixedDepositAccount.charges.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default FixedDepositChargesTab
