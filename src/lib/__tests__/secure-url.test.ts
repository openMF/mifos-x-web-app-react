/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isSecureUrl } from '../secure-url'

describe('isSecureUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('falsy and empty values', () => {
    it('returns true for an empty string', () => {
      expect(isSecureUrl('')).toBe(true)
    })

    it('returns true for falsy values if passed at runtime', () => {
      expect(isSecureUrl(null as unknown as string)).toBe(true)
      expect(isSecureUrl(undefined as unknown as string)).toBe(true)
    })
  })

  describe('relative URLs', () => {
    it('returns true for root path', () => {
      expect(isSecureUrl('/')).toBe(true)
    })

    it('returns true for same-origin relative paths', () => {
      expect(isSecureUrl('/fineract-provider/api/v1')).toBe(true)
      expect(isSecureUrl('/clients')).toBe(true)
      expect(isSecureUrl('/api/v1/auth?tenantIdentifier=default')).toBe(true)
      expect(isSecureUrl('/loans#repayment-schedule')).toBe(true)
    })

    it('returns false for protocol-relative URLs starting with //', () => {
      expect(isSecureUrl('//example.com')).toBe(false)
      expect(isSecureUrl('//localhost')).toBe(false)
      expect(isSecureUrl('//localhost:8080')).toBe(false)
      expect(isSecureUrl('//evil.com/fineract-provider')).toBe(false)
      expect(isSecureUrl('///path')).toBe(false)
      expect(isSecureUrl('/\\attacker.example')).toBe(false)
      expect(isSecureUrl('/\\n\\\\attacker.example')).toBe(false)
    })
  })

  describe('HTTPS URLs', () => {
    it('returns true for standard HTTPS URLs', () => {
      expect(isSecureUrl('https://demo.mifos.io')).toBe(true)
      expect(
        isSecureUrl('https://demo.mifos.io/fineract-provider/api/v1')
      ).toBe(true)
      expect(isSecureUrl('https://api.example.com:8443/api')).toBe(true)
    })

    it('returns true for HTTPS loopback URLs', () => {
      expect(isSecureUrl('https://localhost:8443')).toBe(true)
      expect(isSecureUrl('https://127.0.0.1:8443')).toBe(true)
      expect(isSecureUrl('https://[::1]:8443')).toBe(true)
    })

    it('returns true for HTTPS URLs even in production mode', () => {
      vi.stubEnv('DEV', false)
      expect(isSecureUrl('https://demo.mifos.io')).toBe(true)
      expect(isSecureUrl('https://localhost:8443')).toBe(true)
    })
  })

  describe('loopback host detection and HTTP in development', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true)
    })

    it('returns true for http on localhost', () => {
      expect(isSecureUrl('http://localhost')).toBe(true)
      expect(isSecureUrl('http://localhost:8080')).toBe(true)
      expect(
        isSecureUrl('http://localhost:3000/fineract-provider/api/v1')
      ).toBe(true)
    })

    it('returns true for http on IPv4 loopback (127.0.0.1)', () => {
      expect(isSecureUrl('http://127.0.0.1')).toBe(true)
      expect(isSecureUrl('http://127.0.0.1:8080')).toBe(true)
      expect(
        isSecureUrl('http://127.0.0.1:8080/fineract-provider/api/v1')
      ).toBe(true)
    })

    it('returns true for http on IPv6 loopback ([::1])', () => {
      expect(isSecureUrl('http://[::1]')).toBe(true)
      expect(isSecureUrl('http://[::1]:8080')).toBe(true)
      expect(isSecureUrl('http://[::1]:8080/fineract-provider/api/v1')).toBe(
        true
      )
    })

    it('returns false for non-loopback http hosts', () => {
      expect(isSecureUrl('http://example.com')).toBe(false)
      expect(isSecureUrl('http://api.fineract.dev')).toBe(false)
      expect(isSecureUrl('http://192.168.1.100:8080')).toBe(false)
      expect(isSecureUrl('http://10.0.0.1')).toBe(false)
      expect(isSecureUrl('http://172.16.0.1')).toBe(false)
    })

    it('returns false for hostnames that spoof or contain loopback names', () => {
      expect(isSecureUrl('http://localhost.evil.com')).toBe(false)
      expect(isSecureUrl('http://not-localhost:8080')).toBe(false)
      expect(isSecureUrl('http://127.0.0.1.nip.io')).toBe(false)
    })
  })

  describe('loopback host detection and HTTP in production', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false)
    })

    it('returns false for cleartext http even on loopback hosts in production', () => {
      expect(isSecureUrl('http://localhost')).toBe(false)
      expect(isSecureUrl('http://localhost:8080')).toBe(false)
      expect(isSecureUrl('http://127.0.0.1:8080')).toBe(false)
      expect(isSecureUrl('http://[::1]:8080')).toBe(false)
    })

    it('still allows same-origin relative URLs in production', () => {
      expect(isSecureUrl('/')).toBe(true)
      expect(isSecureUrl('/fineract-provider/api/v1')).toBe(true)
    })
  })

  describe('unsupported protocols', () => {
    it('returns false for non-http(s) protocols', () => {
      expect(isSecureUrl('ftp://example.com/file.txt')).toBe(false)
      expect(isSecureUrl('ws://localhost:8080')).toBe(false)
      expect(isSecureUrl('wss://localhost:8443')).toBe(false)
      expect(isSecureUrl('file:///etc/passwd')).toBe(false)
      expect(isSecureUrl('javascript:alert(1)')).toBe(false)
      expect(isSecureUrl('data:text/plain;base64,SGVsbG8=')).toBe(false)
    })
  })

  describe('invalid URLs', () => {
    it('returns false for plain strings that are not valid URLs', () => {
      expect(isSecureUrl('invalid-url')).toBe(false)
      expect(isSecureUrl('not a url')).toBe(false)
      expect(isSecureUrl('localhost:8080')).toBe(false)
      expect(isSecureUrl('www.example.com')).toBe(false)
    })

    it('returns false for malformed schemes or syntax', () => {
      expect(isSecureUrl('http//localhost')).toBe(false)
      expect(isSecureUrl('htp://localhost')).toBe(false)
      expect(isSecureUrl('://missing-scheme')).toBe(false)
      expect(isSecureUrl('http://')).toBe(false)
      expect(isSecureUrl('http://:8080')).toBe(false)
      expect(isSecureUrl('http://localhost:99999')).toBe(false)
    })

    it('returns false for URLs containing control characters (tab, newline, carriage return)', () => {
      expect(isSecureUrl('/path\twith\ttab')).toBe(false)
      expect(isSecureUrl('/path\rwith\rcr')).toBe(false)
      expect(isSecureUrl('https://example.com/\npath')).toBe(false)
    })
  })
})
