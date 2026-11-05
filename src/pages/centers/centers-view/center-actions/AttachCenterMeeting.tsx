/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { AxiosError } from 'axios'

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarApi,
  CentersApi,
  type CalendarRequest,
  type GetCentersCenterIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { todayInputValue } from '@/lib/date-utils'

const calendarApi = new CalendarApi(getConfiguration())
const centersApi = new CentersApi(getConfiguration())

type CenterApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type OptionItem = {
  id: number
  value: string
}

type CalendarTemplateResponse = {
  frequencyOptions?: OptionItem[]
  repeatsOnDayOptions?: OptionItem[]
}

const DEFAULT_FREQUENCY_OPTIONS: OptionItem[] = [
  { id: 1, value: 'Daily' },
  { id: 2, value: 'Weekly' },
  { id: 3, value: 'Monthly' },
  { id: 4, value: 'Yearly' },
]

const DEFAULT_DAY_OPTIONS: OptionItem[] = [
  { id: 1, value: 'Monday' },
  { id: 2, value: 'Tuesday' },
  { id: 3, value: 'Wednesday' },
  { id: 4, value: 'Thursday' },
  { id: 5, value: 'Friday' },
  { id: 6, value: 'Saturday' },
  { id: 7, value: 'Sunday' },
]

/**
 * Attaches a meeting calendar to an existing center (POST /centers/{centerId}/calendars),
 * matching the Angular Mifos X WebApp UI.
 */
