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
  buildServiceUpdate,
  EXTERNAL_SERVICES,
  initialForm,
  toValues,
} from '../services'

const service = (name: string) => {
  const found = EXTERNAL_SERVICES.find(s => s.name === name)
  if (!found) throw new Error(`no service ${name}`)
  return found
}

const smtp = service('SMTP')

// GET /externalservice/SMTP masks the password (StringUtil.maskValue)
const stored = toValues([
  { name: 'username', value: 'support@example.org' },
  { name: 'password', value: 's****rt81' },
  { name: 'host', value: 'smtp.example.org' },
  { name: 'port', value: '587' },
  { name: 'useTLS', value: 'true' },
  { name: 'fromEmail', value: 'support@example.org' },
  { name: 'fromName', value: 'Mifos' },
])

describe('EXTERNAL_SERVICES', () => {
  it('uses the property names Fineract stores (ExternalServicesConstants)', () => {
    const names = (n: string) => service(n).fields.map(f => f.name)
    expect(names('SMTP')).toEqual([
      'username',
      'password',
      'host',
      'port',
      'useTLS',
      'fromEmail',
      'fromName',
    ])
    expect(names('S3')).toEqual([
      's3_access_key',
      's3_bucket_name',
      's3_secret_key',
    ])
    expect(names('SMS')).toEqual([
      'host_name',
      'port_number',
      'end_point',
      'tenant_app_key',
    ])
    expect(names('NOTIFICATION')).toEqual([
      'server_key',
      'gcm_end_point',
      'fcm_end_point',
    ])
  })

  it('treats the masked values (password, server_key) as secrets', () => {
    const secrets = EXTERNAL_SERVICES.flatMap(s =>
      s.fields.filter(f => f.secret).map(f => f.name)
    )
    expect(secrets).toEqual(expect.arrayContaining(['password', 'server_key']))
  })

  it('has a unique slug per service', () => {
    const slugs = EXTERNAL_SERVICES.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('toValues', () => {
  it('turns a missing value into an empty string', () => {
    expect(toValues([{ name: 'host' }, { name: 'port', value: '25' }])).toEqual(
      { host: '', port: '25' }
    )
  })
})

describe('initialForm', () => {
  it('starts secrets empty and keeps the other stored values', () => {
    const form = initialForm(smtp, stored)
    expect(form.password).toBe('')
    expect(form.host).toBe('smtp.example.org')
    expect(form.useTLS).toBe('true')
  })

  it('fills fields missing from the response with an empty string', () => {
    expect(initialForm(service('S3'), {})).toEqual({
      s3_access_key: '',
      s3_bucket_name: '',
      s3_secret_key: '',
    })
  })
})

describe('buildServiceUpdate', () => {
  it('sends nothing when nothing changed, so the masked password is never sent', () => {
    expect(buildServiceUpdate(smtp, stored, initialForm(smtp, stored))).toEqual(
      {}
    )
  })

  it('sends only the changed fields', () => {
    const form = { ...initialForm(smtp, stored), host: 'mail.example.org' }
    expect(buildServiceUpdate(smtp, stored, form)).toEqual({
      host: 'mail.example.org',
    })
  })

  it('sends a secret only when a new one is typed', () => {
    const form = { ...initialForm(smtp, stored), password: 'n3w-secret' }
    expect(buildServiceUpdate(smtp, stored, form)).toEqual({
      password: 'n3w-secret',
    })
  })

  it('sends a cleared non-secret field as an empty string', () => {
    const form = { ...initialForm(smtp, stored), fromName: '' }
    expect(buildServiceUpdate(smtp, stored, form)).toEqual({ fromName: '' })
  })

  it('sends the Use TLS checkbox as "true" / "false"', () => {
    const form = { ...initialForm(smtp, stored), useTLS: 'false' }
    expect(buildServiceUpdate(smtp, stored, form)).toEqual({ useTLS: 'false' })
  })
})

describe('apiErrorMessage', () => {
  it("returns Fineract's first error message", () => {
    const err = {
      response: {
        data: {
          defaultUserMessage: 'Validation errors exist.',
          errors: [
            { defaultUserMessage: 'The parameter `foo` is not supported.' },
          ],
        },
      },
    }
    expect(apiErrorMessage(err)).toBe('The parameter `foo` is not supported.')
  })

  it('falls back to the top-level message, then null', () => {
    expect(
      apiErrorMessage({ response: { data: { defaultUserMessage: 'Denied' } } })
    ).toBe('Denied')
    expect(apiErrorMessage(new Error('network'))).toBeNull()
  })
})
