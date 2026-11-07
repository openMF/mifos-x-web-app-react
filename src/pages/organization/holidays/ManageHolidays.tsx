/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { format, parseISO } from 'date-fns'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  HolidaysApi,
  OfficesApi,
  type GetOfficesResponse,
  type PostHolidaysRequest,
} from '@/fineract-api'

// repayment scheduling options
const REPAYMENT_TYPES = [
  { id: 'RESCHEDULE_TO_NEXT_REPAYMENT', name: 'Reschedule to Next Repayment' },
]

const officesApi = new OfficesApi(getConfiguration())
const holidaysApi = new HolidaysApi(getConfiguration())

const HOLIDAY_DATE_FORMAT = 'dd MMMM yyyy'

type HolidayCreateRequest = PostHolidaysRequest & {
  reschedulingType: number
}

const HOLIDAY_RESCHEDULING_TYPES = {
  RESCHEDULE_TO_NEXT_REPAYMENT: 1,
  RESCHEDULE_TO_SPECIFIC_DATE: 2,
} as const

type HolidayApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
}

const formatHolidayDate = (date: string) =>
  format(parseISO(date), HOLIDAY_DATE_FORMAT)

const getHolidayReschedulingPayload = (repaymentType: string) => {
  if (repaymentType === 'RESCHEDULE_TO_NEXT_REPAYMENT') {
    return {
      reschedulingType: HOLIDAY_RESCHEDULING_TYPES.RESCHEDULE_TO_NEXT_REPAYMENT,
    }
  }

  if (repaymentType === 'RESCHEDULE_TO_NEXT_MEETING') {
    throw new Error(
      'Reschedule to Next Meeting requires a backend-provided next meeting date. Add that date to the form/API response before submitting.'
    )
  }

  throw new Error(`Unsupported repayment scheduling type: ${repaymentType}`)
}

const getHolidayErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<HolidayApiErrorResponse>
  const responseData = axiosError.response?.data

  return (
    responseData?.errors?.[0]?.defaultUserMessage ||
    responseData?.errors?.[0]?.developerMessage ||
    responseData?.defaultUserMessage ||
    responseData?.developerMessage ||
    axiosError.message ||
    'Failed to create holiday'
  )
}

const ManageHolidays = () => {
  const navigate = useNavigate()
  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // fetch offices
  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const res = await officesApi.retrieveOffices()
        setOffices(res.data)
      } catch (err) {
        console.error('Failed to fetch office', err)
      }
    }
    fetchOffice()
  }, [])

  // form state
  const [form, setForm] = useState({
    name: '',
    fromDate: '',
    toDate: '',
    repaymentType: '',
    description: '',
    offices: [] as number[],
  })

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (
      !form.name.trim() ||
      !form.fromDate ||
      !form.toDate ||
      !form.repaymentType ||
      form.offices.length === 0
    ) {
      alert('Please fill all required fields.')
      return
    }

    let reschedulingPayload: ReturnType<typeof getHolidayReschedulingPayload>
    try {
      reschedulingPayload = getHolidayReschedulingPayload(form.repaymentType)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Invalid repayment option.')
      return
    }

    const payload: HolidayCreateRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      fromDate: formatHolidayDate(form.fromDate),
      toDate: formatHolidayDate(form.toDate),
      ...reschedulingPayload,
      offices: form.offices.map(officeId => ({ officeId })),
      locale: 'en',
      dateFormat: HOLIDAY_DATE_FORMAT,
    }

    try {
      setIsSubmitting(true)
      await holidaysApi.createNewHoliday(payload)
      alert('Holiday created successfully!')
      navigate('/organization/holidays')
    } catch (err) {
      console.error('Failed to create holiday', err)
      alert(getHolidayErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Holidays', href: '/organization/holidays' },
          { label: 'Create', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-2">
            <Label>Name*</Label>
            <Input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label>From Date*</Label>
            <Input
              type="date"
              value={form.fromDate}
              onChange={e => handleChange('fromDate', e.target.value)}
              required
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label>To Date*</Label>
            <Input
              type="date"
              value={form.toDate}
              onChange={e => handleChange('toDate', e.target.value)}
              required
            />
          </div>

          {/* Repayment Scheduling Type */}
          <div className="space-y-2 w-full">
            <AppSelect
              selectLabel="Repayment Scheduling Type*"
              selectPlaceholder="Select"
              selectValue={form.repaymentType}
              selectOnChange={val => handleChange('repaymentType', val)}
              selectClassname="w-full space-y-2"
              selectOptions={REPAYMENT_TYPES}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          {/* Offices checkboxes */}
          <div className="space-y-3 pt-2">
            <Label>Select applicable offices</Label>
            {offices
              .filter(o => o.id != null)
              .map(o => (
                <div key={o.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`office-${o.id}`}
                    checked={form.offices.includes(o.id as number)}
                    onCheckedChange={v => {
                      setForm(prev => {
                        const updated = new Set(prev.offices)
                        if (v) {
                          updated.add(o.id as number)
                        } else {
                          updated.delete(o.id as number)
                        }
                        return { ...prev, offices: Array.from(updated) }
                      })
                    }}
                  />
                  <Label htmlFor={`office-${o.id}`} className="select-none">
                    {o.name}
                  </Label>
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/holidays')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManageHolidays
