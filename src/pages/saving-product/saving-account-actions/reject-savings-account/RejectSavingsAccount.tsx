/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import { Label } from '@/components/ui/label'
import { SavingsAccountApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { useBusinessDateState } from '@/lib/business-date'
import { getConfiguration } from '@/lib/fineract-openapi'

const savingsApi = new SavingsAccountApi(getConfiguration())

const RejectSavingsAccount = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Reject' })
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()

  // Defaults to the business date, like the Angular web app.
  const [rejectedOnDate, setRejectedOnDate] = useBusinessDateState()
  const [note, setNote] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      await savingsApi.handleCommands6(
        Number(accountId),
        {
          locale: 'en',
          dateFormat: 'yyyy-MM-dd',
          rejectedOnDate,
          note: note || undefined,
        } as Record<string, unknown>,
        'reject'
      )
      backToAccount()
    } catch (e) {
      console.error('reject failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Rejection failed. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* breadcrumbs  */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* centered card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Reject</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rejected On Date</Label>
              <Input
                type="date"
                value={rejectedOnDate}
                onChange={e => {
                  setRejectedOnDate(e.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Note</Label>
              <Input
                placeholder="Optional note…"
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
                disabled={!rejectedOnDate || saving}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RejectSavingsAccount
