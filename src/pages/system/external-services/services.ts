/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { AxiosError } from 'axios'
import type { ParseKeys } from 'i18next'

export type ServiceField = {
  name: string
  labelKey: ParseKeys<'organization'>
  /** Never shown, and only sent when the user types a new value */
  secret?: boolean
  boolean?: boolean
}

export type ExternalService = {
  /** Path segment of GET/PUT /externalservice/{name} */
  name: 'SMTP' | 'S3' | 'SMS' | 'NOTIFICATION'
  slug: string
  titleKey: ParseKeys<'organization'>
  fields: ServiceField[]
}

/** The services and fields of the Angular web app's External Services */
export const EXTERNAL_SERVICES: ExternalService[] = [
  {
    name: 'SMTP',
    slug: 'email',
    titleKey: 'serviceSettings.services.email',
    fields: [
      { name: 'username', labelKey: 'serviceSettings.fields.username' },
      {
        name: 'password',
        labelKey: 'serviceSettings.fields.password',
        secret: true,
      },
      { name: 'host', labelKey: 'serviceSettings.fields.host' },
      { name: 'port', labelKey: 'serviceSettings.fields.port' },
      {
        name: 'useTLS',
        labelKey: 'serviceSettings.fields.useTls',
        boolean: true,
      },
      { name: 'fromEmail', labelKey: 'serviceSettings.fields.fromEmail' },
      { name: 'fromName', labelKey: 'serviceSettings.fields.fromName' },
    ],
  },
  {
    name: 'S3',
    slug: 'amazon-s3',
    titleKey: 'serviceSettings.services.amazonS3',
    fields: [
      { name: 's3_access_key', labelKey: 'serviceSettings.fields.accessKey' },
      { name: 's3_bucket_name', labelKey: 'serviceSettings.fields.bucketName' },
      {
        name: 's3_secret_key',
        labelKey: 'serviceSettings.fields.secretKey',
        secret: true,
      },
    ],
  },
  {
    name: 'SMS',
    slug: 'sms',
    titleKey: 'serviceSettings.services.smsGateway',
    fields: [
      { name: 'host_name', labelKey: 'serviceSettings.fields.host' },
      { name: 'port_number', labelKey: 'serviceSettings.fields.port' },
      { name: 'end_point', labelKey: 'serviceSettings.fields.endPoint' },
      {
        name: 'tenant_app_key',
        labelKey: 'serviceSettings.fields.tenantAppKey',
        secret: true,
      },
    ],
  },
  {
    name: 'NOTIFICATION',
    slug: 'notification',
    titleKey: 'serviceSettings.services.pushNotification',
    fields: [
      {
        name: 'server_key',
        labelKey: 'serviceSettings.fields.serverKey',
        secret: true,
      },
      { name: 'gcm_end_point', labelKey: 'serviceSettings.fields.gcmEndPoint' },
      { name: 'fcm_end_point', labelKey: 'serviceSettings.fields.fcmEndPoint' },
    ],
  },
]

/** GET /externalservice/{name} returns [{ name, value? }] */
export type ServiceProperty = { name: string; value?: string }

export const toValues = (properties: ServiceProperty[]) =>
  Object.fromEntries(properties.map(p => [p.name, p.value ?? '']))

/** The edit form's starting values: secrets start empty, the rest as stored */
export const initialForm = (
  service: ExternalService,
  values: Record<string, string>
) =>
  Object.fromEntries(
    service.fields.map(f => [f.name, f.secret ? '' : (values[f.name] ?? '')])
  )

/**
 * The PUT /externalservice/{name} body: only the fields that changed. A
 * secret is sent only when a new value is typed, because GET returns some
 * secrets masked (s****rt81) and PUT would store the masked text.
 */
export const buildServiceUpdate = (
  service: ExternalService,
  original: Record<string, string>,
  form: Record<string, string>
): Record<string, string> =>
  Object.fromEntries(
    service.fields
      .filter(f =>
        f.secret
          ? (form[f.name] ?? '') !== ''
          : (form[f.name] ?? '') !== (original[f.name] ?? '')
      )
      .map(f => [f.name, form[f.name]])
  )

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** Fineract's own message, if the error response has one */
export const apiErrorMessage = (err: unknown) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage || data?.defaultUserMessage || null
  )
}

/** A failed request: Fineract's message, else a fallback picked by kind */
export type ServiceError = {
  message: string | null
  kind: 'loadServices' | 'loadSettings' | 'saveSettings'
}
