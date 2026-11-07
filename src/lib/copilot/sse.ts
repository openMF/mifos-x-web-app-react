/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** One Server-Sent Event: its `event:` name and its joined `data:` lines. */
export interface SseFrame {
  event: string
  data: string
}

/**
 * Incremental Server-Sent Events parser.
 *
 * The network hands over arbitrary chunks, so one frame can arrive split
 * across several reads, or several frames in one. Text is buffered until a
 * blank line closes a frame. Native EventSource cannot be used instead: it
 * can neither POST a body nor send the Authorization and tenant headers.
 */
export class SseParser {
  private buffer = ''
  /**
   * A '\r' that ended the previous chunk. It may be the first half of a
   * '\r\n', so it is only normalised once the next character is known;
   * converting it early would turn one line break into two.
   */
  private carriageReturn = false

  /** Feed a decoded chunk; returns every frame it completed. */
  push(chunk: string): SseFrame[] {
    let text = (this.carriageReturn ? '\r' : '') + chunk
    this.carriageReturn = text.endsWith('\r')
    if (this.carriageReturn) text = text.slice(0, -1)
    this.buffer += text.replace(/\r\n?/g, '\n')
    const frames: SseFrame[] = []
    let separator: number
    while ((separator = this.buffer.indexOf('\n\n')) !== -1) {
      const block = this.buffer.slice(0, separator)
      this.buffer = this.buffer.slice(separator + 2)
      const frame = parseBlock(block)
      if (frame) frames.push(frame)
    }
    return frames
  }

  /** The stream ended: a final frame without its blank line still counts. */
  flush(): SseFrame[] {
    const rest = this.buffer
    this.buffer = ''
    this.carriageReturn = false
    const frame = rest.trim() ? parseBlock(rest) : null
    return frame ? [frame] : []
  }
}

function parseBlock(block: string): SseFrame | null {
  let event = ''
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data.push(line.slice(5).replace(/^ /, ''))
    }
    // ':' keep-alive comments and 'id:' / 'retry:' fields are not used.
  }
  return data.length ? { event, data: data.join('\n') } : null
}
