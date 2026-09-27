/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { toPreviewBlob } from '@/lib/document-preview'
import type { DocumentPreview } from './DocumentPreviewDialog'
import type { EntityDocument } from './types'

type DownloadFn = (documentId: number) => Promise<{ data: unknown }>

/**
 * Downloads a document and exposes it as a preview URL, revoking the object URL when the
 * preview is replaced or the component unmounts.
 */
export const useDocumentPreview = (download: DownloadFn) => {
  const [preview, setPreview] = useState<DocumentPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  /** Identifies the newest request, so out-of-order responses can be discarded. */
  const requestIdRef = useRef(0)

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => revoke, [revoke])

  const openPreview = useCallback(
    async (doc: EntityDocument, errorMessage: string) => {
      if (doc.id === undefined) return
      const requestId = ++requestIdRef.current
      revoke()
      setPreview(null)
      setError(null)
      setLoading(true)
      try {
        const res = await download(Number(doc.id))
        const { blob, type } = toPreviewBlob(
          res.data as BlobPart,
          doc.fileName,
          doc.type
        )
        // Clicking a second document before the first resolves can land the
        // responses out of order; only the newest one may claim the dialog.
        if (requestId !== requestIdRef.current) return
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setPreview({ url, type, name: doc.name, fileName: doc.fileName })
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        console.error('Preview failed', e)
        setError(errorMessage)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    [download, revoke]
  )

  const closePreview = useCallback(() => {
    // Invalidate any in-flight request so a late response cannot reopen the dialog.
    requestIdRef.current++
    revoke()
    setPreview(null)
    setError(null)
    setLoading(false)
  }, [revoke])

  return { preview, loading, error, openPreview, closePreview }
}
