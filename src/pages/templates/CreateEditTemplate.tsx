/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import fineract from '@/lib/axios'
import { getConfiguration } from '@/lib/fineract-openapi'
import { UserGeneratedDocumentsApi, type TemplateMapper } from '@/fineract-api'

import TemplateTextEditor, {
  type TemplateTextEditorHandle,
} from './TemplateTextEditor'
import { useTemplateTextDraft } from './useTemplateTextDraft'
import { htmlToPlainText } from './templateText'
import {
  clientParameterLabels,
  loanParameterLabels,
  repaymentParameterLabels,
} from './templateParameterLabels'

const templatesApi = new UserGeneratedDocumentsApi(getConfiguration())

/** Entity ids Fineract assigns; the parameter groups on offer follow them. */
const CLIENT_ENTITY_ID = 0
const LOAN_ENTITY_ID = 1

interface TemplateOption {
  id: number
  name: string
}

/** Shape of `/templates/template` and `/templates/{id}/template`. */
interface TemplateFormData {
  entities?: TemplateOption[]
  types?: TemplateOption[]
  template?: {
    id?: number
    name?: string
    text?: string
    entity?: number | string
    type?: number | string
    mappers?: TemplateMapper[]
  }
}

/**
 * Fineract returns the entity and type of a saved template as a name, while
 * the options and the request body use ids. Resolves either form to an id.
 */
const toOptionId = (
  value: number | string | undefined,
  options: TemplateOption[]
): string => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') return value.toString()
  const match = options.find(
    option => option.name.toLowerCase() === value.toLowerCase()
  )
  return match ? match.id.toString() : ''
}

const defaultMapper = (entityId: string): TemplateMapper => {
  const tenant = localStorage.getItem('mifosTenant') || 'default'
  return Number(entityId) === CLIENT_ENTITY_ID
    ? {
        mapperorder: 0,
        mapperkey: 'client',
        mappervalue: `clients/{{clientId}}?tenantIdentifier=${tenant}`,
      }
    : {
        mapperorder: 0,
        mapperkey: 'loan',
        mappervalue: `loans/{{loanId}}?associations=all&tenantIdentifier=${tenant}`,
      }
}

