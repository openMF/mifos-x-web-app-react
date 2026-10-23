/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

/** One answer option of a question */
export type SurveyResponse = {
  id?: number
  text?: string
  value?: number
  sequenceNo?: number
}

export type SurveyQuestion = {
  id?: number
  key?: string
  text?: string
  description?: string
  sequenceNo?: number
  responseDatas?: SurveyResponse[]
}

/** GET /surveys and GET /surveys/{id} */
export type Survey = {
  id?: number
  key?: string
  name?: string
  countryCode?: string
  description?: string
  validFrom?: string
  validTo?: string
  questionDatas?: SurveyQuestion[]
}

/** The body of POST /surveys and PUT /surveys/{id} */
export type SurveyPayload = {
  key: string
  name: string
  countryCode: string
  description: string
  questionDatas: {
    key: string
    text: string
    description: string
    sequenceNo: number
    responseDatas: { text: string; value: number; sequenceNo: number }[]
  }[]
}

/**
 * Fineract keeps no status flag: a survey is active while today falls
 * between validFrom and validTo (both yyyy-MM-dd), as in the Angular web app
 */
export const isSurveyActive = (survey: Survey) => {
  const today = new Date().toISOString().split('T')[0]
  return (
    !!survey.validFrom &&
    !!survey.validTo &&
    today >= survey.validFrom &&
    today <= survey.validTo
  )
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

export const apiErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}
