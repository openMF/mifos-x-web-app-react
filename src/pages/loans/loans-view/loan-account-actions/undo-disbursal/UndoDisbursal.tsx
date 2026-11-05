/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { LoansApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const loansApi = new LoansApi(getConfiguration())

const UndoDisbursal = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Undo Disbursal' })
  const navigate = useNavigate()
  // The loan action routes name the loan id `:loanId` (or, before MXWAR-189, `:id`).
  const params = useParams()
  const loanId = params.loanId ?? params.id

  // form state
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // simple validation
  const canSubmit = note.trim().length > 0

  // handle submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !loanId) return

    setSaving(true)
    setError(null)
    try {
      await loansApi.stateTransitions(Number(loanId), { note }, 'undoDisbursal')
      navigate(-1)
    } catch (e) {
      console.error('undo disbursal failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Undo disbursal failed. Please try again.'
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
        <h2 className="text-2xl font-semibold mb-6">Undo Disbursal</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* note input */}
          <div className="w-full space-y-2">
            <Label>Note*</Label>
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

export default UndoDisbursal
