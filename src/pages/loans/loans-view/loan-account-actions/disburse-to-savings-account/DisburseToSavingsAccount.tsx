/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const DisburseToSavingsAccount = () => {
  const navigate = useNavigate()

  const [disbursementOn, setDisbursementOn] = useState('')
  const [currencyCode] = useState('')
  const [amountDisplay] = useState('')
  const [note, setNote] = useState('')

  const canSubmit = Boolean(disbursementOn)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    navigate(-1)
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Disburse to Savings', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Disburse to Savings</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Disbursement On */}
          <div className="w-full space-y-2">
            <Label>Disbursement On*</Label>
            <Input
              type="date"
              value={disbursementOn}
              onChange={e => setDisbursementOn(e.target.value)}
            />
          </div>

          {/* Transaction Amount */}
          <div className="w-full space-y-2">
            <Label>Transaction Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input value={amountDisplay} readOnly />
            </div>
          </div>

          {/* Note */}
          <div className="w-full space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
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

export default DisburseToSavingsAccount
