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
import { LoanTransactionsApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { dateArrayToInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

const loanTransactionsApi = new LoanTransactionsApi(getConfiguration())

const ChargeOff = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Charge-Off' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // form state
  const [transactionDate, setTransactionDate] = useState('')
  const [reasonId, setReasonId] = useState('')
  const [externalId, setExternalId] = useState('')
  const [note, setNote] = useState('')
  const [reasons, setReasons] = useState<{ id: number; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pre-fill from the charge-off template, as the Angular web app does
  useEffect(() => {
    if (!loanId) return
    loanTransactionsApi
      .retrieveTransactionTemplate(Number(loanId), 'charge-off')
      .then(res => {
        const tpl = res.data ?? {}
        // Fineract sends the date as [year, month, day], though the SDK types it as a string.
        const date = dateArrayToInputValue(tpl.date as unknown as number[])
        // Only fill the date if the user has not already picked one.
        setTransactionDate(prev => prev || date)
        setReasons(
          (tpl.chargeOffReasonOptions ?? []).map(r => ({
            id: r.id ?? 0,
            name: r.name ?? '',
          }))
        )
      })
      .catch(e => console.error('charge-off template failed', e))
  }, [loanId])

  // validation
  const canSubmit = Boolean(transactionDate)

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
          transactionDate: transactionDate,
          chargeOffReasonId: reasonId ? Number(reasonId) : undefined,
          externalId: externalId || undefined,
          note: note || undefined,
        } as Record<string, unknown>,
        'charge-off'
      )
      navigate(-1)
    } catch (e) {
      console.error('charge-off failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Charge-off failed. Please try again.'
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
        <h2 className="text-2xl font-semibold mb-6">Charge-Off</h2>

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

          {/* reason dropdown */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Reason for Charge-Off"
              selectPlaceholder="Select reason"
              selectValue={reasonId}
              selectOnChange={setReasonId}
              selectOptions={reasons}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* external id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={externalId}
              onChange={e => setExternalId(e.target.value)}
            />
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

export default ChargeOff
