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
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SpmSurveysApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'

import { apiErrorMessage, isSurveyActive, type Survey } from './types'

const surveysApi = new SpmSurveysApi(getConfiguration())

const bySequence = (a: { sequenceNo?: number }, b: { sequenceNo?: number }) =>
  (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0)

/** View Survey, with its questions and answer options, as in the Angular web app */
const ViewSurvey = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await surveysApi.findSurvey(Number(id))
        setSurvey((res.data ?? {}) as Survey)
      } catch (err) {
        setError(apiErrorMessage(err, t('surveys.messages.loadError')))
      }
    })()
  }, [id, t])

  const questions = [...(survey?.questionDatas ?? [])].sort(bySequence)

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('surveys.title'), href: '/system/surveys' },
          { label: survey?.name ?? id ?? '', current: true },
        ]}
      />

      {survey && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/system/surveys/${id}/edit`)}
          >
            <FontAwesomeIcon icon={faPen} className="mr-2" />
            {t('common:actions.edit')}
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {survey && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-3">
            <span className="font-medium">{t('surveys.fields.key')}</span>
            <span>{survey.key}</span>
            <span className="font-medium">{t('surveys.fields.name')}</span>
            <span>{survey.name}</span>
            <span className="font-medium">
              {t('surveys.fields.countryCode')}
            </span>
            <span>{survey.countryCode}</span>
            <span className="font-medium">
              {t('surveys.fields.description')}
            </span>
            <span>{survey.description || '—'}</span>
            <span className="font-medium">{t('surveys.fields.status')}</span>
            <span>
              {isSurveyActive(survey)
                ? t('surveys.status.active')
                : t('surveys.status.inactive')}
            </span>
          </div>

          <h3 className="text-lg font-semibold">
            {t('surveys.fields.questions')}
          </h3>
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('surveys.noQuestions')}
            </p>
          )}
          {questions.map((q, qi) => (
            <div key={q.id ?? qi} className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="font-medium">
                  {t('surveys.questionNumber', { number: qi + 1 })}: {q.text}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('surveys.fields.key')}: {q.key}
                  {q.description ? ` · ${q.description}` : ''}
                </p>
              </div>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3">
                        {t('surveys.fields.option')}
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        {t('surveys.fields.value')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(q.responseDatas ?? [])].sort(bySequence).map(r => (
                      <TableRow key={r.id ?? r.sequenceNo}>
                        <TableCell className="px-4 py-3">{r.text}</TableCell>
                        <TableCell className="px-4 py-3">{r.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ViewSurvey
