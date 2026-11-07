/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Conversion between the two formats a template body can be authored in.
 *
 * A template is stored by Fineract as a single `text` string, so the format is
 * a property of the editor rather than of the record. Switching format used to
 * mean handing the raw string to the other editing surface, which drops every
 * newline on the way to HTML and every tag on the way back. These helpers make
 * the switch a conversion instead, and the editor keeps the untouched source of
 * the format it left so that switching back is exact.
 */

export type TemplateTextFormat = 'html' | 'plain'

/** Elements whose content never belongs in the plain-text rendering. */
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'NOSCRIPT'])

/** Elements that start a new paragraph — separated by a blank line. */
const PARAGRAPH_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DL',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'MAIN',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
])

/** Elements that start a new line, without a blank line before it. */
const LINE_TAGS = new Set(['DD', 'DIV', 'DT', 'LI', 'TR'])

/** Cells are separated by a tab so table rows stay readable as text. */
const CELL_TAGS = new Set(['TD', 'TH'])

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Runs of spaces collapse to one when a browser lays out HTML, so indentation
 * and column alignment written in plain text are encoded as non-breaking
 * spaces. `htmlToPlainText` turns them back into ordinary spaces.
 *
 * Tabs are the one thing that cannot survive the trip: HTML has no tab, so
 * they are normalised to four spaces and come back as four spaces.
 */
const preserveSpacing = (html: string): string =>
  html
    .replace(/\t/g, '    ')
    // Every space in a run but the last: an odd run encoded two at a time
    // would lose its leftover space to the browser's collapsing.
    .replace(/ {2,}/g, spaces => `${'&nbsp;'.repeat(spaces.length - 1)} `)
    .replace(/^ /gm, '&nbsp;')

/**
 * Converts a plain-text template body to HTML.
 *
 * Every line break becomes a `<br />` rather than a paragraph, which keeps the
 * conversion reversible: `htmlToPlainText(plainTextToHtml(t))` returns `t`.
 */
export const plainTextToHtml = (text: string): string => {
  if (!text) return ''
  return preserveSpacing(escapeHtml(text.replace(/\r\n?/g, '\n'))).replace(
    /\n/g,
    '<br />\n'
  )
}

/**
 * Appends to `out` so that it ends with at least `newlines` line breaks,
 * without ever removing breaks that are already there. Line breaks the author
 * typed are therefore never swallowed by a surrounding block element.
 */
const padBreaks = (out: string, newlines: number): string => {
  if (out === '') return out
  const present = (/\n*$/.exec(out) as RegExpExecArray)[0].length
  return present >= newlines ? out : out + '\n'.repeat(newlines - present)
}

const serialize = (node: Node, out: string, preformatted: boolean): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = node.nodeValue ?? ''
    // U+00A0 is deliberately left out of the collapsed class and unescaped
    // only at the end: it is spacing the author asked for, and it has to
    // survive the two steps below that discard spacing the browser invented.
    let text = preformatted ? raw : raw.replace(/[ \t\r\n\f]+/g, ' ')
    if (!preformatted && (out === '' || out.endsWith('\n'))) {
      // Whitespace collapsing to a single space at the start of a line comes
      // from the markup's own indentation, not from the template body.
      text = text.replace(/^ +/, '')
      if (text === '') return out
    }
    return out + text.replace(/\u00a0/g, ' ')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return out

  const element = node as Element
  const tag = element.tagName.toUpperCase()
  if (DROPPED_TAGS.has(tag)) return out
  if (tag === 'BR') return out + '\n'

  const isPre = preformatted || tag === 'PRE'

  if (PARAGRAPH_TAGS.has(tag)) out = padBreaks(out, 2)
  else if (LINE_TAGS.has(tag)) out = padBreaks(out, 1)
  else if (CELL_TAGS.has(tag) && out !== '' && !out.endsWith('\n')) out += '\t'

  for (const child of Array.from(element.childNodes)) {
    out = serialize(child, out, isPre)
  }

  if (PARAGRAPH_TAGS.has(tag)) out = padBreaks(out, 2)
  else if (LINE_TAGS.has(tag)) out = padBreaks(out, 1)

  return out
}

/**
 * Converts an HTML template body to plain text, keeping the line structure the
 * markup renders as: `<br>` and block boundaries become line breaks, entities
 * are decoded, and Mustache placeholders pass through untouched.
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return ''
  const document = new DOMParser().parseFromString(html, 'text/html')
  const text = serialize(document.body, '', false)
  return text.replace(/[ \t]+\n/g, '\n').replace(/^\n+|\s+$/g, '')
}

/** Converts `text` from `from` to `to`. Returns it unchanged if they match. */
export const convertTemplateText = (
  text: string,
  from: TemplateTextFormat,
  to: TemplateTextFormat
): string => {
  if (from === to) return text
  return to === 'plain' ? htmlToPlainText(text) : plainTextToHtml(text)
}

/**
 * Best-effort guess at the format an existing template was authored in, used
 * to pick the editor's initial mode. Anything carrying markup opens as HTML.
 */
export const detectTemplateTextFormat = (
  text: string | undefined | null
): TemplateTextFormat => {
  if (!text) return 'html'
  return /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>/i.test(text) ? 'html' : 'plain'
}
