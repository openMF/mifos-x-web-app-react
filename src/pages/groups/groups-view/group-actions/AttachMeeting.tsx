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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

const AttachMeeting = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  const [startDate, setStartDate] = useState<string>('')
  const [repeats, setRepeats] = useState(false)
  const [frequency, setFrequency] = useState<
    'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  >('DAILY')
  const [interval, setInterval] = useState<number>(1)
  const [saving, _setSaving] = useState(false) // Reserved for future use

  const canSubmit = Boolean(startDate) && !saving

  return (
    <div className="min-h-screen px-6 py-8">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/groups' },
          { label: t('attachMeeting.breadcrumb'), current: true },
        ]}
      />

      <h1 className="text-2xl font-semibold mt-2 mb-6">
        {t('attachMeeting.heading')}
      </h1>

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-6 max-w-xl">
        {/* Meeting Start Date */}
        <div className="mb-6">
          <Label htmlFor="meeting-start">
            {t('attachMeeting.labelStartDate')}
          </Label>
          <Input
            id="meeting-start"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Repeats? */}
        <div className="mb-4 flex items-center gap-3">
          <Label htmlFor="repeats" className="cursor-pointer">
            {t('attachMeeting.labelRepeats')}
          </Label>
          <input
            id="repeats"
            type="checkbox"
            checked={repeats}
            onChange={e => setRepeats(e.target.checked)}
            className="h-4 w-4"
          />
        </div>

        {/* When "Repeats?" checked, show Frequency + Interval selects */}
        {repeats && (
          <div className="space-y-5 mb-6">
            <div>
              <Label>{t('attachMeeting.labelFrequency')}</Label>
              <Select
                value={frequency}
                onValueChange={val =>
                  setFrequency(val as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={t('attachMeeting.placeholderFrequency')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">
                    {t('attachMeeting.daily')}
                  </SelectItem>
                  <SelectItem value="WEEKLY">
                    {t('attachMeeting.weekly')}
                  </SelectItem>
                  <SelectItem value="MONTHLY">
                    {t('attachMeeting.monthly')}
                  </SelectItem>
                  <SelectItem value="YEARLY">
                    {t('attachMeeting.yearly')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('attachMeeting.labelInterval')}</Label>
              <Select
                value={String(interval)}
                onValueChange={v => setInterval(parseInt(v, 10))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={t('attachMeeting.placeholderInterval')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const val = i + 1
                    return (
                      <SelectItem key={val} value={String(val)}>
                        {val}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(`/groups/${id}/general`)}
            disabled={saving}
          >
            {tc('actions.cancel')}
          </Button>
          <Button
            type="button"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            // onClick={onSubmit}
            disabled={!canSubmit}
          >
            {saving ? tc('actions.saving') : tc('actions.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AttachMeeting
