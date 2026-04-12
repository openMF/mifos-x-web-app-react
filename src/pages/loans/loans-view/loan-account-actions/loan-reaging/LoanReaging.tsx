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
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const LoanReaging = () => {
  const navigate = useNavigate()

  // form state
  const [numInstallments, setNumInstallments] = useState<string>('')
  const [freqNumber, setFreqNumber] = useState<string>('')
  const [freqTypeId, setFreqTypeId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [externalId, setExternalId] = useState<string>('')

  // validation
  const canSubmit = Boolean(
    numInstallments && freqNumber && freqTypeId && startDate
  )

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
          { label: 'Re-Age', current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Re-Age</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* number of installments */}
          <div className="space-y-2">
            <Label>Number of Installments*</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={numInstallments}
              onChange={e => setNumInstallments(e.target.value)}
            />
          </div>

          {/* frequency number */}
          <div className="space-y-2">
            <Label>Frequency Number*</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={freqNumber}
              onChange={e => setFreqNumber(e.target.value)}
            />
          </div>

          {/* frequency type dropdown */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Frequency Type*"
              selectPlaceholder="Select frequency"
              selectValue={freqTypeId}
              selectOnChange={setFreqTypeId}
              selectOptions={[]}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* start date */}
          <div className="space-y-2">
            <Label>Start Date*</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          {/* external id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={externalId}
              onChange={e => setExternalId(e.target.value)}
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
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoanReaging
