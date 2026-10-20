/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays, Loader2 } from 'lucide-react'
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

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const savingRef = useRef(false)
  const firstDayRef = useRef<HTMLButtonElement>(null)
  const policyRef = useRef<HTMLButtonElement>(null)
  const validOptions = rescheduleOptions
    .filter(
      option =>
        option.id != null &&
        Number.isFinite(option.id) &&
        Boolean(option.value?.trim())
    )
    .filter(
      (option, index, options) =>
        options.findIndex(item => item.id === option.id) === index
    )
  const policyValid = validOptions.some(
    option => option.id?.toString() === repaymentRescheduleType
  )
  const daysInvalid = validationAttempted && selectedDays.length === 0
  const policyInvalid = validationAttempted && !policyValid

  // fetch the current working days configuration
  const fetchWorkingDays = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    setSaveError('')
    setValidationAttempted(false)

    try {
      const [configurationResult, templateResult] = await Promise.allSettled([
        workingDaysApi.retrieveAll17(),
        workingDaysApi.template4(),
      ])
      if (configurationResult.status === 'rejected') {
        throw configurationResult.reason
      }

      const res = configurationResult.value
      const template =
        templateResult.status === 'fulfilled' ? templateResult.value : undefined
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
      setRescheduleOptions(template?.data.repaymentRescheduleOptions ?? [])
      if (templateResult.status === 'rejected') {
        console.error(
          'Failed to fetch repayment policy options',
          templateResult.reason
        )
      }
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
    if (savingRef.current) return
    setValidationAttempted(true)
    setSaveError('')
    if (selectedDays.length === 0) {
      firstDayRef.current?.focus()
      return
    }
    if (!policyValid) {
      policyRef.current?.focus()
      return
    }
    savingRef.current = true
    setSaving(true)

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
      setSaveError(
        'Your changes could not be saved. Please try again. Your selections have been kept.'
      )
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-sm sm:px-6 sm:py-10">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Working Days', current: true },
        ]}
      />
      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-[#1074b9]">
          <CalendarDays className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Working Days
          </h1>
          <p className="mt-2 text-muted-foreground">
            Set your working week and how repayments are handled on non-working
            days.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {loading ? (
          <p
            role="status"
            className="flex items-center justify-center gap-3 p-12 text-muted-foreground"
          >
            <Loader2
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
            Loading working days…
          </p>
        ) : loadError ? (
          <div className="space-y-4 p-8">
            <p role="alert">
              Could not load the working days configuration. Please try again.
            </p>
            <Button type="button" variant="outline" onClick={fetchWorkingDays}>
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-busy={saving}>
            <fieldset disabled={saving} className="min-w-0 border-0 p-0">
              <legend className="sr-only">Working days settings</legend>
              <section
                className="grid gap-6 border-b p-6 sm:p-8 md:grid-cols-[240px_1fr]"
                aria-labelledby="working-week-heading"
              >
                <div>
                  <h2 id="working-week-heading" className="font-semibold">
                    Working week
                  </h2>
                  <p
                    id="working-week-help"
                    className="mt-2 leading-6 text-muted-foreground"
                  >
                    Choose the days your organization operates. Select at least
                    one day.
                  </p>
                </div>
                <fieldset
                  className="min-w-0"
                  aria-describedby={
                    daysInvalid
                      ? 'working-week-help days-error'
                      : 'working-week-help'
                  }
                >
                  <legend className="sr-only">Select working days</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {WEEK_DAYS.map((day, index) => (
                      <label
                        key={day.value}
                        htmlFor={`day-${day.value}`}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 has-[[data-state=checked]]:border-[#1074b9] has-[[data-state=checked]]:bg-[#1074b9]/5"
                      >
                        <Checkbox
                          id={`day-${day.value}`}
                          ref={index === 0 ? firstDayRef : undefined}
                          checked={selectedDays.includes(day.value)}
                          disabled={saving}
                          aria-invalid={daysInvalid}
                          onCheckedChange={checked =>
                            toggleDay(day.value, checked === true)
                          }
                        />
                        <span>{day.name}</span>
                      </label>
                    ))}
                  </div>
                  {daysInvalid && (
                    <p
                      id="days-error"
                      role="alert"
                      className="mt-3 text-sm text-destructive"
                    >
                      Select at least one working day.
                    </p>
                  )}
                </fieldset>
              </section>
              <section
                className="grid gap-6 border-b p-6 sm:p-8 md:grid-cols-[240px_1fr]"
                aria-labelledby="repayment-heading"
              >
                <div>
                  <h2 id="repayment-heading" className="font-semibold">
                    Repayment scheduling
                  </h2>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    Choose how to handle payments that fall outside your working
                    week.
                  </p>
                </div>
                <div className="min-w-0 space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="repayment-policy"
                      className="block font-medium"
                    >
                      Payments due on non-working days
                    </label>
                    <Select
                      value={policyValid ? repaymentRescheduleType : ''}
                      onValueChange={setRepaymentRescheduleType}
                      disabled={saving || validOptions.length === 0}
                    >
                      <SelectTrigger
                        id="repayment-policy"
                        ref={policyRef}
                        className="min-h-11 w-full"
                        aria-required="true"
                        aria-invalid={policyInvalid}
                        aria-describedby={
                          validOptions.length === 0
                            ? 'policy-unavailable'
                            : policyInvalid
                              ? 'policy-error'
                              : undefined
                        }
                      >
                        <SelectValue placeholder="Select a repayment policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {validOptions.map(option => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validOptions.length === 0 ? (
                      <div
                        id="policy-unavailable"
                        role="alert"
                        className="space-y-3"
                      >
                        <p className="text-destructive">
                          No repayment policies are available. Reload the
                          settings to try again.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={fetchWorkingDays}
                        >
                          Reload settings
                        </Button>
                      </div>
                    ) : policyInvalid ? (
                      <p
                        id="policy-error"
                        role="alert"
                        className="text-destructive"
                      >
                        Select an available repayment policy.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                    <Checkbox
                      id="extend-loan-term"
                      className="mt-0.5"
                      checked={extendTermForDailyRepayments}
                      disabled={saving}
                      aria-describedby="extend-loan-term-help"
                      onCheckedChange={checked =>
                        setExtendTermForDailyRepayments(checked === true)
                      }
                    />
                    <div>
                      <label
                        htmlFor="extend-loan-term"
                        className="cursor-pointer font-medium"
                      >
                        Extend loan terms for daily repayments
                      </label>
                      <p
                        id="extend-loan-term-help"
                        className="mt-1 leading-6 text-muted-foreground"
                      >
                        Apply term extension to loans with a daily repayment
                        schedule.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </fieldset>
            <div className="flex flex-col gap-4 bg-muted/20 px-6 py-5 sm:px-8">
              {saveError && (
                <p role="alert" className="text-destructive">
                  {saveError}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span role="status" className="mr-auto text-muted-foreground">
                  {saving ? 'Saving your settings…' : ''}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-5"
                  disabled={saving}
                  onClick={() => navigate('/organization')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-h-11 bg-[#1074b9] px-5 text-white hover:bg-[#0d639e]"
                  disabled={saving || validOptions.length === 0}
                >
                  {saving && (
                    <Loader2
                      className="size-4 motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default WorkingDays
