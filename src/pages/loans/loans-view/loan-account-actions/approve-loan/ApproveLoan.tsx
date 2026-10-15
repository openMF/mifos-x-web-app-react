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
import { LoansApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { dateArrayToInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const loansApi = new LoansApi(getConfiguration())

type ApprovalTemplate = {
  approvalDate?: number[]
  approvalAmount?: number
  expectedDisbursementDate?: number[]
  currency?: { code?: string }
}

const ApproveLoan = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Approve' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // form state
  const [approvedOn, setApprovedOn] = useState('')
  const [expectedDisbursementOn, setExpectedDisbursementOn] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [approvedAmountDisplay, setApprovedAmountDisplay] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pre-fill from the approval template, as the Angular web app does
  useEffect(() => {
    if (!loanId) return
    loansApi
      .retrieveApprovalTemplate(Number(loanId), 'approval')
      .then(res => {
        const tpl = (res.data ?? {}) as ApprovalTemplate
        // Only fill fields the user has not already typed into.
        setApprovedOn(prev => prev || dateArrayToInputValue(tpl.approvalDate))
        setExpectedDisbursementOn(
          prev => prev || dateArrayToInputValue(tpl.expectedDisbursementDate)
        )
        setCurrencyCode(tpl.currency?.code ?? '')
        if (tpl.approvalAmount != null) {
          const amount = String(tpl.approvalAmount)
          setApprovedAmountDisplay(amount)
          setTransactionAmount(prev => prev || amount)
        }
      })
      .catch(e => console.error('approval template failed', e))
  }, [loanId])

  // validation
  const canSubmit = approvedOn && transactionAmount

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !loanId) return

    const payload: Record<string, unknown> = {
      locale: 'en',
      dateFormat: 'yyyy-MM-dd',
      approvedOnDate: approvedOn,
      approvedLoanAmount: Number(transactionAmount),
      note: note || undefined,
    }
    if (expectedDisbursementOn) {
      payload.expectedDisbursementDate = expectedDisbursementOn
    }

    setSaving(true)
    setError(null)
    try {
      await loansApi.stateTransitions(Number(loanId), payload, 'approve')
      navigate(-1)
    } catch (e) {
      console.error('approve failed', e)
      setError(datatableErrorMessage(e) ?? 'Approval failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold mb-6">Approve</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* approved on */}
          <div className="w-full space-y-2">
            <Label>Approved On*</Label>
            <Input
              type="date"
              value={approvedOn}
              onChange={e => {
                setApprovedOn(e.target.value)
                setError(null)
              }}
            />
          </div>

          {/* expected disbursement */}
          <div className="w-full space-y-2">
            <Label>Expected disbursement on</Label>
            <Input
              type="date"
              value={expectedDisbursementOn}
              onChange={e => {
                setExpectedDisbursementOn(e.target.value)
                setError(null)
              }}
            />
          </div>

          {/* approved amount */}
          <div className="w-full space-y-2">
            <Label>Approved Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input value={approvedAmountDisplay} readOnly />
            </div>
          </div>

          {/* transaction amount */}
          <div className="w-full space-y-2">
            <Label>Transaction Amount*</Label>
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

          {/* note */}
          <div className="w-full space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* actions */}
          <div className="flex gap-4 pt-4">
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

export default ApproveLoan
