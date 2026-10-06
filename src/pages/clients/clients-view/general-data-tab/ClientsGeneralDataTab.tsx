/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

import {
  DISPLAY_SECTIONS,
  LEGAL_ENTITY_FIELDS,
  TAX_ADDRESS_FIELDS,
  type DisplayGroup,
  type DisplaySection,
  type EntityFieldConfig,
  type FieldKey,
  type SectionKey,
} from './generalDataConfig'
import {
  hasValue,
  isLegalEntity,
  normalizeYesNoValue,
  readObjectValue,
  readRecordValue,
  type DatatableRecord,
} from './generalDataUtils'
import { useGeneralData, type GeneralData } from './useGeneralData'

interface DisplayField {
  label: FieldKey
  value: unknown
  date?: boolean
  wide?: boolean
}

/** A Yes/No answer, shown as two pills with the given answer highlighted. */
const YesNoIndicator = ({
  label,
  value,
}: {
  label: string
  value: unknown
}) => {
  const { t } = useTranslation('clients')
  const answer = normalizeYesNoValue(value)
  // The pills are read-only, so the answer goes in the group's name rather
  // than in a toggle state.
  return (
    <span
      role="group"
      aria-label={answer ? `${label}: ${t(`generalData.${answer}`)}` : label}
      className="mt-1 flex gap-2"
    >
      {(['yes', 'no'] as const).map(option => (
        <span
          key={option}
          className={cn(
            'inline-flex h-7 min-w-14 items-center justify-center rounded-md border px-3 text-xs',
            answer === option
              ? 'border-[#0e77b7] bg-[#0e77b7]/15 font-semibold text-[#0e77b7] dark:text-sky-300'
              : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'
          )}
        >
          {t(`generalData.${option}`)}
        </span>
      ))}
    </span>
  )
}

