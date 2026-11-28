/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { SpmSurveysApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import SurveyForm from './SurveyForm'
import { apiErrorMessage, type SurveyPayload } from './types'

const surveysApi = new SpmSurveysApi(getConfiguration())

/** Creates a survey (POST /surveys) */
const CreateSurvey = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  const handleSubmit = async (payload: SurveyPayload) => {
    try {
      const res = await surveysApi.createSurvey(payload)
      const id = (res.data as { resourceId?: number } | undefined)?.resourceId
      navigate(id ? `/system/surveys/${id}` : '/system/surveys')
      return null
    } catch (err) {
      return apiErrorMessage(err, t('surveys.messages.createError'))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('surveys.title'), href: '/system/surveys' },
          { label: t('common:actions.create'), current: true },
        ]}
      />

      <SurveyForm
        title={t('surveys.create')}
        cancelPath="/system/surveys"
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default CreateSurvey
