/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest'
import { SseParser } from '../sse'

describe('SseParser', () => {
  it('parses complete frames', () => {
    const parser = new SseParser()
    expect(
      parser.push(
        'event: token\ndata: {"delta":"Hi"}\n\nevent: done\ndata: {}\n\n'
      )
    ).toEqual([
      { event: 'token', data: '{"delta":"Hi"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('waits for the rest of a frame split across chunks', () => {
    const parser = new SseParser()
    expect(parser.push('event: tok')).toEqual([])
    expect(parser.push('en\ndata: {"del')).toEqual([])
    expect(parser.push('ta":"Hi"}\n')).toEqual([])
    expect(parser.push('\n')).toEqual([
      { event: 'token', data: '{"delta":"Hi"}' },
    ])
  })

  it('accepts CRLF line endings, even when split between chunks', () => {
    const parser = new SseParser()
    expect(parser.push('event: done\r\ndata: {}\r')).toEqual([])
    expect(parser.push('\n\r\n')).toEqual([{ event: 'done', data: '{}' }])
  })

  it('does not end a frame early when a CRLF is split', () => {
    const parser = new SseParser()
    expect(parser.push('event: token\r')).toEqual([])
    expect(parser.push('\ndata: {"delta":"a"}\r\n\r\n')).toEqual([
      { event: 'token', data: '{"delta":"a"}' },
    ])
  })

  it('joins multi-line data and ignores comments and other fields', () => {
    const parser = new SseParser()
    expect(
      parser.push(
        ': keep-alive\n\nid: 7\nretry: 100\nevent: x\ndata: a\ndata: b\n\n'
      )
    ).toEqual([{ event: 'x', data: 'a\nb' }])
  })

  it('returns a final frame that is missing its blank line on flush', () => {
    const parser = new SseParser()
    expect(parser.push('event: done\ndata: {}')).toEqual([])
    expect(parser.flush()).toEqual([{ event: 'done', data: '{}' }])
    expect(parser.flush()).toEqual([])
  })
})
