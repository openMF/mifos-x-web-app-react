/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'

import { getPasswordPolicyError } from './password-policy'

describe('getPasswordPolicyError', () => {
  it('accepts 1-50 characters for the simple policy', () => {
    expect(getPasswordPolicyError('a', 'simple')).toBeNull()
    expect(getPasswordPolicyError('a'.repeat(50), 'simple')).toBeNull()
    expect(getPasswordPolicyError('', 'simple')).toBe(
      'Password must be at least 1 character.'
    )
    expect(getPasswordPolicyError('a'.repeat(51), 'simple')).toBe(
      'Password must be no more than 50 characters.'
    )
  })

  it('applies the secure policy requirements', () => {
    expect(getPasswordPolicyError('Mifos12', 'secure')).toBeNull()
    expect(getPasswordPolicyError('Mifos1', 'standard')).toBeNull()
    expect(getPasswordPolicyError('mifos12', 'secure')).toContain(
      'uppercase letter'
    )
    expect(getPasswordPolicyError('Mifos 12', 'secure')).toContain('spaces')
  })

  it('applies the strong policy requirements', () => {
    expect(getPasswordPolicyError('Mifos1234!AB', 'strong')).toBeNull()
    expect(getPasswordPolicyError('Mifos12345AB', 'strong')).toContain(
      'special character'
    )
    expect(getPasswordPolicyError('Mifos111!ABCD', 'strong')).toContain(
      'repeating'
    )
    expect(getPasswordPolicyError('Mifos1234!A B', 'strong')).toContain(
      'spaces'
    )
  })

  it('fails closed if the active policy is missing or unknown', () => {
    expect(getPasswordPolicyError('Mifos12', undefined)).toContain(
      'unavailable'
    )
    expect(getPasswordPolicyError('Mifos12', 'custom')).toContain(
      'not supported'
    )
  })
})
