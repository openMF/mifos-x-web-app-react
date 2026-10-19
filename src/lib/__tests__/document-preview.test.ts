/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import {
  detectPreviewType,
  isPreviewable,
  resolveMimeType,
  toPreviewBlob,
} from '../document-preview'

describe('document-preview', () => {
  describe('detectPreviewType', () => {
    describe('PDF detection', () => {
      it('detects pdf by extension', () => {
        expect(detectPreviewType('document.pdf')).toBe('pdf')
        expect(detectPreviewType('DOCUMENT.PDF')).toBe('pdf')
      })

      it('detects pdf by declared MIME type', () => {
        expect(detectPreviewType('file', 'application/pdf')).toBe('pdf')
      })

      it('falls back to .pdf extension when MIME is generic application/octet-stream', () => {
        expect(detectPreviewType('doc.pdf', 'application/octet-stream')).toBe(
          'pdf'
        )
      })
    })

    describe('Raster image detection', () => {
      it('detects supported image extensions', () => {
        expect(detectPreviewType('photo.png')).toBe('image')
        expect(detectPreviewType('photo.jpg')).toBe('image')
        expect(detectPreviewType('photo.jpeg')).toBe('image')
        expect(detectPreviewType('photo.webp')).toBe('image')
        expect(detectPreviewType('photo.gif')).toBe('image')
        expect(detectPreviewType('photo.bmp')).toBe('image')
      })

      it('detects image by declared MIME type', () => {
        expect(detectPreviewType('file', 'image/png')).toBe('image')
        expect(detectPreviewType('file', 'image/jpeg')).toBe('image')
      })

      it('falls back to image extension when MIME is generic octet-stream', () => {
        expect(detectPreviewType('pic.png', 'application/octet-stream')).toBe(
          'image'
        )
      })

      it('rejects image MIME and extension mismatch', () => {
        expect(detectPreviewType('photo.png', 'image/jpeg')).toBe('other')
      })

      it('rejects unsupported image MIME without extension', () => {
        expect(detectPreviewType('file', 'image/heic')).toBe('other')
      })
    })

    describe('Unsupported files', () => {
      it('returns other for docx, zip, exe, and unknown extensions', () => {
        expect(detectPreviewType('document.docx')).toBe('other')
        expect(detectPreviewType('archive.zip')).toBe('other')
        expect(detectPreviewType('app.exe')).toBe('other')
        expect(detectPreviewType('unknownfile.xyz')).toBe('other')
        expect(detectPreviewType('no-extension')).toBe('other')
      })
    })

    describe('SVG security', () => {
      it('rejects SVG filename even if declared MIME is image/png', () => {
        expect(detectPreviewType('malicious.svg', 'image/png')).toBe('other')
      })

      it('rejects SVG MIME even if filename is .png', () => {
        expect(detectPreviewType('file.png', 'image/svg+xml')).toBe('other')
        expect(detectPreviewType('file.png', 'image/svg')).toBe('other')
      })

      it('rejects SVG MIME with charset or parameters', () => {
        expect(
          detectPreviewType('file.png', 'image/svg+xml; charset=utf-8')
        ).toBe('other')
      })

      it('rejects plain SVG file without declared MIME', () => {
        expect(detectPreviewType('graphic.svg')).toBe('other')
      })
    })
  })

  describe('isPreviewable', () => {
    it('returns true for previewable pdf and images', () => {
      expect(isPreviewable('doc.pdf')).toBe(true)
      expect(isPreviewable('pic.png')).toBe(true)
      expect(isPreviewable('pic.jpg')).toBe(true)
    })

    it('returns false for SVG and unsupported files', () => {
      expect(isPreviewable('graphic.svg')).toBe(false)
      expect(isPreviewable('doc.docx')).toBe(false)
      expect(isPreviewable('archive.zip')).toBe(false)
      expect(isPreviewable('notes.txt')).toBe(false)
    })
  })

  describe('resolveMimeType', () => {
    it('returns application/pdf for pdf type', () => {
      expect(resolveMimeType('pdf', 'test.pdf')).toBe('application/pdf')
    })

    it('returns image MIME for raster images', () => {
      expect(resolveMimeType('image', 'photo.png')).toBe('image/png')
      expect(resolveMimeType('image', 'photo.jpg')).toBe('image/jpeg')
    })

    it('returns undefined for other or SVG type', () => {
      expect(resolveMimeType('other', 'test.svg')).toBeUndefined()
    })
  })

  describe('toPreviewBlob', () => {
    it('constructs a blob with proper MIME type for PDF', () => {
      const { blob, type } = toPreviewBlob(
        'sample pdf content',
        'test.pdf',
        'application/octet-stream'
      )
      expect(type).toBe('pdf')
      expect(blob.type).toBe('application/pdf')
    })

    it('constructs a blob with proper MIME type for raster image', () => {
      const { blob, type } = toPreviewBlob(
        'sample image content',
        'test.png',
        'application/octet-stream'
      )
      expect(type).toBe('image')
      expect(blob.type).toBe('image/png')
    })

    it('does not convert SVG into previewable image', () => {
      const { type } = toPreviewBlob(
        '<svg></svg>',
        'malicious.svg',
        'image/svg+xml'
      )
      expect(type).toBe('other')
    })

    it('leaves unsupported content as type other', () => {
      const { type } = toPreviewBlob(
        'sample content',
        'notes.docx',
        'application/octet-stream'
      )
      expect(type).toBe('other')
    })

    it('does not fall back to source type when declared MIME is a specific non-previewable type', () => {
      const sourceBlob = new Blob(['data'], { type: 'image/png' })
      const { type } = toPreviewBlob(
        sourceBlob,
        'doc.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      expect(type).toBe('other')
    })
  })
})
