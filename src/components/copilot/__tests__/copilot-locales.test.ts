/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import en from '@/locales/en-US/copilot.json'
import es from '@/locales/es-ES/copilot.json'
import fr from '@/locales/fr-FR/copilot.json'
import it_ from '@/locales/it-IT/copilot.json'

/** Every key path that holds text, e.g. "errors.timedOut". */
function keys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      keys(child, prefix ? `${prefix}.${key}` : key)
    )
  }
  return [prefix]
}

/** {{placeholders}} a translation has to keep. */
function placeholders(value: unknown, path: string): string[] {
  const text = path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)?.[key],
      value
    )
  return (
    String(text)
      .match(/{{\w+}}/g)
      ?.sort() ?? []
  )
}

describe('Copilot translations', () => {
  const englishKeys = keys(en).sort()

  it.each([
    ['es-ES', es],
    ['fr-FR', fr],
    ['it-IT', it_],
  ])(
    '%s has exactly the English keys and placeholders',
    (_locale, catalogue) => {
      expect(keys(catalogue).sort()).toEqual(englishKeys)
      for (const path of englishKeys) {
        expect(placeholders(catalogue, path), path).toEqual(
          placeholders(en, path)
        )
      }
    }
  )
})
