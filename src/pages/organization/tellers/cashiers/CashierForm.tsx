/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputToFineractDate } from '@/lib/date-utils'

import type { Cashier, CashierPayload, CashierTemplate } from './types'

type CashierFormProps = {
  title: string
  template: CashierTemplate
  /** The cashier being edited; omitted when creating */
  initial?: Cashier
  cancelPath: string
  /** Sends the request; resolves to an error message, or null on success */
  onSubmit: (payload: CashierPayload) => Promise<string | null>
}

const toTime = (value?: string) =>
  value && value.trim() ? value.trim().slice(0, 5) : ''

/**
 * The Create and Edit Cashier form of the Angular web app: the staff member
 * who works the teller, the period, and either the full day or a time range.
 */
const CashierForm = ({
  title,
  template,
  initial,
  cancelPath,
  onSubmit,
}: CashierFormProps) => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [staffId, setStaffId] = useState(
    initial?.staffId ? String(initial.staffId) : ''
  )
  const [description, setDescription] = useState(initial?.description ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [isFullDay, setIsFullDay] = useState(initial?.isFullDay ?? true)
  const [startTime, setStartTime] = useState(toTime(initial?.startTime))
  const [endTime, setEndTime] = useState(toTime(initial?.endTime))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!staffId) return setError(t('cashiers.validation.staffRequired'))
    if (!startDate || !endDate)
      return setError(t('cashiers.validation.datesRequired'))
    if (endDate < startDate)
      return setError(t('cashiers.validation.endDateBeforeStart'))

    const payload: CashierPayload = {
      staffId: Number(staffId),
      description: description.trim(),
      startDate: inputToFineractDate(startDate) ?? '',
      endDate: inputToFineractDate(endDate) ?? '',
      isFullDay,
      dateFormat: 'dd MMMM yyyy',
      locale: 'en',
    }
    if (!isFullDay) {
      // Same check as the Angular web app: the shift must end after it starts
      if (!startTime || !endTime || endTime <= startTime)
        return setError(t('cashiers.validation.endTimeBeforeStart'))
      const [hourStartTime, minStartTime] = startTime.split(':')
      const [hourEndTime, minEndTime] = endTime.split(':')
      Object.assign(payload, {
        hourStartTime,
        minStartTime,
        hourEndTime,
        minEndTime,
        startTime,
        endTime,
      })
    }

    setSubmitting(true)
    setError(null)
    const message = await onSubmit(payload)
    // On success the page has already navigated away
    if (message) {
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-1">{title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">
        {template.tellerName} • {template.officeName}
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <AppSelect
          selectLabel={`${t('cashiers.fields.staff')}*`}
          selectPlaceholder={
            template.staffOptions?.length
              ? t('cashiers.placeholders.staff')
              : t('cashiers.placeholders.noStaff')
          }
          selectValue={staffId}
          selectOnChange={v => {
            setStaffId(v)
            setError(null)
          }}
          selectOptions={(template.staffOptions ?? []).map(s => ({
            id: s.id ?? '',
            name: s.displayName ?? '',
          }))}
          selectClassname="w-full space-y-2"
        />

        <div className="w-full space-y-2">
          <Label htmlFor="cashierDescription">
            {t('cashiers.fields.description')}
          </Label>
          <Input
            id="cashierDescription"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full space-y-2">
            <Label htmlFor="cashierStart">
              {t('cashiers.fields.startDate')}*
            </Label>
            <Input
              id="cashierStart"
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                setError(null)
              }}
            />
          </div>
          <div className="w-full space-y-2">
            <Label htmlFor="cashierEnd">{t('cashiers.fields.endDate')}*</Label>
            <Input
              id="cashierEnd"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => {
                setEndDate(e.target.value)
                setError(null)
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="cashierFullDay"
            checked={isFullDay}
            onCheckedChange={v => setIsFullDay(v === true)}
          />
          <Label htmlFor="cashierFullDay">{t('cashiers.shift.fullDay')}</Label>
        </div>

        {!isFullDay && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full space-y-2">
              <Label htmlFor="cashierStartTime">
                {t('cashiers.fields.startTime')}*
              </Label>
              <Input
                id="cashierStartTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="cashierEndTime">
                {t('cashiers.fields.endTime')}*
              </Label>
              <Input
                id="cashierEndTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(cancelPath)}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={submitting}
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CashierForm
