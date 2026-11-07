/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Checkbox } from '@/components/ui/checkbox'

import { WorkingDaysApi, type EnumOptionData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const workingDaysApi = new WorkingDaysApi(getConfiguration())

/** Prefix Fineract uses for the weekly working days recurrence rule. */
const RECURRENCE_PREFIX = 'FREQ=WEEKLY;INTERVAL=1;BYDAY='

const WEEK_DAYS = [
  { name: 'Monday', value: 'MO' },
  { name: 'Tuesday', value: 'TU' },
  { name: 'Wednesday', value: 'WE' },
  { name: 'Thursday', value: 'TH' },
  { name: 'Friday', value: 'FR' },
  { name: 'Saturday', value: 'SA' },
  { name: 'Sunday', value: 'SU' },
]

const WorkingDays = () => {
  const navigate = useNavigate()

  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [repaymentRescheduleType, setRepaymentRescheduleType] = useState('')
  const [extendTermForDailyRepayments, setExtendTermForDailyRepayments] =
    useState(false)
  const [rescheduleOptions, setRescheduleOptions] = useState<EnumOptionData[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // fetch the current working days configuration
  const fetchWorkingDays = useCallback(async () => {
    setLoading(true)
    setLoadError(false)

    try {
      const res = await workingDaysApi.retrieveAll17()
      const days = (res.data.recurrence ?? '')
        .replace(RECURRENCE_PREFIX, '')
        .split(',')
        .filter(Boolean)

      setSelectedDays(days)
      setRepaymentRescheduleType(
        res.data.repaymentRescheduleType?.id?.toString() ?? ''
      )
      setExtendTermForDailyRepayments(
        res.data.extendTermForDailyRepayments ?? false
      )
      setRescheduleOptions(res.data.repaymentRescheduleOptions ?? [])
    } catch (err) {
      console.error('Failed to fetch working days', err)
      // Without the current configuration the form would submit an empty
      // recurrence, so surface the failure instead of rendering it.
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkingDays()
  }, [fetchWorkingDays])

  const toggleDay = (value: string, checked: boolean) => {
    setSelectedDays(prev =>
      checked ? [...prev, value] : prev.filter(day => day !== value)
    )
  }

  // handle working days update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // BYDAY is a comma-separated list in week order, with no trailing comma.
    const recurrence =
      RECURRENCE_PREFIX +
      WEEK_DAYS.filter(day => selectedDays.includes(day.value))
        .map(day => day.value)
        .join(',')

    try {
      await workingDaysApi.update8({
        recurrence,
        // The generated client types this as EnumOptionData, but the endpoint
        // expects the bare enum id; sending the object is rejected with
        // "String instead of Number".
        repaymentRescheduleType: Number(
          repaymentRescheduleType
        ) as unknown as EnumOptionData,
        extendTermForDailyRepayments,
        locale: 'en',
      })

      navigate('/organization')
    } catch (err) {
      console.error('Failed to update working days', err)
      alert('Failed to update working days')
    }
  }

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
        {loading ? (
          <p className="text-center text-zinc-500">Loading...</p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-zinc-700 dark:text-zinc-200">
              Could not load the working days configuration.
            </p>
            <Button type="button" variant="outline" onClick={fetchWorkingDays}>
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Working Days list */}
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="text-zinc-700 dark:text-zinc-200 font-medium mb-4">
                Working Days
              </div>

              <div className="space-y-4">
                {WEEK_DAYS.map(day => (
                  <label key={day.value} className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={checked =>
                        toggleDay(day.value, checked === true)
                      }
                    />
                    <span>{day.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Non-working day policy */}
            <div className="mt-8">
              <AppSelect
                selectLabel="Payments due on non working days"
                selectPlaceholder="Select policy"
                selectValue={repaymentRescheduleType}
                selectOnChange={setRepaymentRescheduleType}
                selectClassname="w-full"
                selectOptions={rescheduleOptions.map(option => ({
                  id: option.id ?? '',
                  name: option.value ?? '',
                }))}
              />
            </div>

            {/* Extend term toggle */}
            <div className="mt-6 flex items-center justify-between">
              <span>
                Extend the term for loans following a daily repayment schedule
              </span>
              <Checkbox
                checked={extendTermForDailyRepayments}
                onCheckedChange={checked =>
                  setExtendTermForDailyRepayments(checked === true)
                }
              />
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/organization')}
              >
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
        )}
      </div>
    </div>
  )
}

export default WorkingDays
