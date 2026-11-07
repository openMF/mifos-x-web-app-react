/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import fineract from '@/lib/axios'

import CampaignForm, { type CampaignFormValue } from './CampaignForm'
import {
  apiErrorMessage,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  LOCALE,
  TRIGGER_SCHEDULE,
  dateTimeInputForApi,
  type SmsCampaign,
  type SmsCampaignTemplate,
} from './types'

/**
 * PUT /smscampaigns/{id}. As in the Angular web app, the campaign details
 * and business rule are fixed once created; the message can change.
 */
const EditSmsCampaign = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<SmsCampaign | null>(null)
  const [template, setTemplate] = useState<SmsCampaignTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        // The template fails whenever the SMS gateway is down; editing only
        // needs the campaign, so do not let it block the page
        const [c, tpl] = await Promise.allSettled([
          fineract.get<SmsCampaign>(`v1/smscampaigns/${id}`),
          fineract.get<SmsCampaignTemplate>('v1/smscampaigns/template'),
        ])
        if (c.status === 'rejected') throw c.reason
        setCampaign(c.value.data ?? {})
        setTemplate(tpl.status === 'fulfilled' ? (tpl.value.data ?? {}) : {})
      } catch (err) {
        setLoadError(apiErrorMessage(err, t('smsCampaign.errors.load')))
      }
    })()
  }, [id, t])

  const handleSubmit = async (v: CampaignFormValue) => {
    if (!campaign) return null
    try {
      await fineract.put(`v1/smscampaigns/${id}`, {
        campaignName: campaign.campaignName,
        campaignType: v.isNotification ? 2 : 1,
        isNotification: v.isNotification,
        triggerType: campaign.triggerType?.id,
        providerId: campaign.providerId || null,
        runReportId: campaign.runReportId,
        message: v.message,
        paramValue: v.paramValue,
        ...(campaign.triggerType?.id === TRIGGER_SCHEDULE
          ? {
              recurrenceStartDate: dateTimeInputForApi(
                v.recurrenceStartDate ?? ''
              ),
            }
          : {}),
        dateTimeFormat: DATE_TIME_FORMAT,
        dateFormat: DATE_FORMAT,
        locale: LOCALE,
      })
      navigate(`/organization/sms-campaigns/${id}`)
      return null
    } catch (err) {
      return apiErrorMessage(err, t('smsCampaign.errors.update'))
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
          {
            label: campaign?.campaignName ?? id ?? '',
            href: `/organization/sms-campaigns/${id}`,
          },
          { label: t('common:actions.edit'), current: true },
        ]}
      />
      <h1 className="text-2xl font-semibold mb-6">{t('smsCampaign.edit')}</h1>
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}
      {campaign && template && (
        <CampaignForm
          template={template}
          campaign={campaign}
          cancelPath={`/organization/sms-campaigns/${id}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditSmsCampaign
