/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import {
  BusinessDateManagementApi,
  GlobalConfigurationApi,
} from '@/fineract-api'
import { dateArrayToInputValue, todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

/**
 * The business date as yyyy-MM-dd, or null when business dates are turned
 * off: GET /businessdate/BUSINESS_DATE keeps returning the last business date
 * after `enable-business-date` is turned off, so it is only used while the
 * setting is on.
 */
export async function currentBusinessDate(): Promise<string | null> {
  const configuration = getConfiguration()
  const setting = await new GlobalConfigurationApi(
    configuration
  ).retrieveOneByName('enable-business-date')
  if (!setting.data?.enabled) return null
  const businessDate = await new BusinessDateManagementApi(
    configuration
  ).getBusinessDate('BUSINESS_DATE')
  // Fineract sends the date as [year, month, day], though the SDK types it as a string.
  return (
    dateArrayToInputValue(businessDate.data?.date as unknown as number[]) ||
    null
  )
}

/**
 * The business date as yyyy-MM-dd, for a date input's default value, like the
 * Angular web app. Falls back to today when business dates are turned off (or
 * can't be read).
 */
export async function businessDateInputValue(): Promise<string> {
  try {
    return (await currentBusinessDate()) || todayInputValue()
  } catch (e) {
    console.error('business date failed', e)
    return todayInputValue()
  }
}

/**
 * State for a date input that starts empty and is filled with the business
 * date (see businessDateInputValue) unless the user has already picked a date.
 */
export function useBusinessDateState() {
  const state = useState('')
  const setDate = state[1]
  useEffect(() => {
    let active = true
    businessDateInputValue().then(date => {
      if (active) setDate(prev => prev || date)
    })
    return () => {
      active = false
    }
  }, [setDate])
  return state
}
