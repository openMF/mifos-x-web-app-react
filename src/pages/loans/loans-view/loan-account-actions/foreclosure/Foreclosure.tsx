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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const Foreclosure = () => {
  const navigate = useNavigate()
  const { groupId } = useParams()

  // form state
  const [transactionDate, setTransactionDate] = useState('')
  const [principal] = useState('')
  const [interest] = useState('')
  const [feeAmount] = useState('')
  const [penaltyAmount, setPenaltyAmount] = useState('')
  const [transactionAmount] = useState('')
  const [note, setNote] = useState('')

  // simple validation
  const canSubmit =
    Boolean(transactionDate) &&
    penaltyAmount !== '' &&
    transactionAmount !== '' &&
    note.trim().length > 0

  // handle submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    navigate(-1)
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'GroupTest', href: `/groups/${groupId ?? ''}/general` },
          { label: 'Foreclosure', current: true },
        ]}
      />

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
              onChange={e => setTransactionDate(e.target.value)}
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
            <Label>Penalty Amount*</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={penaltyAmount}
              onChange={e => setPenaltyAmount(e.target.value)}
              placeholder="0"
            />
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
              onChange={e => setNote(e.target.value)}
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* actions */}
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
              Foreclosure
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Foreclosure
