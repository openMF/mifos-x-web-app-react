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

const CloseAsRescheduled = () => {
  const navigate = useNavigate()

  // form state
  const [closedOn, setClosedOn] = useState('')
  const [note, setNote] = useState('')

  // validation
  const canSubmit = Boolean(closedOn)

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
          { label: 'Close (as Rescheduled)', current: true },
        ]}
      />

      {/* card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Close (as Rescheduled)</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* closed on date */}
          <div className="space-y-2">
            <Label>Closed On*</Label>
            <Input
              type="date"
              value={closedOn}
              onChange={e => setClosedOn(e.target.value)}
            />
          </div>

          {/* note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
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

export default CloseAsRescheduled
