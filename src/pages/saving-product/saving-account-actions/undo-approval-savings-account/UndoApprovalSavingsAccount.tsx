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
import { SavingsAccountApi } from '@/fineract-api'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const savingsApi = new SavingsAccountApi(getConfiguration())

const UndoApprovalSavingsAccount = () => {
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: 'Undo Approval' })
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()

  const [note, setNote] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backToTransactions = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/transactions`)
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
          note: note || undefined,
        } as Record<string, unknown>,
        'undoapproval'
      )
      backToTransactions()
    } catch (e) {
      console.error('undoapproval failed', e)
      setError(
        datatableErrorMessage(e) ?? 'Undo approval failed. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs items={breadcrumbs} />

      {/* Card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Undo Approval</h2>

          <div className="space-y-6">
            {/* Note */}
            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                value={note}
                onChange={e => {
                  setNote(e.target.value)
                  setError(null)
                }}
              />
            </div>

            {/* Actions */}
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToTransactions}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={saving}
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

export default UndoApprovalSavingsAccount
