/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface ChargeStatusData {
  isWaived?: boolean
  isPaid?: boolean
  amountPaid?: number
}

/**
 * Checks whether a client charge can be paid.
 * A charge can be paid only if it is neither already waived nor fully paid.
 */
export const canPayCharge = (charge?: ChargeStatusData): boolean => {
  if (!charge) return false
  return !charge.isWaived && !charge.isPaid
}

/**
 * Checks whether a client charge can be waived.
 * A charge can be waived only if it is neither already waived nor fully paid.
 */
export const canWaiveCharge = (charge?: ChargeStatusData): boolean => {
  if (!charge) return false
  return !charge.isWaived && !charge.isPaid
}

/**
 * Checks whether a client charge can be deleted.
 * A charge can be deleted only if it has not been waived or paid (partially or fully).
 */
export const canDeleteCharge = (charge?: ChargeStatusData): boolean => {
  if (!charge) return false
  if (charge.isWaived || charge.isPaid) return false
  if (typeof charge.amountPaid === 'number' && charge.amountPaid > 0)
    return false
  return true
}
