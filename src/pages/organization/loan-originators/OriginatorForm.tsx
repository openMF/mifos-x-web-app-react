/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  codeLabel,
  type CodeOption,
  type LoanOriginator,
  type LoanOriginatorPayload,
  type LoanOriginatorTemplate,
} from './types'

/** Select value for "no originator type / channel" */
const NONE = 'none'

/** A type or channel id for the payload: the id, null to clear it, or nothing */
const codeField = (
  key: 'originatorTypeId' | 'channelTypeId',
  value: string,
  isEdit: boolean
) => {
  if (value !== NONE) return { [key]: Number(value) }
  return isEdit ? { [key]: null } : {}
}

type OriginatorFormProps = {
  title: string
  template: LoanOriginatorTemplate
  /** The originator being edited; omitted when creating */
  initial?: LoanOriginator
  cancelPath: string
  /** Sends the request; resolves to an error message, or null on success */
  onSubmit: (payload: LoanOriginatorPayload) => Promise<string | null>
}

/**
 * The Create and Edit Loan Originator form of the Angular web app. The
 * external ID comes from the template on create and cannot be changed after.
 */
const OriginatorForm = ({
  title,
  template,
  initial,
  cancelPath,
  onSubmit,
}: OriginatorFormProps) => {
  const navigate = useNavigate()
  const isEdit = initial !== undefined
  const [externalId, setExternalId] = useState(
    initial?.externalId ?? template.externalId ?? ''
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [status, setStatus] = useState(initial?.status ?? '')
  const [typeId, setTypeId] = useState(
    initial?.originatorType?.id ? String(initial.originatorType.id) : NONE
  )
  const [channelId, setChannelId] = useState(
    initial?.channelType?.id ? String(initial.channelType.id) : NONE
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const trimmedName = name.trim()
    if (!isEdit && !externalId.trim())
      return setError('Please enter an external ID.')
    if (!trimmedName) return setError('Please enter a name.')
    // Same rule as the Angular web app
    if (!/^[A-Za-z]/.test(trimmedName))
      return setError('The name must start with a letter.')
    if (!status) return setError('Please select a status.')

    setSubmitting(true)
    setError(null)
    const message = await onSubmit({
      ...(isEdit ? {} : { externalId: externalId.trim() }),
      name: trimmedName,
      status,
      // On edit, Fineract keeps a field that is left out, so "None" sends null
      ...codeField('originatorTypeId', typeId, isEdit),
      ...codeField('channelTypeId', channelId, isEdit),
    })
    // On success the page has already navigated away
    if (message) {
      setError(message)
      setSubmitting(false)
    }
  }

  const codeSelect = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: CodeOption[]
  ) => (
    <div className="w-full space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {options.map(o => (
            <SelectItem key={o.id} value={String(o.id)}>
              {codeLabel(o.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="w-full space-y-2">
          <Label htmlFor="externalId">External ID{isEdit ? '' : '*'}</Label>
          <Input
            id="externalId"
            value={externalId}
            disabled={isEdit}
            onChange={e => {
              setExternalId(e.target.value)
              setError(null)
            }}
          />
        </div>

        <div className="w-full space-y-2">
          <Label htmlFor="originatorName">Name*</Label>
          <Input
            id="originatorName"
            value={name}
            onChange={e => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </div>

        <div className="w-full space-y-2">
          <Label htmlFor="status">Status*</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {(template.statusOptions ?? []).map(s => (
                <SelectItem key={s} value={s}>
                  {codeLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {codeSelect(
          'originatorType',
          'Originator Type',
          typeId,
          setTypeId,
          template.originatorTypeOptions ?? []
        )}
        {codeSelect(
          'channelType',
          'Channel Type',
          channelId,
          setChannelId,
          template.channelTypeOptions ?? []
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(cancelPath)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={submitting}
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}

export default OriginatorForm
