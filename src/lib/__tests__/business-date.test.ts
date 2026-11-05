/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const retrieveOneByName = vi.fn()
const getBusinessDate = vi.fn()

vi.mock('@/fineract-api', () => ({
  GlobalConfigurationApi: class {
    retrieveOneByName = retrieveOneByName
  },
  BusinessDateManagementApi: class {
    getBusinessDate = getBusinessDate
  },
}))
vi.mock('@/lib/fineract-openapi', () => ({ getConfiguration: () => ({}) }))

import { businessDateInputValue } from '../business-date'

describe('businessDateInputValue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 15))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    retrieveOneByName.mockReset()
    getBusinessDate.mockReset()
  })

  it('returns the business date when business dates are on', async () => {
    retrieveOneByName.mockResolvedValue({ data: { enabled: true } })
    getBusinessDate.mockResolvedValue({ data: { date: [2026, 10, 13] } })

    await expect(businessDateInputValue()).resolves.toBe('2026-10-13')
    expect(getBusinessDate).toHaveBeenCalledWith('BUSINESS_DATE')
  })

  it('returns today without reading the business date when business dates are off', async () => {
    retrieveOneByName.mockResolvedValue({ data: { enabled: false } })

    await expect(businessDateInputValue()).resolves.toBe('2026-10-15')
    expect(getBusinessDate).not.toHaveBeenCalled()
  })

  it('returns today when the setting cannot be read', async () => {
    retrieveOneByName.mockRejectedValue(new Error('403'))

    await expect(businessDateInputValue()).resolves.toBe('2026-10-15')
  })
})
