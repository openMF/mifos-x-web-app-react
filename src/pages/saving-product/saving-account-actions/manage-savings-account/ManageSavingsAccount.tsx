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
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ManageSavingsAccount = () => {
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()

  // form states
  const [reasonForBlock, setReasonForBlock] = useState('')
  const [transactionDate, setTransactionDate] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')

  const backToTransactions = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/transactions`)
    } else {
      navigate(-1)
    }
  }

  const onSubmit = () => {
    // TODO: Call savings account manage API
    backToTransactions()
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Manage', current: true },
        ]}
      />

      {/* Form card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Manage Savings Account
          </h2>

          <div className="space-y-6">
            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason*</Label>
              <AppSelect
                selectLabel=""
                selectValue={reasonForBlock}
                selectOnChange={setReasonForBlock}
                selectPlaceholder="Select reason"
                selectOptions={[
                  { id: 1, name: 'Fraud Suspicion' },
                  { id: 2, name: 'Regulatory Hold' },
                  { id: 3, name: 'Customer Request' },
                ]}
                selectClassname="w-full"
              />
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label>Transaction Date*</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
              />
            </div>

            {/* Transaction Amount */}
            <div className="space-y-2">
              <Label>Transaction Amount*</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={e => setTransactionAmount(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToTransactions}>
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={
                  !reasonForBlock || !transactionDate || !transactionAmount
                }
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

export default ManageSavingsAccount
