/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { ClientApi, type ClientData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'
import {
  DataFieldGrid,
  DataSection,
  type DataField,
} from '@/components/custom/data-field-grid/DataFieldGrid'
import type clientsEn from '@/locales/en-US/clients.json'

import { hasValue, isLegalEntity } from '../general-data-tab/generalDataUtils'
import ClientsIdentitiesTab from '../Identities-tab/ClientsidentitiesTab'
import ClientsDocumentsTab from '../documents-tab/ClientsDocumentsTab'

// Built per call so each request carries the current credentials.
const clientApi = () => new ClientApi(getConfiguration())

type FieldKey = keyof (typeof clientsEn)['personalData']['fields']

/** The details Fineract keeps for a legal entity; typed only as `object` in the spec. */
interface NonPersonDetails {
  constitution?: { name?: string }
  mainBusinessLine?: { name?: string }
  incorpValidityTillDate?: number[] | string
  incorpNumber?: string
  remarks?: string
}

/** Fineract sends dates as `[year, month, day]`, although the spec types them as strings. */
type FineractDate = number[] | string | undefined

/**
 * A read-only summary of the client: personal or entity details, account,
 * contact, classification, group, date and status information, followed by
 * the client's identities and documents.
 */
const ClientsPersonalDataTab = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++loadIdRef.current
    const clientId = Number(id)
    if (!id || Number.isNaN(clientId)) {
      setClient(null)
      setFailed(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setFailed(false)

    const load = async () => {
      try {
        const res = await clientApi().retrieveOne11(clientId)
        if (requestId !== loadIdRef.current) return
        // The generated response type leaves out most of the fields shown
        // here, which the full client payload carries (see ISSUES.md).
        setClient(res.data as unknown as ClientData)
      } catch (err) {
        if (requestId !== loadIdRef.current) return
        console.error('Failed to load client', err)
        setClient(null)
        setFailed(true)
      } finally {
        if (requestId === loadIdRef.current) setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <p className="text-sm text-zinc-500">{t('personalData.loading')}</p>
  }
  if (failed || !client) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {t('personalData.loadFailed')}
      </p>
    )
  }

  const isEntity = isLegalEntity(client)
  const nonPersonDetails = client.clientNonPersonDetails as
    | NonPersonDetails
    | undefined

  /** A formatted date, or an empty string when there is none. */
  const date = (value: unknown) =>
    formatDate(value as FineractDate, i18n.language, '')

  const field = (key: FieldKey, value: ReactNode, wide?: boolean) => ({
    key,
    label: t(`personalData.fields.${key}`),
    value,
    wide,
  })
  /** A field that is left out when the client has no value for it. */
  const optional = (
    key: FieldKey,
    value: ReactNode,
    wide?: boolean
  ): DataField[] => (hasValue(value) ? [field(key, value, wide)] : [])
  /** A field that is always shown, with a dash in place of a missing value. */
  const required = (key: FieldKey, value: ReactNode) =>
    field(key, hasValue(value) ? value : '—')

  const personalFields: DataField[] = [
    ...optional('displayName', client.displayName),
    ...(isEntity
      ? [
          ...optional('entityName', client.fullname),
          ...optional('incorporationDate', date(client.dateOfBirth)),
        ]
      : [
          ...optional('firstName', client.firstname),
          ...optional('middleName', client.middlename),
          ...optional('lastName', client.lastname),
          ...optional('dateOfBirth', date(client.dateOfBirth)),
          ...optional('gender', client.gender?.name),
          field('isStaff', tc(client.isStaff ? 'actions.yes' : 'actions.no')),
        ]),
    ...optional('legalForm', client.legalForm?.value),
  ]

  const accountFields: DataField[] = [
    required('accountNo', client.accountNo),
    // Sent as a plain string, although the spec types it as an object.
    required('externalId', client.externalId as unknown as string),
    required('office', client.officeName),
    field('staff', client.staffName || t('personalData.unassigned')),
    ...optional('defaultSavingsAccount', client.savingsAccountId),
  ]

  const entityFields: DataField[] = nonPersonDetails
    ? [
        ...optional('constitution', nonPersonDetails.constitution?.name),
        ...optional(
          'mainBusinessLine',
          nonPersonDetails.mainBusinessLine?.name
        ),
        ...optional(
          'incorporationValidityTillDate',
          date(nonPersonDetails.incorpValidityTillDate)
        ),
        ...optional('incorporationNumber', nonPersonDetails.incorpNumber),
        ...optional('remarks', nonPersonDetails.remarks, true),
      ]
    : []

  const contactFields: DataField[] = [
    required('mobileNumber', client.mobileNo),
    required('email', client.emailAddress),
  ]

  const classificationFields: DataField[] = [
    ...optional('clientType', client.clientType?.name),
    ...optional('clientClassification', client.clientClassification?.name),
  ]

  const groupFields: DataField[] = (client.groups ?? []).map(group => ({
    key: `group-${group.id}`,
    label: t('personalData.fields.group'),
    value: (
      <Link
        to={`/groups/${group.id}/general`}
        className="text-[#0e77b7] hover:underline dark:text-sky-400"
      >
        {group.name}
      </Link>
    ),
  }))

  const dateFields: DataField[] = [
    ...optional('submittedOn', date(client.timeline?.submittedOnDate)),
    ...optional('activationDate', date(client.activationDate)),
    ...optional('closedDate', date(client.timeline?.closedOnDate)),
  ]

  const statusFields: DataField[] = [
    ...optional('clientStatus', client.status?.value),
    ...optional('subStatus', client.subStatus?.name),
  ]

  return (
    <div className="space-y-8">
      <DataSection title={t('personalData.headings.personalInformation')}>
        <DataFieldGrid fields={personalFields} />
      </DataSection>

      <DataSection title={t('personalData.headings.accountInformation')}>
        <DataFieldGrid fields={accountFields} />
      </DataSection>

      {isEntity && entityFields.length > 0 && (
        <DataSection title={t('personalData.headings.entityDetails')}>
          <DataFieldGrid fields={entityFields} />
        </DataSection>
      )}

      <DataSection title={t('personalData.headings.contactInformation')}>
        <DataFieldGrid fields={contactFields} />
      </DataSection>

      <DataSection title={t('personalData.headings.classification')}>
        {classificationFields.length > 0 ? (
          <DataFieldGrid fields={classificationFields} />
        ) : (
          <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
            {t('personalData.noClassification')}
          </p>
        )}
      </DataSection>

      {groupFields.length > 0 && (
        <DataSection title={t('personalData.headings.groupMembership')}>
          <DataFieldGrid fields={groupFields} />
        </DataSection>
      )}

      {dateFields.length > 0 && (
        <DataSection title={t('personalData.headings.importantDates')}>
          <DataFieldGrid fields={dateFields} />
        </DataSection>
      )}

      {statusFields.length > 0 && (
        <DataSection title={t('personalData.headings.status')}>
          <DataFieldGrid fields={statusFields} />
        </DataSection>
      )}

      {/* The client's identities and documents, as on their own tabs. */}
      <ClientsIdentitiesTab />
      <ClientsDocumentsTab />
    </div>
  )
}

export default ClientsPersonalDataTab