const FieldGrid = ({ fields }: { fields: DisplayField[] }) => {
  const { t, i18n } = useTranslation('clients')

  const display = (field: DisplayField) => {
    if (!hasValue(field.value)) return '—'
    if (field.date) {
      return formatDate(
        field.value as number[] | string,
        i18n.language,
        String(field.value)
      )
    }
    if (typeof field.value === 'boolean') {
      return t(field.value ? 'generalData.yes' : 'generalData.no')
    }
    return String(field.value)
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map(field => {
        const label = t(`generalData.fields.${field.label}`)
        return (
          <div
            key={field.label}
            className={cn(
              'rounded-md border border-zinc-200 p-3 dark:border-zinc-700',
              field.wide && 'lg:col-span-2'
            )}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-[#0e77b7] dark:text-sky-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm break-words text-black dark:text-white">
              {field.label === 'yesNo' ? (
                <YesNoIndicator label={label} value={field.value} />
              ) : (
                display(field)
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

const Section = ({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) => (
  <section className="space-y-3">
    {title && (
      <h3 className="border-b border-zinc-200 pb-2 text-lg font-semibold uppercase text-black dark:border-zinc-700 dark:text-white">
        {title}
      </h3>
    )}
    {children}
  </section>
)

/** The fields of a group, read from each of its section's entries. */
const groupRecords = (
  section: DisplaySection,
  group: DisplayGroup,
  records: DatatableRecord[]
): DisplayField[][] => {
  const configs = group.fields
    ? group.fields.flatMap(
        label => section.fields.find(field => field.label === label) ?? []
      )
    : section.fields
  // An empty section still shows its fields, so missing information is visible.
  const entries = records.length ? records : [[]]
  return entries.map(record =>
    configs.map(config => ({
      label: config.label,
      value: readRecordValue(record, config.patterns),
      date: config.date,
    }))
  )
}

const legalEntityFields = (data: GeneralData): DisplayField[] => {
  const client = data.client
  const nonPersonDetails = (client as { clientNonPersonDetails?: unknown })
    ?.clientNonPersonDetails

  const datatableValue = (patterns: string[], keys?: SectionKey[]) => {
    const records = keys
      ? keys.flatMap(key => data.sections[key] ?? [])
      : Object.values(data.sections).flat()
    for (const record of records) {
      const value = readRecordValue(record, patterns)
      if (hasValue(value)) return value
    }
    return ''
  }

  const identifierValue = (types: RegExp[]) =>
    data.identifiers.find(identifier => {
      const type = identifier.documentType
      const text = `${type?.name ?? ''} ${type?.description ?? ''}`
      return types.some(pattern => pattern.test(text))
    })?.documentKey ?? ''

  const valueOf = (field: EntityFieldConfig) =>
    readObjectValue(client, field.clientFields) ||
    readObjectValue(nonPersonDetails, field.clientFields) ||
    (field.patterns && datatableValue(field.patterns, field.sections)) ||
    (field.identifierTypes && identifierValue(field.identifierTypes)) ||
    ''

  return LEGAL_ENTITY_FIELDS.map(field => ({
    label: field.label,
    value: valueOf(field),
    date: field.date,
  }))
}

const taxAddressFields = (data: GeneralData): DisplayField[] => {
  const address =
    data.addresses.find(item => /tax/i.test(item.addressType ?? '')) ??
    data.addresses.find(item => item.isActive) ??
    data.addresses[0]
  return TAX_ADDRESS_FIELDS.map(field => ({
    label: field.label,
    value: readObjectValue(address, field.addressFields),
    wide: field.wide,
  }))
}

/**
 * The KYC information of a legal entity client: its legal details, tax
 * address and the answers held in the entity data tables.
 */
const ClientsGeneralDataTab = () => {
  const { id } = useParams()
  const { t } = useTranslation('clients')
  const data = useGeneralData(id)

  if (data.loading) {
    return <p className="text-sm text-zinc-500">{t('generalData.loading')}</p>
  }
  if (data.failed) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {t('generalData.loadFailed')}
      </p>
    )
  }
  if (!isLegalEntity(data.client)) {
    return (
      <p className="text-sm text-zinc-500">{t('generalData.entityOnly')}</p>
    )
  }

  return (
    <div className="space-y-8">
      <Section title={t('generalData.headings.legalEntityDetails')}>
        <FieldGrid fields={legalEntityFields(data)} />
      </Section>

      <Section title={t('generalData.headings.taxAddress')}>
        <FieldGrid fields={taxAddressFields(data)} />
      </Section>

      {DISPLAY_SECTIONS.map((section, index) => {
        // Consecutive sections sharing a title appear under one heading.
        const showTitle =
          index === 0 || DISPLAY_SECTIONS[index - 1].title !== section.title
        return (
          <Section
            key={section.key}
            title={
              showTitle ? t(`generalData.headings.${section.title}`) : undefined
            }
          >
            {section.groups.map((group, groupIndex) => {
              const records = groupRecords(
                section,
                group,
                data.sections[section.key] ?? []
              )
              return (
                <div key={groupIndex} className="space-y-3">
                  {group.subtitle && (
                    <h4 className="text-sm font-semibold uppercase text-black dark:text-white">
                      {t(`generalData.headings.${group.subtitle}`)}
                    </h4>
                  )}
                  {group.questions?.map(question => (
                    <p
                      key={question}
                      className="text-sm leading-relaxed text-black dark:text-white"
                    >
                      {t(`generalData.questions.${question}`)}
                    </p>
                  ))}
                  {group.helperTexts?.map(text => (
                    <p
                      key={text}
                      className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400"
                    >
                      {t(`generalData.questions.${text}`)}
                    </p>
                  ))}
                  {records.map((fields, recordIndex) => (
                    <div
                      key={recordIndex}
                      className="space-y-2 border-b border-zinc-200 pb-4 last:border-b-0 dark:border-zinc-700"
                    >
                      {records.length > 1 && (
                        <p className="text-xs font-bold uppercase text-zinc-500">
                          {t('generalData.record', {
                            number: recordIndex + 1,
                          })}
                        </p>
                      )}
                      <FieldGrid fields={fields} />
                    </div>
                  ))}
                </div>
              )
            })}
          </Section>
        )
      })}
    </div>
  )
}

export default ClientsGeneralDataTab
