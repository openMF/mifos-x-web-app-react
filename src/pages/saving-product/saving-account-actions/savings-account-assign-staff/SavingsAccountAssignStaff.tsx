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

const SavingsAccountAssignStaff = () => {
  const { groupId, accountId } = useParams()
  const navigate = useNavigate()

  // form state
  const [staffId, setStaffId] = useState<string>('')
  const [assignmentDate, setAssignmentDate] = useState<string>('')

  // go back to savings account general page
  const backToAccount = () => {
    if (groupId && accountId) {
      navigate(`/groups/${groupId}/savings-accounts/${accountId}/general`)
    } else {
      navigate(-1)
    }
  }

  // submit handler — placeholder for API call
  const onSubmit = () => {
    backToAccount()
  }

  const staffOptions = [
    { id: '101', name: 'Alice M.' },
    { id: '102', name: 'Brian K.' },
    { id: '103', name: 'Chandra P.' },
  ]

  return (
    <div className="min-h-screen px-6 py-10">
      {/* breadcrumbs navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Assign Staff', current: true },
        ]}
      />

      {/* centered form card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Assign Staff</h2>

          {/* form fields */}
          <div className="space-y-6">
            {/* staff selection */}
            <div className="space-y-2">
              <AppSelect
                selectLabel="To Savings Officer"
                selectValue={staffId}
                selectOnChange={setStaffId}
                selectPlaceholder="Select staff"
                selectOptions={staffOptions}
                selectClassname="w-full space-y-2"
              />
            </div>

            {/* assignment date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assignment Date</Label>
              <Input
                type="date"
                value={assignmentDate}
                onChange={e => setAssignmentDate(e.target.value)}
              />
            </div>

            {/* actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3]"
                onClick={onSubmit}
                disabled={!assignmentDate}
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

export default SavingsAccountAssignStaff
