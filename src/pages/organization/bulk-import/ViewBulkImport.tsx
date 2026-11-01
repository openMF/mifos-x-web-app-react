/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BULK_IMPORTS, type BulkImportItem } from './bulk-imports-data'
import { formatDate } from '@/lib/date-utils'
import axios from 'axios'
import {
  getApiBaseUrl,
  getAuthHeaders,
  getDefaultHeaders,
} from '@/lib/http-client'
import { cn } from '@/lib/utils'
import {
  Download,
  Upload,
  Folder,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  FileDown,
  AlertCircle,
} from 'lucide-react'

interface OfficeItem {
  id: number
  name: string
}

interface StaffItem {
  id: number
  displayName: string
}

interface ImportDocumentItem {
  importId: number | string
  name: string
  importTime?: number[] | string | Date
  endTime?: number[] | string | Date
  completed?: boolean
  totalRecords?: number
  successCount?: number
  failureCount?: number
}

export const ViewBulkImport = () => {
  const { importName } = useParams<{ importName?: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current bulk import specification
  const currentName = importName || 'Clients'
  const bulkImport: BulkImportItem =
    BULK_IMPORTS.find(
      b => b.name.toLowerCase() === currentName.toLowerCase()
    ) || BULK_IMPORTS[4] // Default: Clients

  // Form State
  const [offices, setOffices] = useState<OfficeItem[]>([])
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [selectedOffice, setSelectedOffice] = useState<string>('')
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  // Initially empty to show "Legal Form*" placeholder in red just like Angular WebApp
  const [legalForm, setSelectedLegalForm] = useState<'Person' | 'Entity' | ''>(
    ''
  )

  // Upload State
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Download State
  const [downloading, setDownloading] = useState(false)

  // Documents List State
  const [documents, setDocuments] = useState<ImportDocumentItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Axios client configured for Fineract API with request interceptor
  const apiClient = useMemo(() => {
    const client = axios.create({
      baseURL: getApiBaseUrl(),
      headers: getDefaultHeaders(),
    })
    client.interceptors.request.use(config => {
      Object.assign(config.headers, getAuthHeaders())
      return config
    })
    return client
  }, [])

  // Fetch offices on mount
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiClient.get('/offices')
        if (!cancelled && Array.isArray(res.data)) {
          setOffices(res.data)
        }
      } catch {
        if (!cancelled) {
          setOffices([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiClient])

  // Fetch staff when selected office changes
  useEffect(() => {
    if (!selectedOffice) {
      setStaff([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await apiClient.get('/staff', {
          params: { officeId: selectedOffice },
        })
        if (!cancelled && Array.isArray(res.data)) {
          setStaff(res.data)
        }
      } catch {
        if (!cancelled) {
          setStaff([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiClient, selectedOffice])

  // Fetch import documents history
  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const res = await apiClient.get('/imports', {
        params: { entityType: bulkImport.entityType },
      })
      setDocuments(Array.isArray(res.data) ? res.data : [])
    } catch {
      setDocuments([])
      setUploadMessage({
        type: 'error',
        text: 'Could not load import history.',
      })
    } finally {
      setLoadingDocs(false)
    }
  }, [apiClient, bulkImport.entityType])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    setDownloading(true)
    const activeLegalForm = legalForm || 'Person'
    try {
      const legalFormType =
        activeLegalForm === 'Entity' ? 'CLIENTS_ENTITY' : 'CLIENTS_PERSON'
      const params: Record<string, string> = {
        tenantIdentifier: 'default',
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      }
      if (selectedOffice) params.officeId = selectedOffice
      if (selectedStaff) params.staffId = selectedStaff
      if (bulkImport.name === 'Clients') params.legalFormType = legalFormType

      const res = await apiClient.get(
        `${bulkImport.urlSuffix}/downloadtemplate`,
        {
          params,
          responseType: 'blob',
        }
      )

      const blob = new Blob([res.data], {
        type:
          res.headers['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${bulkImport.name}_${activeLegalForm}_Template.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      setUploadMessage({
        type: 'error',
        text: 'Failed to download template. Please try again.',
      })
    } finally {
      setDownloading(false)
    }
  }

  // Handle Upload Template
  const handleUploadTemplate = async () => {
    if (!file) return
    setUploading(true)
    setUploadMessage(null)
    try {
      let legalFormType = ''
      if (bulkImport.name === 'Clients') {
        if (file.name.toLowerCase().includes('entity')) {
          legalFormType = 'CLIENTS_ENTITY'
        } else {
          legalFormType = 'CLIENTS_PERSON'
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('locale', 'en')
      formData.append('dateFormat', 'dd MMMM yyyy')

      const params: Record<string, string> = {}
      if (legalFormType) params.legalFormType = legalFormType

      await apiClient.post(`${bulkImport.urlSuffix}/uploadtemplate`, formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadMessage({
        type: 'success',
        text: 'File uploaded successfully and submitted for bulk processing!',
      })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDocuments()
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { defaultUserMessage?: string } }
      }
      setUploadMessage({
        type: 'error',
        text:
          error?.response?.data?.defaultUserMessage ||
          `Upload of "${file.name}" failed. Check the file and try again.`,
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle Download Error / Output Document
  const handleDownloadDocument = async (
    docName: string,
    docId: number | string
  ) => {
    try {
      const res = await apiClient.get('/imports/downloadOutputTemplate', {
        params: { importDocumentId: docId, tenantIdentifier: 'default' },
        responseType: 'blob',
      })
      const blob = new Blob([res.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `Output_${docName}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      window.alert('Output document could not be retrieved from the server.')
    }
  }

  const paginatedDocs = documents.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(documents.length / pageSize))

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-[1240px] mx-auto text-[15px]">
      {/* Mifos Angular Style Header: Blue bar, Title & inline Sub-breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-6 bg-[#1074b9] rounded-sm inline-block shrink-0" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
            {bulkImport.name}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 pl-3">
          <span
            role="link"
            tabIndex={0}
            onClick={() => navigate('/organization')}
            onKeyDown={e => {
              if (e.key === 'Enter') navigate('/organization')
            }}
            className="text-[#1074b9] hover:underline cursor-pointer focus:outline-none"
          >
            Organization
          </span>
          <span className="text-gray-400">&gt;</span>
          <span
            role="link"
            tabIndex={0}
            onClick={() => navigate('/organization/bulk-import')}
            onKeyDown={e => {
              if (e.key === 'Enter') navigate('/organization/bulk-import')
            }}
            className="text-[#1074b9] hover:underline cursor-pointer focus:outline-none"
          >
            Bulk Import
          </span>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-400">{bulkImport.name}</span>
        </div>
      </div>

      {/* Top 2 Cards: Left (Download Template) & Right (Upload File) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 mb-8">
        {/* Left Card: Clients Template */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700/70 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-6">
              {bulkImport.name} Template
            </h2>

            <div className="space-y-4">
              {/* Office Field */}
              {bulkImport.formFields >= 1 && (
                <div className="relative">
                  <Select
                    value={selectedOffice}
                    onValueChange={setSelectedOffice}
                  >
                    <SelectTrigger className="w-full h-12 bg-[#f5f5f5] dark:bg-zinc-700/50 border-0 border-b border-gray-400 dark:border-zinc-500 rounded-t-sm rounded-b-none px-4 text-sm text-gray-700 dark:text-zinc-200 focus:ring-0 focus:border-[#1074b9] shadow-none cursor-pointer flex items-center justify-between [&>svg]:text-gray-600 [&>svg]:opacity-100">
                      <SelectValue placeholder="Office" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map(o => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Staff Field */}
              {bulkImport.formFields >= 2 && (
                <div className="relative">
                  <Select
                    value={selectedStaff}
                    onValueChange={setSelectedStaff}
                  >
                    <SelectTrigger className="w-full h-12 bg-[#f5f5f5] dark:bg-zinc-700/50 border-0 border-b border-gray-400 dark:border-zinc-500 rounded-t-sm rounded-b-none px-4 text-sm text-gray-700 dark:text-zinc-200 focus:ring-0 focus:border-[#1074b9] shadow-none cursor-pointer flex items-center justify-between [&>svg]:text-gray-600 [&>svg]:opacity-100">
                      <SelectValue placeholder="Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Legal Form Field (Required with Red style when unselected, matching Angular) */}
              {bulkImport.formFields === 3 && (
                <div className="relative">
                  <Select
                    value={legalForm}
                    onValueChange={v =>
                      setSelectedLegalForm(v as 'Person' | 'Entity')
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full h-12 bg-[#f5f5f5] dark:bg-zinc-700/50 border-0 rounded-t-sm rounded-b-none px-4 text-sm focus:ring-0 shadow-none cursor-pointer flex items-center justify-between transition-colors',
                        !legalForm
                          ? 'border-b-2 border-red-500 text-red-500 [&>span]:text-red-500 [&>svg]:text-red-500 [&>svg]:opacity-100'
                          : 'border-b border-gray-400 dark:border-zinc-500 text-gray-700 dark:text-zinc-200 [&>svg]:text-gray-600 [&>svg]:opacity-100'
                      )}
                    >
                      <SelectValue placeholder="Legal Form*" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Person">Person</SelectItem>
                      <SelectItem value="Entity">Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-8">
            <Button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="w-full h-11 bg-[#1074b9] hover:bg-[#0d639e] text-white font-medium flex items-center justify-center gap-2 rounded-md shadow-none cursor-pointer text-sm"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? 'Downloading...' : 'Download'}</span>
            </Button>
          </div>
        </div>

        {/* Right Card: Clients Upload */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700/70 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[350px]">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-6">
              {bulkImport.name}
            </h2>

            <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-3 font-normal">
              Select Excel File
            </label>

            {/* Input Row: Underlined display box + Browse folder trigger */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-11 bg-[#f5f5f5] dark:bg-zinc-700/50 border-0 border-b border-gray-500 dark:border-zinc-400 rounded-t-sm rounded-b-none flex items-center px-3.5 text-sm cursor-pointer select-none truncate"
              >
                {file ? (
                  <span className="text-gray-900 dark:text-zinc-100 font-medium truncate">
                    {file.name}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-zinc-400">
                    No file selected
                  </span>
                )}
              </div>

              {/* Browse Icon with label underneath */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center px-1 py-0.5 text-gray-800 dark:text-zinc-200 hover:text-[#1074b9] dark:hover:text-[#1074b9] transition-colors cursor-pointer select-none shrink-0"
              >
                <Folder className="h-6 w-6 fill-gray-800 dark:fill-zinc-200 stroke-none" />
                <span className="text-[12px] font-medium mt-0.5">Browse</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0])
                  }
                }}
              />
            </div>

            {/* Hint text */}
            <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-8 font-normal leading-relaxed">
              Please retain the value Entity/Person in the filename.
            </p>

            {/* Feedback alert if upload happened */}
            {uploadMessage && (
              <div
                className={cn(
                  'mt-4 p-3 rounded-md text-xs flex items-center gap-2',
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                )}
              >
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="pt-8">
            <Button
              onClick={handleUploadTemplate}
              disabled={!file || uploading}
              className={cn(
                'w-full h-11 font-medium flex items-center justify-center gap-2 rounded-md shadow-none transition-colors text-sm',
                file && !uploading
                  ? 'bg-[#1074b9] hover:bg-[#0d639e] text-white cursor-pointer'
                  : 'bg-[#e0e0e0] dark:bg-zinc-700 text-[#9e9e9e] dark:text-zinc-400 cursor-not-allowed hover:bg-[#e0e0e0]'
              )}
            >
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Card: Documents History Table */}
      <Card className="bg-white dark:bg-zinc-800 rounded-2xl border-gray-100 dark:border-zinc-700/70 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
              Documents
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              disabled={loadingDocs}
              className="text-xs border-gray-300 dark:border-zinc-600 h-8 flex items-center gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingDocs ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-700">
            <Table>
              <TableHeader className="bg-gray-50/70 dark:bg-zinc-800/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    NAME
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    IMPORT TIME
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    END TIME
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    COMPLETED
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    TOTAL RECORDS
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    SUCCESS COUNT
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    FAILURE COUNT
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 dark:text-zinc-300 text-right">
                    DOWNLOAD OUTPUT
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocs.map(doc => (
                  <TableRow
                    key={doc.importId}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium text-xs text-gray-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-[#1074b9] shrink-0" />
                        <span
                          className="truncate max-w-[200px]"
                          title={doc.name}
                        >
                          {doc.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-gray-600 dark:text-zinc-400">
                      {formatDate(doc.importTime) || '—'}
                    </TableCell>

                    <TableCell className="text-xs text-gray-600 dark:text-zinc-400">
                      {formatDate(doc.endTime) || '—'}
                    </TableCell>

                    <TableCell className="text-xs">
                      {doc.completed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Processing</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-gray-700 dark:text-zinc-300 font-mono">
                      {doc.totalRecords ?? 0}
                    </TableCell>

                    <TableCell className="text-xs text-emerald-600 font-mono font-medium">
                      {doc.successCount ?? 0}
                    </TableCell>

                    <TableCell className="text-xs text-rose-600 font-mono font-medium">
                      {doc.failureCount ?? 0}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownloadDocument(doc.name, doc.importId)
                        }
                        className="h-8 w-8 p-0 text-[#1074b9] hover:text-[#0d639e] hover:bg-blue-50 dark:hover:bg-zinc-700"
                        title="Download Output Template"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedDocs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-xs text-gray-400"
                    >
                      No document history available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ViewBulkImport
