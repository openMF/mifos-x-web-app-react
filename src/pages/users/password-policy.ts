/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const getPasswordPolicyError = (
  password: string,
  policyKey: string | undefined
): string | null => {
  const key = policyKey?.trim().toLowerCase()

  if (!key) {
    return 'The active password policy is unavailable.'
  }

  const simple = key === 'simple' || key === 'basic'
  const secure = key === 'secure' || key === 'standard'
  const strong = key === 'strong'

  if (!simple && !secure && !strong) {
    return `The active password policy "${policyKey}" is not supported by this form.`
  }

  const minLength = simple ? 1 : secure ? 6 : 12
  if (password.length < minLength) {
    const unit = minLength === 1 ? 'character' : 'characters'
    return `Password must be at least ${minLength} ${unit}.`
  }
  if (password.length > 50) {
    return 'Password must be no more than 50 characters.'
  }
  if (simple) return null
  if (/\s/.test(password)) {
    return 'Password must not contain spaces.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one numeric digit.'
  }
  if (secure) return null
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return 'Password must include at least one special character.'
  }
  if (/(.)\1/.test(password)) {
    return 'Password must not contain consecutive repeating characters.'
  }

  return null
}
