/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TwoFactorConfiguration } from '@/lib/two-factor'

/** Settings typed as numbers by Fineract, edited as text. */
export const NUMBER_FIELDS = [
  'otp-delivery-sms-provider',
  'otp-token-length',
  'otp-token-live-time',
  'access-token-live-time',
  'access-token-live-time-extended',
] as const

export type NumberField = (typeof NUMBER_FIELDS)[number]

export type SettingsForm = Omit<TwoFactorConfiguration, NumberField> &
  Record<NumberField, string>

export const toForm = (settings: TwoFactorConfiguration): SettingsForm => {
  const form = { ...settings } as unknown as SettingsForm
  for (const field of NUMBER_FIELDS) {
    form[field] = settings[field] == null ? '' : String(settings[field])
  }
  return form
}

/**
 * The settings a form describes, and the number fields that are not whole
 * numbers of at least 1. Fineract itself only checks that they are integers,
 * but a code of length 0 or a lifetime of 0 seconds would lock every user
 * out.
 */
export const fromForm = (
  form: SettingsForm,
  current: TwoFactorConfiguration
): { settings: TwoFactorConfiguration; invalid: NumberField[] } => {
  const settings = { ...current, ...form } as unknown as TwoFactorConfiguration
  const invalid: NumberField[] = []
  for (const field of NUMBER_FIELDS) {
    const text = form[field].trim()
    if (!/^\d+$/.test(text) || Number(text) < 1) {
      invalid.push(field)
      continue
    }
    settings[field] = Number(text)
  }
  return { settings, invalid }
}
