/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'

import { gatewayMode } from '../gateway-mode'

describe('gatewayMode', () => {
  it('is off when no gateway is configured', () => {
    expect(gatewayMode('')).toBe('off')
    expect(gatewayMode('   ')).toBe('off')
  })

  it('serves recorded answers only for the word mock', () => {
    expect(gatewayMode('mock')).toBe('mock')
    expect(gatewayMode(' Mock ')).toBe('mock')
  })

  it('uses an https gateway, or one behind the same origin', () => {
    expect(gatewayMode('https://copilot.example.org')).toBe('gateway')
    expect(gatewayMode('/copilot-gateway')).toBe('gateway')
  })

  it('is off for a gateway the credential would reach in cleartext', () => {
    expect(gatewayMode('http://copilot.example.org')).toBe('off')
    expect(gatewayMode('//copilot.example.org')).toBe('off')
    expect(gatewayMode('not a url')).toBe('off')
  })
})
