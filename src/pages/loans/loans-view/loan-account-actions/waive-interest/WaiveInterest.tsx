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
import { dateArrayToInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const loanTransactionsApi = new LoanTransactionsApi(getConfiguration())

const WaiveInterest = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Waive Interest' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // form state
  const [waivedOn, setWaivedOn] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pre-fill from the waive interest template, as the Angular web app does
  useEffect(() => {
    if (!loanId) return
    loanTransactionsApi
      .retrieveTransactionTemplate(Number(loanId), 'waiveinterest')
      .then(res => {
        const tpl = res.data ?? {}
        // Fineract sends the date as [year, month, day], though the SDK types it as a string.
        const date = dateArrayToInputValue(tpl.date as unknown as number[])
        // Only fill the date if the user has not already picked one.
        setWaivedOn(prev => prev || date)
        setCurrencyCode(tpl.currency?.code ?? '')
        if (tpl.amount != null) setAmountDisplay(String(tpl.amount))
      })
      .catch(e => console.error('waive interest template failed', e))
  }, [loanId])

  // validation
  const canSubmit = Boolean(waivedOn) && Number(amountDisplay) > 0

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !loanId) return

    setSaving(true)
    setError(null)
    try {
      await loanTransactionsApi.executeLoanTransaction(
        Number(loanId),
        {
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
          transactionDate: waivedOn,
          transactionAmount: Number(amountDisplay),
          note: note || undefined,
        } as Record<string, unknown>,
        'waiveinterest'
      )
      navigate(-1)
    } catch (e) {
      console.error('waive interest failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Waive interest failed. Please try again.'
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
        <h2 className="text-2xl font-semibold mb-6">Waive Interest</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* waived on date */}
          <div className="space-y-2">
            <Label>Interest waived on*</Label>
            <Input
              type="date"
              value={waivedOn}
              onChange={e => {
                setWaivedOn(e.target.value)
                setError(null)
              }}
            />
          </div>

          {/* transaction amount */}
          <div className="space-y-2">
            <Label>Transaction Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input value={amountDisplay} readOnly />
            </div>
          </div>

          {/* note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={e => {
                setNote(e.target.value)
                setError(null)
              }}
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
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WaiveInterest
