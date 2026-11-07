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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { LoanTransactionsApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { useBusinessDateState } from '@/lib/business-date'
import { getConfiguration } from '@/lib/fineract-openapi'

const loanTransactionsApi = new LoanTransactionsApi(getConfiguration())

const Foreclosure = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Foreclosure' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // form state
  // Defaults to the business date, like the Angular web app.
  const [transactionDate, setTransactionDate] = useBusinessDateState()
  const [principal, setPrincipal] = useState('')
  const [interest, setInterest] = useState('')
  const [feeAmount, setFeeAmount] = useState('')
  const [penaltyAmount, setPenaltyAmount] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // amounts, currency and payment types from the foreclosure template for the chosen date,
  // as the Angular web app does
  useEffect(() => {
    if (!loanId || !transactionDate) return
    loanTransactionsApi
      .retrieveTransactionTemplate(
        Number(loanId),
        'foreclosure',
        'yyyy-MM-dd',
        transactionDate as unknown as object,
        'en'
      )
      .then(res => {
        const tpl = res.data ?? {}
        setPrincipal(String(tpl.principalPortion ?? ''))
        setInterest(String(tpl.interestPortion ?? ''))
        setFeeAmount(String(tpl.feeChargesPortion ?? ''))
        setPenaltyAmount(String(tpl.penaltyChargesPortion ?? ''))
        setTransactionAmount(tpl.amount != null ? String(tpl.amount) : '')
      })
      .catch(e => console.error('foreclosure template failed', e))
  }, [loanId, transactionDate])

  // simple validation
  const canSubmit =
    Boolean(transactionDate) &&
    transactionAmount !== '' &&
    note.trim().length > 0

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !loanId) return

    setSaving(true)
    setError(null)
    try {
      // Fineract works out the amounts itself, as in the Angular web app.
      await loanTransactionsApi.executeLoanTransaction(
        Number(loanId),
        {
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
          transactionDate,
          note,
        } as Record<string, unknown>,
        'foreclosure'
      )
      navigate(-1)
    } catch (e) {
      console.error('foreclosure failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Foreclosure failed. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Foreclosure</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* transaction date */}
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

          {/* principal */}
          <div className="space-y-2">
            <Label>Principal</Label>
            <Input value={principal} readOnly />
          </div>

          {/* interest */}
          <div className="space-y-2">
            <Label>Interest</Label>
            <Input value={interest} readOnly />
          </div>

          {/* fee amount */}
          <div className="space-y-2">
            <Label>Fee Amount</Label>
            <Input value={feeAmount} readOnly />
          </div>

          {/* penalty amount */}
          <div className="space-y-2">
            <Label>Penalty Amount</Label>
            <Input value={penaltyAmount} readOnly />
          </div>

          {/* transaction amount */}
          <div className="space-y-2">
            <Label>Transaction Amount*</Label>
            <Input value={transactionAmount} readOnly />
          </div>

          {/* note */}
          <div className="space-y-2">
            <Label>Note*</Label>
            <textarea
              value={note}
              onChange={e => {
                setNote(e.target.value)
                setError(null)
              }}
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* actions */}
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
              Foreclosure
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Foreclosure
