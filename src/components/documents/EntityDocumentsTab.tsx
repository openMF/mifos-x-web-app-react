/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Plus } from 'lucide-react'

import { DocumentsApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { isPreviewable, toPreviewBlob } from '@/lib/document-preview'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DocumentPreviewDialog from './DocumentPreviewDialog'
import { useDocumentPreview } from './useDocumentPreview'
import type { DocumentEntityType, EntityDocument } from './types'

/**
 * Built per call rather than once at module load: `getConfiguration()` snapshots the
 * auth headers, and the generated clients bypass the `lib/axios` request interceptor,
 * so a long-lived instance would keep sending whatever credentials existed when this
 * module was first evaluated -- none before sign-in, and the previous user's after a
 * re-login without a page reload.
 */
const docsApi = () => new DocumentsApi(getConfiguration())

type Props = {
  entityType: DocumentEntityType
  entityId?: number
  /** Heading shown above the table; defaults to the generic "Documents". */
  heading?: string
}

/**
 * Lists the documents attached to a Fineract entity, with upload, download, delete and
 * inline preview. Shared by the client, loan, savings and client-identifier tabs.
 */
const EntityDocumentsTab = ({ entityType, entityId, heading }: Props) => {
  const { t } = useTranslation('common')

  const [docs, setDocs] = useState<EntityDocument[]>([])
  const [loading, setLoading] = useState(true)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (!entityId) {
      setDocs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await docsApi().retrieveAllDocuments(entityType, entityId)
      setDocs((res?.data as EntityDocument[]) ?? [])
    } catch (e) {
      console.error('Failed to load documents', e)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    load()
  }, [load])

  const download = useCallback(
    (documentId: number) =>
      docsApi().downloadFile(entityType, Number(entityId), documentId, {
        responseType: 'blob',
        // The shared client sends `Accept: application/json`, which this endpoint
        // answers with 406 because it returns the raw file.
        headers: { Accept: '*/*' },
      }),
    [entityType, entityId]
  )

  const {
    preview,
    loading: previewLoading,
    error,
    openPreview,
    closePreview,
  } = useDocumentPreview(download)

  const resetForm = () => {
    setName('')
    setDescription('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadDocument = async () => {
    if (!entityId || !file || !name.trim()) return
    setSubmitting(true)
    try {
      await docsApi().createDocument(
        entityType,
        entityId,
        undefined,
        undefined,
        description || undefined,
        undefined,
        name.trim(),
        file
      )
      setAdding(false)
      resetForm()
      await load()
    } catch (e) {
      console.error('Upload failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadDocument = async (doc: EntityDocument) => {
    if (!entityId || doc.id === undefined) return
    try {
      const res = await download(Number(doc.id))
      // Keep the served bytes but give the blob a type the browser understands, so the
      // saved file is not a generic octet-stream download.
      const { blob } = toPreviewBlob(
        res.data as unknown as BlobPart,
        doc.fileName,
        doc.type
      )
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = doc.fileName || doc.name || 'document'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  const deleteDocument = async (doc: EntityDocument) => {
    if (!entityId || doc.id === undefined) return
    if (!confirm(t('documents.confirmDelete'))) return
    try {
      await docsApi().deleteDocument(entityType, entityId, Number(doc.id))
      await load()
    } catch (e) {
      console.error('Delete failed', e)
    }
  }

  const title = useMemo(() => heading ?? t('documents.heading'), [heading, t])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={() => setAdding(v => !v)}
          disabled={!entityId}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('documents.add')}
        </Button>
      </div>

      {adding && (
        <div className="grid gap-3 rounded border bg-white p-4 md:grid-cols-3 dark:bg-zinc-900">
          <div className="space-y-2">
            <Label htmlFor="doc-name">{t('documents.name')}</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('documents.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-description">
              {t('documents.description')}
            </Label>
            <Input
              id="doc-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('documents.optional')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-file">{t('documents.file')}</Label>
            <Input
              id="doc-file"
              type="file"
              ref={fileInputRef}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-2 md:col-span-3">
            <Button
              variant="outline"
              onClick={() => {
                setAdding(false)
                resetForm()
              }}
            >
              {t('documents.cancel')}
            </Button>
            <Button
              className="bg-[#0e77b7] hover:bg-[#0662a3] text-white border-0"
              onClick={uploadDocument}
              disabled={!name.trim() || !file || submitting}
            >
              {submitting ? t('documents.uploading') : t('documents.upload')}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded border bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">{t('documents.name')}</TableHead>
              <TableHead className="w-2/4">
                {t('documents.description')}
              </TableHead>
              <TableHead className="w-1/4">{t('documents.fileName')}</TableHead>
              <TableHead className="text-right">
                {t('documents.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm">
                  {t('documents.loading')}
                </TableCell>
              </TableRow>
            ) : docs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-zinc-500"
                >
                  {t('documents.empty')}
                </TableCell>
              </TableRow>
            ) : (
              docs.map((doc, index) => (
                <TableRow key={doc.id ?? index}>
                  <TableCell>{doc.name || '—'}</TableCell>
                  <TableCell>{doc.description || '—'}</TableCell>
                  <TableCell>{doc.fileName || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      {isPreviewable(doc.fileName, doc.type) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openPreview(doc, t('documents.previewFailed'))
                          }
                          title={t('documents.preview')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(doc)}
                      >
                        {t('documents.download')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDocument(doc)}
                      >
                        {t('documents.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentPreviewDialog
        preview={preview}
        loading={previewLoading}
        error={error}
        onClose={closePreview}
      />
    </div>
  )
}

export default EntityDocumentsTab
