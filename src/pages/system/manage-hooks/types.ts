/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'

export type HookEvent = { entityName: string; actionName: string }

/** GET /hooks and GET /hooks/{id} */
export type Hook = {
  id?: number
  /** The template, e.g. Web or SMS Bridge */
  name?: string
  displayName?: string
  isActive?: boolean
  /** LocalDate, sent as [year, month, day] */
  createdAt?: number[]
  updatedAt?: number[]
  events?: HookEvent[]
  config?: Array<{ fieldName: string; fieldValue?: string }>
}

export type SchemaField = {
  fieldName: string
  fieldType?: string
  optional?: boolean
  placeholder?: string
}

/** GET /hooks/template */
export type HooksTemplate = {
  templates?: Array<{ id?: number; name: string; schema: SchemaField[] }>
  groupings?: Array<{
    name: string
    entities: Array<{ name: string; actions: string[] }>
  }>
}

/** The body of POST /hooks and PUT /hooks/{id} */
export type HookPayload = {
  name: string
  displayName: string
  isActive: boolean
  events: HookEvent[]
  config: Record<string, string>
}

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    args?: Array<{ value?: unknown }>
    userMessageGlobalisationCode?: string
  }>
}

/** The server's message for a failed request, if it sent one */
export const apiErrorMessage = (err: unknown): string | undefined => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  const first = data?.errors?.[0]
  // e.g. "required.config.field.not.provided" names the field in args
  if (first?.userMessageGlobalisationCode?.includes('config.field')) {
    return `${first.defaultUserMessage} (${first.args?.[0]?.value ?? ''})`
  }
  return first?.defaultUserMessage || data?.defaultUserMessage || undefined
}

/**
 * A failed request: the server's message, or the key of the translated
 * fallback (organization:hooks.errors.*), so effects need not depend on t.
 */
export type HookRequestError = {
  message?: string
  fallback:
    | 'create'
    | 'delete'
    | 'loadHook'
    | 'loadHooks'
    | 'loadTemplates'
    | 'update'
}

/** SHAREACCOUNT -> Shareaccount, loan_reschedule -> Loan Reschedule */
export const humanize = (code?: string) =>
  (code ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/** Config fields that hold a credential (e.g. SMS Provider Token): never shown */
export const isSecretField = (fieldName: string) =>
  /token|password|secret|api key/i.test(fieldName)

/** The first required setting of the template's schema that is still empty */
export const firstMissingField = (
  schema: SchemaField[],
  config: Record<string, string>
) => schema.find(f => !f.optional && !(config[f.fieldName] ?? '').trim())

/**
 * The config sent to Fineract: only the chosen template's fields (values
 * kept from another template are dropped), trimmed, empty optional ones
 * left out.
 */
export const hookConfigPayload = (
  schema: SchemaField[],
  config: Record<string, string>
): Record<string, string> =>
  Object.fromEntries(
    schema
      .map(f => [f.fieldName, (config[f.fieldName] ?? '').trim()])
      .filter(([, v]) => v !== '')
  )

/** True when the event is already in the list */
export const hasEvent = (events: HookEvent[], event: HookEvent) =>
  events.some(
    e => e.entityName === event.entityName && e.actionName === event.actionName
  )
