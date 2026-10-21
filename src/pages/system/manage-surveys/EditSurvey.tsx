/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { SpmSurveysApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import SurveyForm from './SurveyForm'
import { apiErrorMessage, type SurveyPayload } from './types'
import { useSurvey } from './useSurvey'

const surveysApi = new SpmSurveysApi(getConfiguration())

/** Edits a survey (PUT /surveys/{id}) */
const EditSurvey = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const result = useSurvey(id)
  const survey = result?.status === 'loaded' ? result.survey : undefined

  const handleSubmit = async (payload: SurveyPayload) => {
    try {
      await surveysApi.editSurvey(Number(id), payload)
      navigate(`/system/surveys/${id}`)
      return null
    } catch (err) {
      return apiErrorMessage(err, t('surveys.messages.updateError'))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('surveys.title'), href: '/system/surveys' },
          {
            label: survey?.name ?? id ?? '',
            href: `/system/surveys/${id}`,
          },
          { label: t('common:actions.edit'), current: true },
        ]}
      />

      {!result && <p role="status">{t('common:actions.loading')}</p>}

      {result?.status === 'failed' && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {apiErrorMessage(result.error, t('surveys.messages.loadError'))}
        </div>
      )}

      {survey && (
        <SurveyForm
          key={id}
          title={t('surveys.edit')}
          initial={survey}
          cancelPath={`/system/surveys/${id}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditSurvey
