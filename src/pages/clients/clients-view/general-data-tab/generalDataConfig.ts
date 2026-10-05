/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type clientsEn from '@/locales/en-US/clients.json'

type GeneralDataStrings = (typeof clientsEn)['generalData']

export type FieldKey = keyof GeneralDataStrings['fields']
export type HeadingKey = keyof GeneralDataStrings['headings']
export type QuestionKey = keyof GeneralDataStrings['questions']

/**
 * The data tables the General Data tab reads for a legal entity, keyed by the
 * section that shows them. Only tables registered under exactly these names
 * are read.
 */
export const ENTITY_DATATABLES = {
  entityLegalDetails: 'entity_legal_details',
  legalRepresentative: 'entity_legal_representative',
  addressLegalRepresentative: 'entity_address_legal_representative',
  authorizedRepresentative: 'entity_authorized_representative',
  addressAuthorizedRepresentative: 'entity_address_authorized_representative',
  pepRelatedIndividuals: 'entity_pep_related_individuals',
  resourceProviderBeneficialOwner: 'entity_resource_provider_beneficial_owner',
  transactionalProfile: 'entity_transactional_profile',
  shareholdingIndividuals: 'entity_shareholding_individuals',
  shareholdingLegalEntities: 'entity_shareholding_legal_entities',
  uboLegalEntities: 'entity_ubo_legal_entities',
  uboNaturalPersons: 'entity_ubo_natural_persons',
  controllingPersonPepQuestions: 'entity_controlling_person_pep_questions',
} as const

export type SectionKey = keyof typeof ENTITY_DATATABLES

/** A field read from a data table record, found by its column's label. */
export interface RecordFieldConfig {
  label: FieldKey
  /** Normalised column labels to look for; an exact match wins over a partial one. */
  patterns: string[]
  date?: boolean
}

/** One block of records under a section, with the questions that introduce it. */
export interface DisplayGroup {
  subtitle?: HeadingKey
  questions?: QuestionKey[]
  helperTexts?: QuestionKey[]
  /** The fields shown, in order; every field of the section when omitted. */
  fields?: FieldKey[]
}

export interface DisplaySection {
  key: SectionKey
  title: HeadingKey
  fields: RecordFieldConfig[]
  groups: DisplayGroup[]
}

const personNameFields: RecordFieldConfig[] = [
  {
    label: 'middleName',
    patterns: ['middle name', 'middle name s', 'middlename'],
  },
  { label: 'lastName', patterns: ['last name', 'last name s', 'lastname'] },
  {
    label: 'names',
    patterns: ['name s', 'names', 'first name', 'firstname', 'name'],
  },
  { label: 'taxId', patterns: ['tax id', 'tax number', 'rfc'] },
]

const representativeFields: RecordFieldConfig[] = [
  ...personNameFields,
  {
    label: 'birthdate',
    patterns: ['birthdate', 'birth date', 'date of birth'],
    date: true,
  },
  { label: 'countryOfBirth', patterns: ['country of birth', 'birth country'] },
  { label: 'email', patterns: ['email', 'email address'] },
]

const representativeAddressFields: RecordFieldConfig[] = [
  { label: 'address', patterns: ['address', 'street'] },
  { label: 'neighborhood', patterns: ['neighborhood', 'colony', 'colonia'] },
  { label: 'zipCode', patterns: ['zip code', 'postal code'] },
  { label: 'state', patterns: ['state', 'province'] },
  {
    label: 'boroughCity',
    patterns: [
      'borough city delegation municipality locality town',
      'borough',
      'city',
      'municipality',
      'locality',
    ],
  },
]

const sharesPercentPatterns = ['of shares', 'shares']
const levelOfControl: RecordFieldConfig = {
  label: 'levelOfControl',
  patterns: ['level of control', 'control level'],
}

/** The data table sections, in the order the tab shows them. */
export const DISPLAY_SECTIONS: DisplaySection[] = [
  {
    key: 'legalRepresentative',
    title: 'legalRepresentative',
    fields: representativeFields,
    groups: [{}],
  },
  {
    key: 'addressLegalRepresentative',
    title: 'addressLegalRepresentative',
    fields: representativeAddressFields,
    groups: [{}],
  },
  {
    key: 'authorizedRepresentative',
    title: 'authorizedRepresentative',
    fields: representativeFields,
    groups: [{}],
  },
  {
    key: 'addressAuthorizedRepresentative',
    title: 'addressAuthorizedRepresentative',
    fields: representativeAddressFields,
    groups: [{}],
  },
  {
    key: 'pepRelatedIndividuals',
    title: 'pepRelatedIndividuals',
    fields: [
      { label: 'yesNo', patterns: ['yes no', 'answer', 'pep', 'question 1'] },
      { label: 'name', patterns: ['name'] },
      { label: 'affiliation', patterns: ['affiliation', 'institution'] },
      { label: 'position', patterns: ['position', 'level and charge'] },
      {
        label: 'reportingPeriod',
        patterns: ['reporting period', 'period reported'],
      },
      { label: 'relationship', patterns: ['relationship'] },
      {
        label: 'mainActivities',
        patterns: ['main activities', 'key functions'],
      },
      {
        label: 'periodReported',
        patterns: ['period reported', 'reporting period'],
      },
    ],
    groups: [
      {
        questions: ['pepIntro', 'pepQuestion1'],
        fields: ['yesNo', 'name', 'affiliation', 'position', 'reportingPeriod'],
      },
      {
        questions: ['pepQuestion2'],
        fields: [
          'yesNo',
          'name',
          'relationship',
          'affiliation',
          'position',
          'mainActivities',
          'periodReported',
        ],
      },
    ],
  },
  {
    key: 'resourceProviderBeneficialOwner',
    title: 'resourceProviderBeneficialOwner',
    fields: [
      {
        label: 'yesNo',
        patterns: ['yes no', 'answer', 'declared', 'third party'],
      },
    ],
    groups: [
      {
        questions: ['resourceProviderQuestion1'],
        helperTexts: ['uboInterview'],
      },
      {
        questions: ['resourceProviderQuestion2'],
        helperTexts: ['resourceProviderInterview'],
      },
    ],
  },
  {
    key: 'transactionalProfile',
    title: 'transactionalProfile',
    fields: [
      {
        label: 'monthlyIncomeAmount',
        patterns: ['monthly income amount', 'monthly income', 'income amount'],
      },
      {
        label: 'monthlyExpenditureAmount',
        patterns: [
          'monthly expenditure amount',
          'monthly expenditure',
          'expenditure amount',
        ],
      },
      {
        label: 'fundsOrigin',
        patterns: [
          'funds to open the account',
          'source of funds',
          'funds come from',
        ],
      },
      {
        label: 'resourcesAllocation',
        patterns: [
          'allocation of resources for operations',
          'allocation of resources',
          'resources for operations',
        ],
      },
    ],
    groups: [{}],
  },
  {
    key: 'shareholdingIndividuals',
    title: 'shareholdingIndividuals',
    fields: [
      ...personNameFields,
      {
        label: 'numberOfShares',
        patterns: ['number of shares', 'no of shares', 'shares number'],
      },
      { label: 'percentOfShares', patterns: sharesPercentPatterns },
      { label: 'nationalId', patterns: ['national id', 'national identifier'] },
      {
        label: 'singleFamilyUse',
        patterns: ['single family residential building', 'use'],
      },
      { label: 'nationality', patterns: ['nationality'] },
      {
        label: 'economicActivity',
        patterns: ['economic activity', 'activity'],
      },
      {
        label: 'spouseFullName',
        patterns: ['spouse full name', 'spouse name', 'full name'],
      },
    ],
    groups: [{}],
  },
  {
    key: 'shareholdingLegalEntities',
    title: 'shareholdingLegalEntities',
    fields: [
      {
        label: 'nameOrCorporateName',
        patterns: ['name or corporate name', 'corporate name', 'name'],
      },
      { label: 'taxId', patterns: ['tax id', 'tax number', 'rfc'] },
      {
        label: 'dateOfIncorporation',
        patterns: ['date of incorporation', 'incorporation date'],
        date: true,
      },
      {
        label: 'numberOfShares',
        patterns: ['no of shares', 'number of shares'],
      },
      { label: 'sharesPercent', patterns: ['shares', 'of shares'] },
      { label: 'nationality', patterns: ['nationality'] },
      {
        label: 'economicActivity',
        patterns: ['economic activity', 'activity'],
      },
    ],
    groups: [{}],
  },
  {
    key: 'uboLegalEntities',
    title: 'declarationUbo',
    fields: [
      {
        label: 'nameOrCorporateName',
        patterns: ['name or corporate name', 'corporate name', 'name'],
      },
      { label: 'sharesPercent', patterns: ['shares', 'of shares'] },
      { label: 'taxId', patterns: ['tax id', 'tax number', 'rfc'] },
      levelOfControl,
    ],
    groups: [{ subtitle: 'legalEntity' }],
  },
  {
    key: 'uboNaturalPersons',
    title: 'declarationUbo',
    fields: [
      ...personNameFields,
      { label: 'nationalId', patterns: ['national id', 'national identifier'] },
      {
        label: 'positionWithinEntity',
        patterns: ['position within the entity', 'position'],
      },
      { label: 'percentOfShares', patterns: sharesPercentPatterns },
      levelOfControl,
    ],
    groups: [{ subtitle: 'naturalPerson' }],
  },
  {
    key: 'controllingPersonPepQuestions',
    title: 'controllingPersonPep',
    fields: [
      { label: 'yesNo', patterns: ['yes no', 'answer', 'question'] },
      { label: 'name', patterns: ['name'] },
      { label: 'institution', patterns: ['institution', 'affiliation'] },
      { label: 'levelAndCharge', patterns: ['level and charge', 'position'] },
      { label: 'keyFunctions', patterns: ['key functions', 'main activities'] },
      {
        label: 'reportingPeriod',
        patterns: ['reporting period', 'period reported'],
      },
      { label: 'relationship', patterns: ['relationship'] },
    ],
    groups: [
      {
        questions: ['controllingPersonQuestion1'],
        fields: [
          'yesNo',
          'name',
          'institution',
          'levelAndCharge',
          'keyFunctions',
          'reportingPeriod',
        ],
      },
      {
        questions: ['controllingPersonQuestion2'],
        fields: [
          'yesNo',
          'name',
          'relationship',
          'institution',
          'levelAndCharge',
          'keyFunctions',
          'reportingPeriod',
        ],
      },
    ],
  },
]

