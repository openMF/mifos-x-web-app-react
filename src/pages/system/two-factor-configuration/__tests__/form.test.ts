/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import { fromForm, toForm } from '../form'

const settings = {
  'otp-delivery-email-enable': true,
  'otp-delivery-email-subject': 'Fineract Two-Factor Authentication Token',
  'otp-delivery-email-body':
    'Hello {{username}}.\nYour OTP login token is {{token}}.',
  'otp-delivery-sms-enable': false,
  'otp-delivery-sms-provider': 1,
  'otp-delivery-sms-text':
    'Your authentication token for Fineract is {{token}}.',
  'otp-token-length': 5,
  'otp-token-live-time': 300,
  'access-token-live-time': 86400,
  'access-token-live-time-extended': 604800,
}

describe('two-factor configuration form', () => {
  it('round-trips the settings Fineract returns', () => {
    expect(fromForm(toForm(settings), settings)).toEqual({
      settings,
      invalid: [],
    })
  })

  it('edits numbers as text', () => {
    expect(toForm(settings)['otp-token-length']).toBe('5')
  })

  it('reads edited numbers back as numbers', () => {
    const form = { ...toForm(settings), 'otp-token-live-time': ' 600 ' }

    expect(fromForm(form, settings).settings['otp-token-live-time']).toBe(600)
  })

  it('refuses values that would lock every user out', () => {
    const form = {
      ...toForm(settings),
      'otp-token-length': '0',
      'otp-token-live-time': '',
      'access-token-live-time': '-5',
      'access-token-live-time-extended': '1.5',
      'otp-delivery-sms-provider': 'abc',
    }

    expect(fromForm(form, settings).invalid).toEqual([
      'otp-delivery-sms-provider',
      'otp-token-length',
      'otp-token-live-time',
      'access-token-live-time',
      'access-token-live-time-extended',
    ])
  })
})
