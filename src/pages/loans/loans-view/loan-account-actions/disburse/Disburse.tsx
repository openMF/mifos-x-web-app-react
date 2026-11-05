/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { LoanTransactionsApi, LoansApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { useBusinessDateState } from '@/lib/business-date'
import { getConfiguration } from '@/lib/fineract-openapi'

const loansApi = new LoansApi(getConfiguration())
const loanTransactionsApi = new LoanTransactionsApi(getConfiguration())

type PaymentType = { id: number; name: string }

const Disburse = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Disburse' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // Defaults to the business date, like the Angular web app.
  const [disbursedOn, setDisbursedOn] = useBusinessDateState()
  const [currencyCode, setCurrencyCode] = useState('')
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [externalId, setExternalId] = useState('')
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)

  const [accountNumber, setAccountNumber] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [routingCode, setRoutingCode] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [bankNumber, setBankNumber] = useState('')
  const [note, setNote] = useState('')

  // pre-fill the amount, currency and payment types from the disbursement template
  useEffect(() => {
    if (!loanId) return
    loanTransactionsApi
      .retrieveTransactionTemplate(Number(loanId), 'disburse')
      .then(res => {
        const tpl = res.data ?? {}
        setCurrencyCode(tpl.currency?.code ?? '')
        // Only fill the amount if the user has not already typed one.
        if (tpl.amount != null)
          setTransactionAmount(prev => prev || String(tpl.amount))
        setPaymentTypes(
          (tpl.paymentTypeOptions ?? []).map(p => ({
            id: p.id ?? 0,
            name: p.name ?? '',
          }))
        )
      })
      .catch(e => console.error('disbursement template failed', e))
  }, [loanId])

  const canSubmit = Boolean(disbursedOn && Number(transactionAmount) > 0)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !loanId) return
    setSaving(true)
    setError(null)
    try {
      await loansApi.stateTransitions(
        Number(loanId),
        {
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
          actualDisbursementDate: disbursedOn,
          transactionAmount: Number(transactionAmount),
          externalId: externalId || undefined,
          paymentTypeId: paymentTypeId ? Number(paymentTypeId) : undefined,
          note: note || undefined,
          ...(showPaymentDetails && {
            accountNumber: accountNumber || undefined,
            checkNumber: checkNumber || undefined,
            routingCode: routingCode || undefined,
            receiptNumber: receiptNumber || undefined,
            bankNumber: bankNumber || undefined,
          }),
        } as Record<string, unknown>,
        'disburse'
      )
      navigate(-1)
    } catch (e) {
      console.error('disburse failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Disbursement failed. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs items={breadcrumbs} />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Disburse</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Disbursed On */}
          <div className="w-full space-y-2">
            <Label>Disbursed On*</Label>
            <Input
              type="date"
              value={disbursedOn}
              onChange={e => {
                setDisbursedOn(e.target.value)
                setError(null)
              }}
            />
          </div>

          {/* Transaction Amount */}
          <div className="w-full space-y-2">
            <Label>Transaction Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input
                type="number"
                value={transactionAmount}
                onChange={e => {
                  setTransactionAmount(e.target.value)
                  setError(null)
                }}
                min="0"
                step="0.01"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {/* External Id */}
          <div className="w-full space-y-2">
            <Label>External Id</Label>
            <Input
              value={externalId}
              onChange={e => setExternalId(e.target.value)}
              placeholder=""
            />
          </div>

          {/* Payment Type */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Payment Type"
              selectPlaceholder="Select payment type"
              selectValue={paymentTypeId}
              selectOnChange={setPaymentTypeId}
              selectOptions={paymentTypes}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* Show Payment Details toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={showPaymentDetails}
              onCheckedChange={v => setShowPaymentDetails(Boolean(v))}
            />
            <span className="text-sm font-medium">Show Payment Details</span>
          </div>

          {showPaymentDetails && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Account #</Label>
                <Input
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cheque #</Label>
                <Input
                  value={checkNumber}
                  onChange={e => setCheckNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Routing Code</Label>
                <Input
                  value={routingCode}
                  onChange={e => setRoutingCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Receipt #</Label>
                <Input
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank #</Label>
                <Input
                  value={bankNumber}
                  onChange={e => setBankNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Note */}
          <div className="w-full space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || saving}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Disburse