const CreateEditTemplate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const mode = id ? 'edit' : 'create'

  const [formData, setFormData] = useState<TemplateFormData | null>(null)
  const [name, setName] = useState('')
  const [entity, setEntity] = useState('')
  const [type, setType] = useState('')
  const [mappers, setMappers] = useState<TemplateMapper[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draft = useTemplateTextDraft()
  const editorRef = useRef<TemplateTextEditorHandle>(null)
  const { reset: resetDraft } = draft

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // The raw client's base URL stops at /fineract-provider/api, so the
        // version segment belongs in the path, as in loginApi and Callback.
        const path =
          mode === 'edit'
            ? `/v1/templates/${id}/template`
            : '/v1/templates/template'
        const response = await fineract.get<TemplateFormData>(path)
        const data = response.data
        setFormData(data)

        const entities = data.entities ?? []
        const types = data.types ?? []

        if (mode === 'edit' && data.template) {
          setName(data.template.name ?? '')
          setEntity(toOptionId(data.template.entity, entities))
          setType(toOptionId(data.template.type, types))
          setMappers(data.template.mappers ?? [])
          resetDraft(data.template.text ?? '')
        } else {
          const firstEntity = entities[0]?.id ?? CLIENT_ENTITY_ID
          setEntity(firstEntity.toString())
          setMappers([defaultMapper(firstEntity.toString())])
        }
      } catch (err) {
        console.error('Failed to fetch template form data', err)
        setError('Could not load the template form. Please try again.')
      }
    }
    fetchFormData()
  }, [id, mode, resetDraft])

  /**
   * Changing the entity invalidates the body — its parameters belong to the
   * old entity — and swaps the default mapper for the new one.
   */
  const handleEntityChange = useCallback(
    (value: string) => {
      if (value === entity) return
      setEntity(value)
      resetDraft('')
      setMappers(existing => [defaultMapper(value), ...existing.slice(1)])
    },
    [entity, resetDraft]
  )

  const updateMapper = (index: number, patch: Partial<TemplateMapper>) => {
    setMappers(existing =>
      existing.map((mapper, position) =>
        position === index ? { ...mapper, ...patch } : mapper
      )
    )
  }

  const addMapper = () => {
    setMappers(existing => [
      ...existing,
      { mapperorder: existing.length, mapperkey: '', mappervalue: '' },
    ])
  }

  const removeMapper = (index: number) => {
    setMappers(existing =>
      existing
        .filter((_, position) => position !== index)
        .map((mapper, position) => ({ ...mapper, mapperorder: position }))
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        name,
        entity: Number(entity),
        type: Number(type),
        // The body is submitted in the format it was authored in; the draft
        // hands back the source for whichever one is on screen.
        text: draft.text,
        mappers,
      }

      if (mode === 'edit') {
        const templateId = Number(id)
        // Fineract rejects the update without the id in the body as well.
        await templatesApi.saveTemplate(templateId, {
          ...payload,
          id: templateId,
        })
        navigate(`/templates/${templateId}`)
      } else {
        const response = await templatesApi.createTemplate(payload)
        const created = (response.data as { resourceId?: number }).resourceId
        navigate(created ? `/templates/${created}` : '/templates')
      }
    } catch (err) {
      console.error(`Failed to ${mode} template`, err)
      setError(
        `Could not ${mode === 'edit' ? 'update' : 'create'} the template.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !formData) {
    return <div className="py-10 text-center text-red-600">{error}</div>
  }

  if (!formData) {
    return <div className="py-10 text-center">Loading template form...</div>
  }

  const entityOptions = (formData.entities ?? []).map(option => ({
    id: option.id.toString(),
    name: option.name,
  }))
  const typeOptions = (formData.types ?? []).map(option => ({
    id: option.id.toString(),
    name: option.name,
  }))

  const parameterGroups = [
    {
      title: 'Client Parameters',
      labels: clientParameterLabels,
      visible: Number(entity) === CLIENT_ENTITY_ID,
    },
    {
      title: 'Loan Parameters',
      labels: loanParameterLabels,
      visible: Number(entity) === LOAN_ENTITY_ID,
    },
    {
      title: 'Repayment Schedule Parameters',
      labels: repaymentParameterLabels,
      visible: Number(entity) === LOAN_ENTITY_ID,
    },
  ].filter(group => group.visible)

  // An "empty" rich-text body is rarely the empty string — browsers leave a
  // stray `<br>` behind — so emptiness is judged on the text it renders as.
  const bodyIsEmpty =
    (draft.format === 'html'
      ? htmlToPlainText(draft.text)
      : draft.text
    ).trim() === ''

  const isValid =
    name.trim() !== '' && entity !== '' && type !== '' && !bodyIsEmpty

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Templates', href: '/templates' },
          ...(mode === 'edit'
            ? [{ label: `${id}`, href: `/templates/${id}` }]
            : []),
          { label: mode === 'edit' ? 'Edit' : 'Create', current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {mode === 'edit' ? 'Edit Template' : 'Create Template'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Entity*"
              selectValue={entity}
              selectOnChange={handleEntityChange}
              selectPlaceholder="Select Entity"
              selectOptions={entityOptions}
            />
            <AppSelect
              selectLabel="Type*"
              selectValue={type}
              selectOnChange={setType}
              selectPlaceholder="Select Type"
              selectOptions={typeOptions}
            />
            <div className="w-full md:w-[48%] space-y-2">
              <Label htmlFor="template-name">Name*</Label>
              <Input
                id="template-name"
                value={name}
                onChange={event => setName(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Button
              type="button"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              onClick={() => setShowAdvanced(current => !current)}
            >
              Advanced Options
            </Button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {mappers.length === 0 && (
                  <Button type="button" variant="outline" onClick={addMapper}>
                    <Plus className="mr-2 size-4" />
                    Add
                  </Button>
                )}
                {mappers.map((mapper, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-4">
                    <div className="w-full md:w-[40%] space-y-2">
                      <Label htmlFor={`mapper-key-${index}`}>Mapper Key</Label>
                      <Input
                        id={`mapper-key-${index}`}
                        value={mapper.mapperkey ?? ''}
                        onChange={event =>
                          updateMapper(index, { mapperkey: event.target.value })
                        }
                      />
                    </div>
                    <div className="w-full md:w-[40%] space-y-2">
                      <Label htmlFor={`mapper-value-${index}`}>
                        Mapper Value
                      </Label>
                      <Input
                        id={`mapper-value-${index}`}
                        value={mapper.mappervalue ?? ''}
                        onChange={event =>
                          updateMapper(index, {
                            mappervalue: event.target.value,
                          })
                        }
                      />
                    </div>
                    {index === 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addMapper}
                      >
                        <Plus className="mr-2 size-4" />
                        Add
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeMapper(index)}
                      >
                        <Minus className="mr-2 size-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <TemplateTextEditor
            ref={editorRef}
            format={draft.format}
            onFormatChange={draft.setFormat}
            text={draft.text}
            onTextChange={draft.setText}
          />

          {parameterGroups.length > 0 && (
            <Accordion type="single" collapsible>
              {parameterGroups.map(group => (
                <AccordionItem key={group.title} value={group.title}>
                  <AccordionTrigger>{group.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {group.labels.map(label => (
                        <Button
                          key={label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs"
                          // Inserting must not move focus out of the body, or
                          // the caret position to insert at is lost.
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => editorRef.current?.insert(label)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(mode === 'edit' ? `/templates/${id}` : '/templates')
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!isValid || submitting}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEditTemplate
