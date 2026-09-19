/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type DocumentPreviewType = 'image' | 'pdf' | 'other'

const PDF_MIME_TYPE = 'application/pdf'

/**
 * MIME types that say nothing about the file. Fineract serves document attachments as
 * `application/octet-stream`, so these must not short-circuit detection.
 */
const GENERIC_MIME_TYPES = [
  '',
  'application/octet-stream',
  'binary/octet-stream',
  'application/download',
]

/**
 * Raster formats only. SVG is deliberately excluded: the preview hands its blob URL to
 * `window.open`, and a top-level `blob:` document keeps this app's origin, so script
 * inside an uploaded SVG would run here and could read the credentials this app keeps
 * in localStorage. SVGs stay downloadable, just not previewable.
 */
const IMAGE_EXTENSIONS: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
}

/** Image MIME types that must never be previewed as active content. */
const ACTIVE_IMAGE_MIME_TYPES = ['image/svg+xml', 'image/svg']

const getExtension = (fileName?: string) =>
  (fileName || '').split('.').pop()?.toLowerCase() ?? ''

/**
 * Classify a document from its file name and, as a fallback, its declared MIME type.
 */
export const detectPreviewType = (
  fileName?: string,
  mimeType?: string
): DocumentPreviewType => {
  const normalizedMime = (mimeType || '').toLowerCase()
  if (ACTIVE_IMAGE_MIME_TYPES.includes(normalizedMime)) return 'other'
  if (!GENERIC_MIME_TYPES.includes(normalizedMime)) {
    if (normalizedMime.includes('pdf')) return 'pdf'
    if (normalizedMime.startsWith('image/')) return 'image'
  }

  const extension = getExtension(fileName)
  if (extension === 'pdf') return 'pdf'
  if (IMAGE_EXTENSIONS[extension]) return 'image'

  return 'other'
}

export const isPreviewable = (fileName?: string, mimeType?: string) =>
  detectPreviewType(fileName, mimeType) !== 'other'

/**
 * The MIME type to stamp onto the preview blob.
 *
 * An `<img>` ignores the declared type and sniffs the bytes, but `<embed>` honours it —
 * so a blob left as `application/octet-stream` is offered as a download instead of being
 * rendered. Re-typing the blob is what makes PDF preview work at all.
 */
export const resolveMimeType = (
  type: DocumentPreviewType,
  fileName?: string,
  blobMimeType?: string
): string | undefined => {
  const normalizedMime = (blobMimeType || '').toLowerCase()
  if (type === 'pdf') return PDF_MIME_TYPE
  if (type === 'image') {
    if (normalizedMime.startsWith('image/')) return normalizedMime
    return IMAGE_EXTENSIONS[getExtension(fileName)]
  }
  return undefined
}

/**
 * Wrap a downloaded attachment in a blob whose type the browser can actually render.
 */
export const toPreviewBlob = (
  data: BlobPart,
  fileName?: string,
  declaredMimeType?: string
): { blob: Blob; type: DocumentPreviewType } => {
  const source = data instanceof Blob ? data : new Blob([data])
  let type = detectPreviewType(fileName, declaredMimeType)
  if (type === 'other') {
    type = detectPreviewType(fileName, source.type)
  }

  const mimeType = resolveMimeType(type, fileName, source.type)
  const blob =
    mimeType && mimeType !== source.type
      ? new Blob([source], { type: mimeType })
      : source

  return { blob, type }
}
