/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import {
  CodesApi,
  CodeValuesApi,
  type GetCodesResponse,
  type GetCodeValuesDataResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'

const codesApi = new CodesApi(getConfiguration())
const codeValuesApi = new CodeValuesApi(getConfiguration())

type CodesApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const apiErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as AxiosError<CodesApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

/** Fineract includes active; the generated type leaves it out */
type CodeValue = GetCodeValuesDataResponse & { active?: boolean }

const emptyForm = { name: '', description: '', position: '0', isActive: true }

/**
 * A code and its values (System > Manage Codes > code). Values are listed
 * from GET /codes/{id}/codevalues, added with POST and removed with DELETE,
 * as in the Angular web app.
 */
const ViewCodes = () => {
  const { id } = useParams()
  const codeId = Number(id)
  const [code, setCode] = useState<GetCodesResponse | null>(null)
  const [values, setValues] = useState<CodeValue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  // Load errors stay until the list reloads; action errors clear on the
  // next add, delete or cancel
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // The route reuses this component when only :id changes, so every
  // response is checked against the code currently shown
  const currentCodeId = useRef(codeId)
  // Only the newest list request may update the table, so a slow initial
  // load cannot overwrite the refresh that follows an add or a delete
  const listRequest = useRef(0)

  const fetchValues = useCallback(async () => {
    const request = ++listRequest.current
    const isCurrent = () =>
      request === listRequest.current && codeId === currentCodeId.current
    setLoading(true)
    try {
      const res = await codeValuesApi.retrieveAllCodeValues(codeId)
      if (!isCurrent()) return
      setValues((res.data ?? []) as CodeValue[])
      setLoadError(null)
      setLoading(false)
    } catch (err) {
      if (!isCurrent()) return
      console.error('Could not fetch code values', err)
      setLoadError(apiErrorMessage(err, 'Failed to load code values.'))
      setLoading(false)
    }
  }, [codeId])

  useEffect(() => {
    currentCodeId.current = codeId
    setCode(null)
    setValues([])
    setShowForm(false)
    setForm(emptyForm)
    setLoadError(null)
    setLoading(true)
    setError(null)
    setSaving(false)
    setDeletingId(null)
    const fetchCode = async () => {
      try {
        const res = await codesApi.retrieveCode(codeId)
        if (codeId !== currentCodeId.current) return
        setCode(res.data)
      } catch (err) {
        console.error('Could not fetch code data', err)
      }
    }
    fetchCode()
    fetchValues()
  }, [codeId, fetchValues])

  const handleAdd = async () => {
    const name = form.name.trim()
    if (!name) {
      setError('Please enter a name for the code value.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await codeValuesApi.createCodeValue(codeId, {
        name,
        description: form.description.trim() || undefined,
        position: Number(form.position) || 0,
        isActive: form.isActive,
      })
      if (codeId !== currentCodeId.current) return
      setForm(emptyForm)
      setShowForm(false)
      await fetchValues()
    } catch (err) {
      if (codeId !== currentCodeId.current) return
      setError(apiErrorMessage(err, 'Failed to add code value.'))
    } finally {
      if (codeId === currentCodeId.current) setSaving(false)
    }
  }

  const handleDelete = async (value: CodeValue) => {
    if (!value.id || deletingId !== null) return
    if (!window.confirm(`Delete code value "${value.name}"?`)) return
    setDeletingId(value.id)
    setError(null)
    try {
      await codeValuesApi.deleteCodeValue(codeId, value.id)
      if (codeId !== currentCodeId.current) return
      await fetchValues()
    } catch (err) {
      if (codeId !== currentCodeId.current) return
      setError(apiErrorMessage(err, 'Failed to delete code value.'))
    } finally {
      if (codeId === currentCodeId.current) setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Codes', href: '/system/codes' },
          { label: `${code?.name ?? id}`, current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => {
            setShowForm(true)
            setError(null)
          }}
          disabled={saving}
        >
          <Plus className="mr-2" /> Add Code Value
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
        <h2 className="font-bold">{code?.name}</h2>

        {showForm && (
          <div className="grid grid-cols-6 gap-4 items-end border-t pt-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="codeValueName">Name*</Label>
              <Input
                id="codeValueName"
                value={form.name}
                disabled={saving}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="codeValueDescription">Description</Label>
              <Input
                id="codeValueDescription"
                value={form.description}
                disabled={saving}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="codeValuePosition">Position</Label>
              <Input
                id="codeValuePosition"
                type="number"
                min={0}
                value={form.position}
                disabled={saving}
                onChange={e => setForm({ ...form, position: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="codeValueActive"
                checked={form.isActive}
                disabled={saving}
                onCheckedChange={checked =>
                  setForm({ ...form, isActive: checked === true })
                }
              />
              <Label htmlFor="codeValueActive" className="text-sm">
                Active
              </Label>
            </div>

            <div className="col-span-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm)
                  setError(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                onClick={handleAdd}
                disabled={saving || !form.name.trim()}
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        )}

        {[loadError, error].filter(Boolean).map(message => (
          <div
            key={message}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {message}
          </div>
        ))}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  {loading
                    ? 'Loading code values…'
                    : loadError
                      ? 'Code values could not be loaded.'
                      : 'No code values yet.'}
                </TableCell>
              </TableRow>
            ) : (
              values.map(value => (
                <TableRow key={value.id}>
                  <TableCell>{value.name}</TableCell>
                  <TableCell>{value.description || '—'}</TableCell>
                  <TableCell>{value.position ?? '—'}</TableCell>
                  <TableCell>
                    {value.active === undefined
                      ? '—'
                      : value.active
                        ? 'Yes'
                        : 'No'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId !== null}
                      onClick={() => handleDelete(value)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
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

export default ViewCodes
