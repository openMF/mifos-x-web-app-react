/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StandingInstructionsApi } from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

import {
  type EnumOption,
  type FineractDate,
  formatMoney,
  toDateParts,
  useRecurringDepositAccount,
} from '../recurring-deposit-account'

const standingInstructionsApi = new StandingInstructionsApi(getConfiguration())

/** Fineract's account type id for savings, which recurring deposits are. */
const SAVINGS_ACCOUNT_TYPE = 2

/**
 * The generated GetPageItemsStandingInstructionSwagger type leaves out most of
 * the fields Fineract returns, so the rows are typed locally.
 */
type StandingInstruction = {
  id: number
  name?: string
  toClient?: { displayName?: string }
  toAccount?: { accountNo?: string }
  toAccountType?: EnumOption
  instructionType?: EnumOption
  amount?: number
  validFrom?: FineractDate
  validTill?: FineractDate
  status?: EnumOption
}

/** Standing instructions that transfer money out of this account. */
const RecurringDepositStandingInstructionsTab = () => {
  const account = useRecurringDepositAccount()
  const { t, i18n } = useTranslation('clients')

  const [instructions, setInstructions] = useState<StandingInstruction[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    standingInstructionsApi
      .retrieveAll19(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        account.clientId,
        account.id,
        SAVINGS_ACCOUNT_TYPE
      )
      .then(res => {
        if (cancelled) return
        const pageItems = (res.data.pageItems ??
          []) as unknown as StandingInstruction[]
        setInstructions(Array.from(pageItems))
      })
      .catch(err => {
        if (cancelled) return
        console.error('Failed to fetch standing instructions', err)
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [account.clientId, account.id])

  const date = (value?: FineractDate) =>
    formatDate(toDateParts(value), i18n.language)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {t('recurringDepositAccount.standingInstructions.heading')}
      </h3>

      {loading ? (
        <p className="text-sm text-zinc-500">
          {t('recurringDepositAccount.standingInstructions.loading')}
        </p>
      ) : failed ? (
        <p className="text-sm text-red-600">
          {t('recurringDepositAccount.standingInstructions.failedLoad')}
        </p>
      ) : (
        <div className="border rounded bg-white dark:bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('recurringDepositAccount.standingInstructions.name')}
                </TableHead>
                <TableHead>
                  {t(
                    'recurringDepositAccount.standingInstructions.beneficiary'
                  )}
                </TableHead>
                <TableHead>
                  {t('recurringDepositAccount.standingInstructions.toAccount')}
                </TableHead>
                <TableHead>
                  {t('recurringDepositAccount.standingInstructions.amount')}
                </TableHead>
                <TableHead>
                  {t('recurringDepositAccount.standingInstructions.validity')}
                </TableHead>
                <TableHead>
                  {t('recurringDepositAccount.standingInstructions.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map(instruction => (
                <TableRow key={instruction.id}>
                  <TableCell>{instruction.name || '—'}</TableCell>
                  <TableCell>
                    {instruction.toClient?.displayName || '—'}
                  </TableCell>
                  <TableCell>
                    {instruction.toAccount?.accountNo
                      ? `${instruction.toAccount.accountNo}${
                          instruction.toAccountType?.value
                            ? ` (${instruction.toAccountType.value})`
                            : ''
                        }`
                      : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {instruction.instructionType?.value
                      ? `${instruction.instructionType.value}: `
                      : ''}
                    {formatMoney(
                      instruction.amount,
                      account.currency,
                      i18n.language
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      'recurringDepositAccount.standingInstructions.validityRange',
                      {
                        from: date(instruction.validFrom),
                        till: date(instruction.validTill),
                      }
                    )}
                  </TableCell>
                  <TableCell>{instruction.status?.value || '—'}</TableCell>
                </TableRow>
              ))}
              {instructions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-zinc-500"
                  >
                    {t('recurringDepositAccount.standingInstructions.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default RecurringDepositStandingInstructionsTab