/**
 * A fixed field of the Legal Entity Details section. It is read from the
 * client first, then from the entity data tables, then from an identifier.
 */
export interface EntityFieldConfig {
  label: FieldKey
  clientFields: string[]
  patterns?: string[]
  /** Limits the data table lookup to these sections; every section when omitted. */
  sections?: SectionKey[]
  /** Identifier document types whose key can stand in for the value. */
  identifierTypes?: RegExp[]
  date?: boolean
}

export const LEGAL_ENTITY_FIELDS: EntityFieldConfig[] = [
  { label: 'nameOrCorporateName', clientFields: ['fullname', 'displayName'] },
  {
    label: 'taxId',
    clientFields: ['taxId', 'taxID', 'taxNumber', 'rfc'],
    patterns: ['tax id', 'tax number', 'rfc'],
    identifierTypes: [/tax/i, /\brfc\b/i],
  },
  {
    label: 'digitalId',
    clientFields: ['digitalId', 'digitalID'],
    patterns: ['digital id', 'digital identifier'],
  },
  {
    label: 'deedNumber',
    clientFields: ['deedNumber', 'deedNo'],
    patterns: ['deed no', 'deed number'],
  },
  {
    label: 'dateOfDeed',
    clientFields: ['dateOfDeed', 'deedDate'],
    patterns: ['date of deed', 'deed date'],
    date: true,
  },
  {
    label: 'notaryOffice',
    clientFields: ['notaryOffice'],
    patterns: ['notary office'],
  },
  {
    label: 'notaryName',
    clientFields: ['notaryName', 'nameOfNotary'],
    patterns: ['name of notary', 'notary name'],
  },
  {
    label: 'electronicReferenceNumber',
    clientFields: ['electronicReferenceNumber'],
    patterns: ['electronic reference number', 'electronic reference'],
  },
  {
    label: 'dateOfIncorporation',
    clientFields: ['dateOfBirth', 'dateOfIncorporation'],
    patterns: ['date of incorporation', 'incorporation date'],
    sections: ['entityLegalDetails'],
    date: true,
  },
  {
    label: 'registrationDate',
    clientFields: ['registrationDate'],
    patterns: ['registration date', 'registration data'],
    sections: ['entityLegalDetails'],
    date: true,
  },
  {
    label: 'natureOfBusiness',
    clientFields: ['businessActivity', 'corporatePurpose', 'mainBusinessLine'],
    patterns: [
      'nature of business',
      'business activity',
      'corporate purpose',
      'main business line',
    ],
    sections: ['entityLegalDetails'],
  },
  {
    label: 'nationality',
    clientFields: ['nationality'],
    patterns: ['nationality'],
  },
  { label: 'phone', clientFields: ['mobileNo', 'mobileNumber'] },
  { label: 'email', clientFields: ['emailAddress', 'email'] },
]

/** A field of the Tax Address section, read from the client's address. */
export interface AddressFieldConfig {
  label: FieldKey
  addressFields: string[]
  wide?: boolean
}

export const TAX_ADDRESS_FIELDS: AddressFieldConfig[] = [
  { label: 'street', addressFields: ['street', 'addressLine1'] },
  {
    label: 'extNumber',
    addressFields: ['streetNumber', 'houseNumber', 'houseNo'],
  },
  {
    label: 'intNumber',
    addressFields: ['apartmentNumber', 'apartmentNo', 'unitNumber'],
  },
  {
    label: 'neighborhood',
    addressFields: ['neighborhood', 'colony', 'colonia'],
    wide: true,
  },
  { label: 'zipCode', addressFields: ['postalCode', 'zipCode'] },
  {
    label: 'boroughCity',
    addressFields: ['locality', 'borough', 'city', 'town', 'municipality'],
    wide: true,
  },
]