const AttachCenterMeeting = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const centerId = Number(id)
  const isValidId = !Number.isNaN(centerId) && centerId > 0

  const [center, setCenter] = useState<GetCentersCenterIdResponse>()
  const [startDate, setStartDate] = useState(todayInputValue())
  const [repeats, setRepeats] = useState(false)
  const [frequency, setFrequency] = useState<string>('1') // 1: Daily, 2: Weekly, 3: Monthly, 4: Yearly
  const [interval, setInterval] = useState<string>('1')
  const [repeatsOnDay, setRepeatsOnDay] = useState<string>('1')

  const [frequencyOptions, setFrequencyOptions] = useState<OptionItem[]>(
    DEFAULT_FREQUENCY_OPTIONS
  )
  const [dayOptions, setDayOptions] =
    useState<OptionItem[]>(DEFAULT_DAY_OPTIONS)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  // Fetch Center details & Calendar template
  useEffect(() => {
    const fetchData = async () => {
      if (!isValidId) return
      try {
        // Fetch Center Details via CentersApi (calls /v1/centers/{id})
        try {
          const cRes = await centersApi.retrieveOne14(centerId)
          if (cRes?.data) setCenter(cRes.data)
        } catch (e) {
          console.warn('Failed to fetch center info', e)
        }

        // Fetch Calendar Template via CalendarApi (calls /v1/centers/{id}/calendars/template)
        try {
          const tRes = await calendarApi.retrieveNewCalendarDetails(
            'centers',
            centerId
          )
          const data = tRes.data as CalendarTemplateResponse
          if (
            Array.isArray(data?.frequencyOptions) &&
            data.frequencyOptions.length > 0
          ) {
            setFrequencyOptions(data.frequencyOptions)
          }
          if (
            Array.isArray(data?.repeatsOnDayOptions) &&
            data.repeatsOnDayOptions.length > 0
          ) {
            setDayOptions(data.repeatsOnDayOptions)
          }
        } catch (e) {
          console.warn('Failed to fetch calendar template', e)
        }
      } catch (err) {
        console.error('Initial data fetch failed', err)
      }
    }

    fetchData()
  }, [centerId, isValidId])

  // Repetition intervals based on selected frequency
  const getRepetitionIntervals = (): string[] => {
    switch (Number(frequency)) {
      case 1: // Daily
        return ['1', '2', '3']
      case 2: // Weekly
        return ['1', '2', '3', '4']
      case 3: // Monthly
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
      case 4: // Yearly
        return ['1', '2', '3', '4', '5']
      default:
        return ['1', '2', '3']
    }
  }

  const backToCenter = () => navigate(`/centers/${id}/general`)

  const validate = (): string | null => {
    if (!startDate) return t('attachMeeting.errors.dateRequired')
    if (repeats && Number(frequency) === 2 && !repeatsOnDay) {
      return t('attachMeeting.errors.dayRequired')
    }
    return null
  }

  const onSubmit = async () => {
    if (submittingRef.current) return
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      const payload: CalendarRequest = {
        title: `centers_${centerId}_CollectionMeeting`,
        startDate,
        typeId: '1',
        repeating: (repeats ? 'true' : 'false') as unknown as string,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }

      if (repeats) {
        payload.frequency = String(frequency)
        payload.interval = String(interval)
        if (Number(frequency) === 2) {
          payload.repeatsOnDay = String(repeatsOnDay)
        }
      }

      await calendarApi.createCalendar('centers', centerId, payload)

      const state: RouteSuccessState = {
        successMessage: t('success.meetingAttached'),
      }
      navigate(`/centers/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<CenterApiErrorResponse>).response?.data
      setError(
        data?.defaultUserMessage ||
          data?.errors?.[0]?.defaultUserMessage ||
          t('attachMeeting.errors.failedAttachMeeting')
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const isWeekly = Number(frequency) === 2

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      {/* Top Header matching Angular layout with vertical blue bar and breadcrumbs */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-1 self-stretch bg-[#0e77b7] rounded-sm min-h-[44px]" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('attachMeeting.heading')}
          </h1>
          <div className="flex items-center text-sm mt-1 text-zinc-500">
            <Link
              to="/centers"
              className="text-[#0e77b7] hover:underline font-medium"
            >
              {t('title')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-400" />
            <Link
              to={`/centers/${id}/general`}
              className="text-[#0e77b7] hover:underline font-medium"
            >
              {center?.name || '...'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-400" />
            <span className="text-zinc-500">{t('attachMeeting.heading')}</span>
          </div>
        </div>
      </div>

      {/* Centered Form Card matching Angular mat-card layout */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 sm:p-8">
          <form
            onSubmit={e => {
              e.preventDefault()
              onSubmit()
            }}
            className="space-y-6"
          >
            {/* Meeting Start Date */}
            <div className="space-y-2">
              <Label htmlFor="meeting-start" className="text-sm font-medium">
                {t('attachMeeting.labelStartDate')}
              </Label>
              <Input
                id="meeting-start"
                type="date"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setError(null)
                }}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              />
            </div>

            {/* Repeats? Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="repeats"
                checked={repeats}
                onCheckedChange={checked => {
                  setRepeats(Boolean(checked))
                  setError(null)
                }}
              />
              <Label
                htmlFor="repeats"
                className="text-sm font-medium cursor-pointer"
              >
                {t('attachMeeting.labelRepeats')}
              </Label>
            </div>

            {/* Repetition fields (if repeats is checked) */}
            {repeats && (
              <div className="space-y-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {/* Repetition Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm font-medium">
                    {t('attachMeeting.labelFrequency')}
                  </Label>
                  <Select
                    value={frequency}
                    onValueChange={val => {
                      setFrequency(val)
                      setInterval('1')
                      setError(null)
                    }}
                  >
                    <SelectTrigger
                      id="frequency"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                    >
                      <SelectValue
                        placeholder={t('attachMeeting.placeholderFrequency')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(opt => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Repetition Interval */}
                <div className="space-y-2">
                  <Label htmlFor="interval" className="text-sm font-medium">
                    {t('attachMeeting.labelInterval')}
                  </Label>
                  <Select
                    value={interval}
                    onValueChange={val => {
                      setInterval(val)
                      setError(null)
                    }}
                  >
                    <SelectTrigger
                      id="interval"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                    >
                      <SelectValue
                        placeholder={t('attachMeeting.placeholderInterval')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getRepetitionIntervals().map(val => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Repeats on Day (Weekly only) */}
                {isWeekly && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="repeatsOnDay"
                      className="text-sm font-medium"
                    >
                      {t('attachMeeting.labelRepeatsOnDay')}
                    </Label>
                    <Select
                      value={repeatsOnDay}
                      onValueChange={val => {
                        setRepeatsOnDay(val)
                        setError(null)
                      }}
                    >
                      <SelectTrigger
                        id="repeatsOnDay"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                      >
                        <SelectValue
                          placeholder={t(
                            'attachMeeting.placeholderRepeatsOnDay'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map(day => (
                          <SelectItem key={day.id} value={String(day.id)}>
                            {day.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions: Centered Cancel and Submit buttons matching Angular */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={backToCenter}
                disabled={submitting}
                className="px-6"
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-[#0e77b7] hover:bg-[#0662a3] text-white px-6"
                disabled={!startDate || submitting}
              >
                {tc('actions.submit')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AttachCenterMeeting
