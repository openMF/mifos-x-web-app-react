/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Checkbox } from '@/components/ui/checkbox'

const WorkingDays = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Working Days', current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mb-4">Working Days</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
        <form>
          {/* Working Days list */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="text-zinc-700 dark:text-zinc-200 font-medium mb-4">
              Working Days
            </div>

            <div className="space-y-4">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ].map(d => (
                <label key={d} className="flex items-center gap-3">
                  <Checkbox />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Non-working day policy */}
          <div className="mt-8">
            <AppSelect
              selectLabel="Payments due on non working days"
              selectPlaceholder="Select policy"
              selectValue=""
              selectOnChange={() => {}}
              selectClassname="w-full"
              selectOptions={[
                { id: 'NEXT_WORKING_DAY', name: 'move to next working day' },
                {
                  id: 'PREVIOUS_WORKING_DAY',
                  name: 'move to previous working day',
                },
                { id: 'SAME_DAY', name: 'same day' },
              ]}
            />
          </div>

          {/* Extend term toggle */}
          <div className="mt-6 flex items-center justify-between">
            <span>
              Extend the term for loans following a daily repayment schedule
            </span>
            <Checkbox />
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button
              type="submit"
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

export default WorkingDays
