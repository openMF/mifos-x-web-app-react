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
import { Label } from '@/components/ui/label'

const RejectSavingsAccount = () => {
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()

  const [rejectedOnDate, setRejectedOnDate] = useState('')
  const [note, setNote] = useState('')

  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`)
    } else {
      navigate(-1)
    }
  }

  const onSubmit = () => {
    backToAccount()
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* breadcrumbs  */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Reject', current: true },
        ]}
      />

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
                onChange={e => setRejectedOnDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Note</Label>
              <Input
                placeholder="Optional note…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={!rejectedOnDate}
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
