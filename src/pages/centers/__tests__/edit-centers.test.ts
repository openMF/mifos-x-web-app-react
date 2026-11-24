/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import { buildCenterUpdatePayload } from '../center-types'

describe('buildCenterUpdatePayload', () => {
  it('builds payload with trimmed name, externalId, and numeric staffId', () => {
    const payload = buildCenterUpdatePayload(
      '  Center Alpha  ',
      '  EXT-101  ',
      '42'
    )
    expect(payload).toEqual({
      name: 'Center Alpha',
      externalId: 'EXT-101',
      staffId: 42,
    })
  })

  it('sends empty string for externalId when cleared so Fineract clears it', () => {
    const payload = buildCenterUpdatePayload('Center Beta', '   ', '')
    expect(payload).toEqual({
      name: 'Center Beta',
      externalId: '',
      staffId: undefined,
    })
  })

  it('omits staffId and externalId when undefined', () => {
    const payload = buildCenterUpdatePayload('Center Gamma')
    expect(payload).toEqual({
      name: 'Center Gamma',
      externalId: undefined,
      staffId: undefined,
    })
  })
})
