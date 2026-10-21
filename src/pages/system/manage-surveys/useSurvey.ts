/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'

import { SpmSurveysApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import type { Survey } from './types'

const surveysApi = new SpmSurveysApi(getConfiguration())

type SurveyResult =
  | { id: string; status: 'loaded'; survey: Survey }
  | { id: string; status: 'failed'; error: unknown }

export const useSurvey = (id: string | undefined) => {
  const [result, setResult] = useState<SurveyResult>()

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const { signal } = controller

    surveysApi
      .findSurvey(Number(id), { signal })
      .then(({ data }) => {
        if (!signal.aborted) setResult({ id, status: 'loaded', survey: data })
      })
      .catch(error => {
        if (!signal.aborted) setResult({ id, status: 'failed', error })
      })

    return () => controller.abort()
  }, [id])

  return result?.id === id ? result : undefined
}
