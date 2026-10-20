/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import {
  apiErrorMessage,
  firstMissingField,
  hasEvent,
  hookConfigPayload,
  humanize,
  isSecretField,
  type SchemaField,
} from '../types'

// The SMS Bridge schema Fineract seeds (m_hook_schema, template 2); all five
// settings are required
const SMS_BRIDGE: SchemaField[] = [
  'Payload URL',
  'SMS Provider',
  'Phone Number',
  'SMS Provider Token',
  'SMS Provider Account Id',
].map(fieldName => ({ fieldName, fieldType: 'string', optional: false }))

const filled = {
  'Payload URL': 'https://sms.example.org/hook',
  'SMS Provider': 'Twilio',
  'Phone Number': '+15550100',
  'SMS Provider Token': 'tok-123',
  'SMS Provider Account Id': 'AC123',
}

// A schema with an optional setting
const WITH_OPTIONAL: SchemaField[] = [
  { fieldName: 'Payload URL', optional: false },
  { fieldName: 'Notes', optional: true },
]

describe('firstMissingField', () => {
  it('finds the first empty required setting', () => {
    const { 'Phone Number': _, ...withoutPhone } = filled
    expect(firstMissingField(SMS_BRIDGE, withoutPhone)?.fieldName).toBe(
      'Phone Number'
    )
  })

  it('treats a blank value as missing', () => {
    expect(
      firstMissingField(SMS_BRIDGE, { ...filled, 'SMS Provider': '   ' })
        ?.fieldName
    ).toBe('SMS Provider')
  })

  it('is undefined when every required setting is filled', () => {
    expect(firstMissingField(SMS_BRIDGE, filled)).toBeUndefined()
  })

  it('ignores empty optional settings', () => {
    expect(
      firstMissingField(WITH_OPTIONAL, { 'Payload URL': 'https://x.org' })
    ).toBeUndefined()
  })
})

describe('hookConfigPayload', () => {
  it('sends every required setting, Phone Number included', () => {
    expect(hookConfigPayload(SMS_BRIDGE, filled)).toEqual(filled)
  })

  it('trims values and leaves out empty optional settings', () => {
    expect(
      hookConfigPayload(WITH_OPTIONAL, {
        'Payload URL': '  https://x.org/hook ',
        Notes: '',
      })
    ).toEqual({ 'Payload URL': 'https://x.org/hook' })
  })

  it("drops values kept from another template's fields", () => {
    const web: SchemaField[] = [
      { fieldName: 'Payload URL', optional: false },
      { fieldName: 'Content Type', optional: false },
    ]
    expect(
      hookConfigPayload(web, {
        ...filled,
        'Content Type': 'json',
      })
    ).toEqual({
      'Payload URL': 'https://sms.example.org/hook',
      'Content Type': 'json',
    })
  })
})

describe('hasEvent', () => {
  const events = [{ entityName: 'CLIENT', actionName: 'ACTIVATE' }]

  it('matches on both entity and action', () => {
    expect(
      hasEvent(events, { entityName: 'CLIENT', actionName: 'ACTIVATE' })
    ).toBe(true)
    expect(
      hasEvent(events, { entityName: 'CLIENT', actionName: 'CLOSE' })
    ).toBe(false)
    expect(
      hasEvent(events, { entityName: 'LOAN', actionName: 'ACTIVATE' })
    ).toBe(false)
  })
})

describe('humanize', () => {
  it('turns Fineract codes into words', () => {
    expect(humanize('loan_reschedule')).toBe('Loan Reschedule')
    expect(humanize('CLIENT')).toBe('Client')
    expect(humanize(undefined)).toBe('')
  })
})

describe('isSecretField', () => {
  it('hides credentials and nothing else', () => {
    expect(isSecretField('SMS Provider Token')).toBe(true)
    expect(isSecretField('Password')).toBe(true)
    expect(isSecretField('Payload URL')).toBe(false)
    expect(isSecretField('Phone Number')).toBe(false)
  })
})

describe('apiErrorMessage', () => {
  it('names the missing config field Fineract reports', () => {
    const err = {
      response: {
        data: {
          errors: [
            {
              defaultUserMessage: 'Required config field not provided.',
              userMessageGlobalisationCode:
                'validation.msg.hook.required.config.field.not.provided',
              args: [{ value: 'Phone Number' }],
            },
          ],
        },
      },
    }
    expect(apiErrorMessage(err)).toBe(
      'Required config field not provided. (Phone Number)'
    )
  })

  it('falls back to the top-level message, then undefined', () => {
    expect(
      apiErrorMessage({ response: { data: { defaultUserMessage: 'Denied' } } })
    ).toBe('Denied')
    expect(apiErrorMessage(new Error('network'))).toBeUndefined()
  })
})
