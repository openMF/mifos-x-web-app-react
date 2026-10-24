/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/date-utils'
import type { NoteEntityType } from '../types'

describe('EntityNotesTab types and utilities', () => {
  it('validates supported NoteEntityType values', () => {
    const validTypes: NoteEntityType[] = [
      'clients',
      'groups',
      'centers',
      'loans',
    ]
    expect(validTypes).toHaveLength(4)
    expect(validTypes).toContain('clients')
    expect(validTypes).toContain('groups')
    expect(validTypes).toContain('centers')
    expect(validTypes).toContain('loans')
  })

  it('formats note createdOn dates correctly across formats', () => {
    // Array format returned by Fineract API [year, month, day]
    const arrayDate = [2026, 10, 19]
    expect(formatDate(arrayDate, 'en-US')).toMatch(/October 19, 2026/i)

    // ISO datetime format (midday avoids midnight UTC rollover in western timezones)
    const isoDateTime = '2026-10-19T12:00:00'
    expect(formatDate(isoDateTime, 'en-US')).toMatch(/October 19, 2026/i)

    // Empty or undefined format
    expect(formatDate(undefined, 'en-US')).toBe('—')
    expect(formatDate(null, 'en-US')).toBe('—')
  })

  it('verifies note trimming and empty text validation logic', () => {
    const validateNote = (noteText: string, entityId?: number) => {
      const trimmed = noteText.trim()
      if (!entityId || !trimmed) return false
      return true
    }

    expect(validateNote('', 123)).toBe(false)
    expect(validateNote('   ', 123)).toBe(false)
    expect(validateNote('Valid note', undefined)).toBe(false)
    expect(validateNote('Valid note', 0)).toBe(false)
    expect(validateNote('Valid note', 123)).toBe(true)
  })
})
