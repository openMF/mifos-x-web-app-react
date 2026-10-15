/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import fineract from '@/lib/axios'
import { todayInputValue } from '@/lib/date-utils'

import CampaignForm, { type CampaignFormValue } from './CampaignForm'
import {
  apiErrorMessage,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  dateTimeInputForApi,
  LOCALE,
  toApiDate,
  type SmsCampaignTemplate,
} from './types'

/** POST /smscampaigns, with the same body as the Angular web app */
const CreateSmsCampaign = () => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [template, setTemplate] = useState<SmsCampaignTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fineract.get<SmsCampaignTemplate>(
          'v1/smscampaigns/template'
        )
        setTemplate(res.data ?? {})
      } catch (err) {
        setLoadError(apiErrorMessage(err, t('smsCampaign.errors.loadTemplate')))
      }
    })()
  }, [t])

  const handleSubmit = async (v: CampaignFormValue) => {
    try {
      const res = await fineract.post<{ resourceId?: number }>(
        'v1/smscampaigns',
        {
          campaignName: v.campaignName,
          ...(v.providerId ? { providerId: v.providerId } : {}),
          triggerType: v.triggerType,
          runReportId: v.runReportId,
          isNotification: v.isNotification,
          campaignType: v.isNotification ? 2 : 1,
          paramValue: v.paramValue,
          message: v.message,
          submittedOnDate: toApiDate(todayInputValue()),
          ...(v.recurrenceStartDate
            ? {
                recurrenceStartDate: dateTimeInputForApi(v.recurrenceStartDate),
                frequency: v.frequency,
                interval: v.interval,
                ...(v.repeatsOnDay ? { repeatsOnDay: v.repeatsOnDay } : {}),
              }
            : {}),
          dateTimeFormat: DATE_TIME_FORMAT,
          dateFormat: DATE_FORMAT,
          locale: LOCALE,
        }
      )
      navigate(`/organization/sms-campaigns/${res.data?.resourceId ?? ''}`)
      return null
    } catch (err) {
      return apiErrorMessage(err, t('smsCampaign.errors.create'))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('smsCampaign.title'),
            href: '/organization/sms-campaigns',
          },
          { label: t('smsCampaign.create'), current: true },
        ]}
      />
      <h1 className="text-2xl font-semibold mb-6">{t('smsCampaign.create')}</h1>
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}
      {template && (
        <CampaignForm
          template={template}
          cancelPath="/organization/sms-campaigns"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default CreateSmsCampaign
