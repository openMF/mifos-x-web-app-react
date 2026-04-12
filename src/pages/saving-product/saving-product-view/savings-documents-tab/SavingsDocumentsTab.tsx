/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentsApi, SavingsAccountApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const api = new SavingsAccountApi(getConfiguration())
const docsApi = new DocumentsApi(getConfiguration())

type Doc = Record<string, unknown>

const SavingsDocumentsTab = () => {
  const { accountId } = useParams()
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<Doc[]>([])

  // add form
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    try {
      const res = await api.retrieveOne25(
        Number(accountId),
        undefined,
        undefined,
        'documents'
      )
      const data = res?.data as Record<string, unknown> | undefined
      setDocs((data?.documents as Doc[]) || [])
    } catch (e) {
      console.error('Failed to load documents', e)
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    load()
  }, [load])

  // --- actions ---
  const uploadDocument = async () => {
    if (!accountId || !file || !name.trim()) return
    try {
      await docsApi.createDocument(
        'savings',
        Number(accountId),
        undefined,
        undefined,
        description || undefined,
        undefined,
        name.trim(),
        file
      )
      setAdding(false)
      setName('')
      setDescription('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await load()
    } catch (e) {
      console.error(e)
      alert('Upload failed')
    }
  }

  const downloadDocument = async (doc: Doc) => {
    if (!accountId || !doc?.id) return
    try {
      const res = await docsApi.downloadFile(
        'savings',
        Number(accountId),
        Number(doc.id),
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(
        new Blob([res.data as unknown as BlobPart])
      )
      const a = document.createElement('a')
      a.href = url
      a.download = (doc.fileName as string) || 'document'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  const deleteDocument = async (doc: Doc) => {
    if (!accountId || !doc?.id) return
    if (!confirm('Delete this document?')) return
    try {
      await docsApi.deleteDocument('savings', Number(accountId), Number(doc.id))
      await load()
    } catch (e) {
      console.error(e)
      alert('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold ">Documents</h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3]"
          onClick={() => setAdding(v => !v)}
        >
          + Add
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="border rounded p-4 grid gap-3 md:grid-cols-3 bg-white dark:bg-zinc-900">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Name</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Document name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-desc">Description</Label>
            <Input
              id="doc-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              ref={fileInputRef}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAdding(false)
                setName('')
                setDescription('')
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Cancel
            </Button>
            <Button onClick={uploadDocument} disabled={!name.trim() || !file}>
              Upload
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Name</TableHead>
              <TableHead className="w-2/4">Description</TableHead>
              <TableHead className="w-1/4">File Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading…</TableCell>
              </TableRow>
            ) : docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No documents</TableCell>
              </TableRow>
            ) : (
              docs.map((d: Doc) => (
                <TableRow key={d.id as string | number}>
                  <TableCell>{String(d.name ?? '')}</TableCell>
                  <TableCell>{String(d.description || '—')}</TableCell>
                  <TableCell>{String(d.fileName || '—')}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(d)}
                      >
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDocument(d)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SavingsDocumentsTab
