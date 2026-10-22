/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

/** One run of a job, from GET /jobs (lastRunHistory) or GET /jobs/{id}/runhistory */
export type JobRun = {
  id?: number
  jobRunStartTime?: string
  jobRunEndTime?: string
  status?: string
  triggerType?: string
  jobRunErrorMessage?: string
  jobRunErrorLog?: string
}

/** GET /jobs and GET /jobs/{id} */
export type SchedulerJob = {
  jobId?: number
  displayName?: string
  shortName?: string
  nextRunTime?: string
  cronExpression?: string
  active?: boolean
  currentlyRunning?: boolean
  initializingError?: string
  lastRunHistory?: JobRun
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** The message Fineract sent with a failed request, if any */
export const apiErrorDetail = (err: unknown): string | undefined => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    undefined
  )
}

/** Keys of organization:jobs.errors, the fallbacks shown when Fineract sends no message */
export type JobsErrorKey =
  | 'changeStatus'
  | 'cronRequired'
  | 'loadHistory'
  | 'loadJob'
  | 'loadJobs'
  | 'nameRequired'
  | 'updateJob'

/**
 * An error to show: Fineract's message (detail) or the translated fallback
 * (key), or a text already put together. Translated at render.
 */
export type JobsError =
  | { key: JobsErrorKey; detail?: string }
  | { text: string }

/** Fineract sends ISO instants such as 2026-10-14T18:31:00Z */
export const formatDateTime = (value?: string, locale?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}
