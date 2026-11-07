/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SavingsAccountTransactionsApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const savingsTransactionsApi = new SavingsAccountTransactionsApi(
  getConfiguration()
)

type PaymentType = { id: number; name: string }

type TransactionTemplate = {
  date?: number[]
  currency?: { code?: string }
  paymentTypeOptions?: Array<{ id?: number; name?: string }>
}

const SavingsAccountTransactions = () => {
  const breadcrumbs = useAccountBreadcrumbs()
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()
  // The Deposit and Withdrawal routes share this page.
  const isWithdrawal = useLocation().pathname.endsWith('/Withdrawal')
  const command = isWithdrawal ? 'withdrawal' : 'deposit'

  // Defaults to today until the template returns the business date.
  const [transactionDate, setTransactionDate] = useState(todayInputValue())
  const [amount, setAmount] = useState('')
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [note, setNote] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)

  // extra details
  const [accountNumber, setAccountNumber] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [routingCode, setRoutingCode] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [bankNumber, setBankNumber] = useState('')

  const [currencyCode, setCurrencyCode] = useState('')
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // date, currency and payment types from the transaction template, as the Angular web app does
  useEffect(() => {
    if (!accountId) return
    savingsTransactionsApi
      .retrieveTemplate19(Number(accountId))
      .then(res => {
        const tpl = (res.data ?? {}) as unknown as TransactionTemplate
        const date = dateArrayToInputValue(tpl.date)
        if (date) setTransactionDate(date)
        setCurrencyCode(tpl.currency?.code ?? '')
        setPaymentTypes(
          (tpl.paymentTypeOptions ?? []).map(p => ({
            id: p.id ?? 0,
            name: p.name ?? '',
          }))
        )
      })
      .catch(e => console.error('savings transaction template failed', e))
  }, [accountId])

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`)
    } else {
      navigate(-1)
    }
  }

  const onSubmit = async () => {
    if (!accountId) return

    setSaving(true)
    setError(null)
    try {
      await savingsTransactionsApi.transaction2(
        Number(accountId),
        {
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
          transactionDate,
          transactionAmount: Number(amount),
          paymentTypeId: Number(paymentTypeId),
          note: note || undefined,
          ...(showPaymentDetails && {
            accountNumber: accountNumber || undefined,
            checkNumber: checkNumber || undefined,
            routingCode: routingCode || undefined,
            receiptNumber: receiptNumber || undefined,
            bankNumber: bankNumber || undefined,
          }),
        } as Record<string, unknown>,
        command
      )
      backToAccount()
    } catch (e) {
      console.error(`${command} failed`, e)
      setError(
        datatableErrorMessage(e) ??
          `${isWithdrawal ? 'Withdrawal' : 'Deposit'} failed. Please try again.`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* Form card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            {isWithdrawal
              ? 'Withdraw Money From Saving Account'
              : 'Deposit Money To Saving Account'}
          </h2>

          <div className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label>Transaction Date*</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={e => {
                  setTransactionDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Transaction Amount*</Label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-700 text-sm">
                  {currencyCode}
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value)
                    setError(null)
                  }}
                />
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Payment Type*</Label>
              <AppSelect
                selectLabel=""
                selectValue={paymentTypeId}
                selectOnChange={value => {
                  setPaymentTypeId(value)
                  setError(null)
                }}
                selectPlaceholder="Select payment type"
                selectOptions={paymentTypes}
                selectClassname="w-full"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="toggle-details"
                checked={showPaymentDetails}
                onChange={e => setShowPaymentDetails(e.target.checked)}
              />
              <Label
                htmlFor="toggle-details"
                className={showPaymentDetails ? 'text-rose-500' : ''}
              >
                Show Payment Details
              </Label>
            </div>

            {/* Payment details */}
            {showPaymentDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account #</Label>
                  <Input
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cheque #</Label>
                  <Input
                    value={checkNumber}
                    onChange={e => setCheckNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Routing Code</Label>
                  <Input
                    value={routingCode}
                    onChange={e => setRoutingCode(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Receipt #</Label>
                  <Input
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bank #</Label>
                  <Input
                    value={bankNumber}
                    onChange={e => setBankNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToAccount}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={
                  !transactionDate ||
                  !(Number(amount) > 0) ||
                  !paymentTypeId ||
                  saving
                }
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavingsAccountTransactions
