/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'

import { safeRehypePlugins } from '@/components/ai-elements/markdown'

type Node = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

const link = (href: string): Node => ({
  type: 'element',
  tagName: 'a',
  properties: { href },
  children: [{ type: 'text' }],
})

/** Runs the last, strictest step on a tree of links and returns the hrefs. */
function hrefsAfterSanitising(hrefs: string[]): unknown[] {
  const last = safeRehypePlugins[safeRehypePlugins.length - 1] as () => (
    tree: Node
  ) => void
  const tree: Node = {
    type: 'root',
    children: [{ type: 'element', tagName: 'p', children: hrefs.map(link) }],
  }
  last()(tree)
  return tree.children![0].children!.map(a => a.properties?.href)
}

describe('answer links', () => {
  it('keeps only https and mailto targets', () => {
    expect(
      hrefsAfterSanitising([
        'https://example.org/a',
        'mailto:officer@example.org',
        'http://example.org/leak?d=1',
        'HTTP://example.org/leak',
        'irc://example.org',
        'xmpp:someone@example.org',
        'blob:https://example.org/1',
        '//example.org/z',
      ])
    ).toEqual([
      'https://example.org/a',
      'mailto:officer@example.org',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})
