/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function formatDisplayNumber(
  value: number,
  locale: string | undefined,
  decimalPlaces: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)
}

export function formatDisplayCurrency(
  value: number,
  currency: string | undefined,
  locale: string | undefined,
  decimalPlaces: number
): string {
  try {
    return formatDisplayNumber(value, locale, decimalPlaces, {
      style: 'currency',
      currency,
    })
  } catch {
    return formatDisplayNumber(value, locale, decimalPlaces)
  }
}
