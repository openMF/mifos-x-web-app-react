/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

export type EnumOption = { id?: number; code?: string; value?: string }

/** GET /smscampaigns/{id} and the items of GET /smscampaigns */
export type SmsCampaign = {
  id?: number
  campaignName?: string
  campaignMessage?: string
  campaignStatus?: EnumOption
  campaignType?: EnumOption
  triggerType?: EnumOption
  providerId?: number
  runReportId?: number
  reportName?: string
  /** JSON string of the business rule parameters, including reportName */
  paramValue?: string
  recurrence?: string
  /** Epoch seconds as returned by GET /smscampaigns/{id} */
  recurrenceStartDate?: number[] | number | string
  isNotification?: boolean
  notification?: boolean
  smsCampaignTimeLine?: {
    submittedOnDate?: number[] | string
    submittedByUsername?: string
    activatedOnDate?: number[] | string
    activatedByUsername?: string
    closedOnDate?: number[] | string
    closedByUsername?: string
  }
}

export type BusinessRule = {
  reportId?: number
  reportName?: string
  reportSubType?: string
  reportDescription?: string
}

/** GET /smscampaigns/template */
export type SmsCampaignTemplate = {
  triggerTypeOptions?: EnumOption[]
  /** From the message gateway (SMS bridge): GET {gateway}/smsbridges */
  smsProviderOptions?: Array<{
    id?: number
    providerName?: string
    providerDescription?: string
    phoneNo?: string
  }>
  businessRulesOptions?: BusinessRule[]
}

/** One row of GET /runreports/FullParameterList */
export type ReportParameter = {
  name: string
  variable: string
  label: string
  displayType: string
  defaultVal?: string
  selectAll?: string
  parentParameterName?: string
  /** The query parameter name used to run the report: R_<variable> */
  inputName: string
}

export type SelectOption = { id: string; name: string }

/** Trigger types sent to Fineract, as in the Angular web app */
export const TRIGGER_SCHEDULE = 2
export const TRIGGER_TRIGGERED = 3

/** The date formats the Angular web app sends with every SMS campaign request */
export const DATE_FORMAT = 'dd MMMM yyyy'
/** Column sizes of sms_campaign.campaign_name and .message in Fineract */
export const MAX_CAMPAIGN_NAME = 100
export const MAX_MESSAGE = 480
export const DATE_TIME_FORMAT = 'dd MMMM yyyy HH:mm:ss'
export const LOCALE = 'en'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "2026-10-14" (a date input's value) -> "14 October 2026" */
export const toApiDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return ''
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** A Date -> yyyy-MM-ddTHH:mm in local time, for a datetime-local input */
const toDateTimeInput = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`

/** Now, for a datetime-local input's min */
export const nowInputValue = () => toDateTimeInput(new Date())

/**
 * A saved recurrence start ([2026, 10, 20, 9, 30], "2026-10-20T09:30:00" or
 * epoch seconds) -> yyyy-MM-ddTHH:mm for a datetime-local input.
 * GET /smscampaigns/{id} returns epoch seconds computed in the tenant's time
 * zone, which the browser converts back in its own, so the edit page shows
 * the value for the user to check instead of sending it back unseen.
 */
export const recurrenceStartInputValue = (
  value?: number[] | number | string
) => {
  if (
    typeof value === 'number' ||
    (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim()))
  )
    return toDateTimeInput(new Date(Number(value) * 1000))
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .split(/[-T:. ]/)
          .map(Number)
          .filter(n => !isNaN(n))
      : []
  const [y, m, d, h = 0, mi = 0] = parts
  if (!y || !m || !d) return ''
  return `${y}-${pad2(m)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`
}

/** "2026-10-20T09:30" -> "20 October 2026 09:30:00", in DATE_TIME_FORMAT */
export const dateTimeInputForApi = (value: string) => {
  const [date, time = '00:00'] = value.split('T')
  const day = toApiDate(date)
  return day ? `${day} ${time.slice(0, 5)}:00` : ''
}

export const rowToParameter = (row: string[]): ReportParameter => ({
  name: row[0],
  variable: row[1],
  label: row[2],
  displayType: row[3],
  defaultVal: row[5],
  selectAll: row[7],
  parentParameterName: row[8] || undefined,
  inputName: `R_${row[1]}`,
})

export const rowToOption = (row: Array<string | number>): SelectOption => ({
  id: String(row[0]),
  // Fineract indents option names with dots per hierarchy level
  name: String(row[1] ?? '').replace(/^\.+/, ''),
})

export const isNotification = (c?: SmsCampaign) =>
  Boolean(c?.isNotification ?? c?.notification)

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
