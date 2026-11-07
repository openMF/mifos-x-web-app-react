/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Allow-list sanitiser for HTML that came from the server.
 *
 * Angular's `[innerHTML]` sanitises what it renders; React's
 * `dangerouslySetInnerHTML` does not. Anything stored by one user and rendered
 * in another user's browser — a document template body, for instance — has to
 * pass through here first, or a saved `<script>` becomes stored XSS.
 *
 * The policy is an allow-list: unknown elements are unwrapped so their text
 * survives, dangerous ones are dropped whole, and every attribute that is not
 * explicitly permitted goes away (which covers every `on*` handler).
 */

/** Elements removed together with their content. */
const FORBIDDEN_TAGS = new Set([
  'APPLET',
  'BASE',
  'EMBED',
  'FORM',
  'FRAME',
  'FRAMESET',
  'IFRAME',
  'INPUT',
  'LINK',
  'MATH',
  'META',
  'NOSCRIPT',
  'OBJECT',
  'PARAM',
  'SCRIPT',
  'SELECT',
  'STYLE',
  'SVG',
  'TEMPLATE',
  'TEXTAREA',
])

/** Elements kept as-is. Anything else is unwrapped down to its children. */
const ALLOWED_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CAPTION',
  'CODE',
  'COL',
  'COLGROUP',
  'DD',
  'DIV',
  'DL',
  'DT',
  'EM',
  'FIGCAPTION',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'I',
  'IMG',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'U',
  'UL',
])

const GLOBAL_ATTRIBUTES = new Set(['align', 'class', 'dir', 'lang', 'title'])

const TAG_ATTRIBUTES: Record<string, string[]> = {
  A: ['href', 'name', 'target'],
  COL: ['span', 'width'],
  COLGROUP: ['span', 'width'],
  IMG: ['alt', 'height', 'src', 'width'],
  OL: ['reversed', 'start', 'type'],
  TABLE: ['border', 'cellpadding', 'cellspacing', 'summary', 'width'],
  TD: ['colspan', 'headers', 'rowspan', 'valign'],
  TH: ['abbr', 'colspan', 'headers', 'rowspan', 'scope', 'valign'],
}

/** Attributes holding a URL, whose scheme needs checking. */
const URL_ATTRIBUTES = new Set(['href', 'src'])

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Data URLs are allowed for raster images only — never SVG, which scripts. */
const SAFE_DATA_URL =
  /^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,[a-z0-9+/=\s]*$/i

const isSafeUrl = (value: string): boolean => {
  // A NUL or newline inside the scheme (`java\0script:`) slips past a naive
  // scheme check while the browser still resolves the URL as javascript:.
  const url = Array.from(value)
    .filter(character => {
      const code = character.charCodeAt(0)
      return code > 0x20 && code !== 0x7f
    })
    .join('')
  if (url === '') return true

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)
  if (!scheme) return true // relative URL, or a Mustache placeholder
  if (scheme[1].toLowerCase() === 'data') return SAFE_DATA_URL.test(url)
  return SAFE_URL_SCHEMES.has(`${scheme[1].toLowerCase()}:`)
}

/**
 * Style properties kept — the ones a template author uses to lay out a
 * document. The list is deliberately an allow-list rather than a block-list of
 * dangerous values: a declaration is only as safe as the property it sets, and
 * CSS escapes (`\75 rl(...)` for `url(...)`) make any literal check on the
 * value unreliable. Nothing here takes a URL, so nothing here can fetch; and
 * `position`, `top`, `left` and `z-index` are absent, so stored markup cannot
 * lay an invisible overlay over the surrounding page.
 */
const ALLOWED_STYLE_PROPERTIES = new Set([
  'background-color',
  'border',
  'border-bottom',
  'border-collapse',
  'border-color',
  'border-left',
  'border-radius',
  'border-right',
  'border-spacing',
  'border-style',
  'border-top',
  'border-width',
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'height',
  'letter-spacing',
  'line-height',
  'list-style-type',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'text-align',
  'text-decoration',
  'text-indent',
  'text-transform',
  'vertical-align',
  'white-space',
  'width',
  'word-break',
])

/** The only functions a presentational value has any reason to call. */
const ALLOWED_STYLE_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla'])

/**
 * A value is kept only if every function it calls is a colour function.
 * Backslashes and comments are refused outright: both exist in a value here
 * only to spell a function name the property allow-list would otherwise catch.
 */
const isSafeStyleValue = (value: string): boolean => {
  if (value.includes('\\') || value.includes('/*') || value.includes('*/')) {
    return false
  }
  return (value.match(/[a-z0-9_-]*\s*\(/gi) ?? []).every(call =>
    ALLOWED_STYLE_FUNCTIONS.has(call.replace(/[\s(]/g, '').toLowerCase())
  )
}

/** Drops declarations that can fetch or reposition, keeping presentational ones. */
const sanitizeStyle = (style: string): string =>
  style
    .split(';')
    .map(declaration => {
      const separator = declaration.indexOf(':')
      if (separator === -1) return ''
      const property = declaration.slice(0, separator).trim().toLowerCase()
      const value = declaration.slice(separator + 1).trim()
      if (!ALLOWED_STYLE_PROPERTIES.has(property)) return ''
      if (value === '' || !isSafeStyleValue(value)) return ''
      return `${property}: ${value}`
    })
    .filter(declaration => declaration !== '')
    .join('; ')

const isAttributeAllowed = (tag: string, name: string): boolean =>
  GLOBAL_ATTRIBUTES.has(name) ||
  name === 'style' ||
  (TAG_ATTRIBUTES[tag] ?? []).includes(name)

const unwrap = (element: Element): void => {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

const clean = (element: Element): void => {
  // Snapshot the children: the collection is live and the loop reparents nodes.
  for (const child of Array.from(element.children)) {
    const tag = child.tagName.toUpperCase()

    if (FORBIDDEN_TAGS.has(tag)) {
      child.remove()
      continue
    }

    clean(child)

    if (!ALLOWED_TAGS.has(tag)) {
      unwrap(child)
      continue
    }

    for (const attribute of Array.from(child.attributes)) {
      const name = attribute.name.toLowerCase()

      if (!isAttributeAllowed(tag, name)) {
        child.removeAttribute(attribute.name)
        continue
      }
      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(attribute.value)) {
        child.removeAttribute(attribute.name)
        continue
      }
      if (name === 'style') {
        const style = sanitizeStyle(attribute.value)
        if (style === '') child.removeAttribute(attribute.name)
        else child.setAttribute(attribute.name, style)
      }
    }

    // A link that opens a new tab must not hand its opener to the target.
    if (tag === 'A' && child.getAttribute('target')) {
      child.setAttribute('rel', 'noopener noreferrer')
    }
  }
}

/** Returns `html` with everything outside the allow-list removed. */
export const sanitizeHtml = (html: string): string => {
  if (!html) return ''
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  clean(parsed.body)
  return parsed.body.innerHTML
}
