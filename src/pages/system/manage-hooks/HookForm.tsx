/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

import {
  firstMissingField,
  hasEvent,
  hookConfigPayload,
  humanize,
  isSecretField,
  type Hook,
  type HookEvent,
  type HookPayload,
  type HooksTemplate,
} from './types'

type HookFormProps = {
  title: string
  template: HooksTemplate
  /** The hook being edited; omitted when creating */
  initial?: Hook
  cancelPath: string
  /** Sends the request; resolves to an error message, or null on success */
  onSubmit: (payload: HookPayload) => Promise<string | null>
}

/**
 * The Create and Edit Hook form of the Angular web app. The settings come
 * from the chosen template's schema in GET /hooks/template, so every template
 * (Web, SMS Bridge, Message Gateway, Elastic Search) gets the fields Fineract
 * requires for it.
 */
const HookForm = ({
  title,
  template,
  initial,
  cancelPath,
  onSubmit,
}: HookFormProps) => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const templates = template.templates ?? []
  const groupings = template.groupings ?? []

  const [templateName, setTemplateName] = useState(
    initial?.name ?? templates.find(t => t.name === 'Web')?.name ?? ''
  )
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [config, setConfig] = useState<Record<string, string>>(
    Object.fromEntries(
      (initial?.config ?? []).map(c => [c.fieldName, c.fieldValue ?? ''])
    )
  )
  const [events, setEvents] = useState<HookEvent[]>(initial?.events ?? [])
  const [grouping, setGrouping] = useState('')
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const schema = templates.find(t => t.name === templateName)?.schema ?? []
  const entities = groupings.find(g => g.name === grouping)?.entities ?? []
  const actions = [
    ...new Set(entities.find(e => e.name === entity)?.actions ?? []),
  ]

  const addEvent = () => {
    if (!entity || !action) return
    if (hasEvent(events, { entityName: entity, actionName: action })) {
      setError(t('hooks.errors.duplicateEvent'))
      return
    }
    setEvents(prev => [...prev, { entityName: entity, actionName: action }])
    setAction('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!templateName) return setError(t('hooks.errors.selectTemplate'))
    if (!displayName.trim()) return setError(t('hooks.errors.enterName'))
    const missing = firstMissingField(schema, config)
    if (missing)
      return setError(
        t('hooks.errors.enterField', { field: missing.fieldName })
      )
    // Fineract refuses a hook without events (registered.events.cannot.be.empty)
    if (events.length === 0) return setError(t('hooks.errors.addEvent'))

    setSubmitting(true)
    setError(null)
    const message = await onSubmit({
      name: templateName,
      displayName: displayName.trim(),
      isActive,
      events,
      config: hookConfigPayload(schema, config),
    })
    // On success the page has already navigated away
    if (message) {
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-4">
          {initial ? (
            <div className="w-full md:w-1/2 space-y-2">
              <Label>{t('hooks.fields.template')}</Label>
              <p className="h-9 flex items-center">{templateName}</p>
            </div>
          ) : (
            <AppSelect
              selectLabel={t('hooks.fields.templateRequired')}
              selectPlaceholder={t('hooks.placeholders.template')}
              selectValue={templateName}
              selectOnChange={v => {
                setTemplateName(v)
                setError(null)
              }}
              selectOptions={templates.map(t => ({ id: t.name, name: t.name }))}
              selectClassname="w-full md:w-1/2 space-y-2"
            />
          )}
          <div className="w-full md:w-1/2 space-y-2">
            <Label htmlFor="hookName">{t('hooks.fields.nameRequired')}</Label>
            <Input
              id="hookName"
              value={displayName}
              onChange={e => {
                setDisplayName(e.target.value)
                setError(null)
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="hookActive"
            checked={isActive}
            onCheckedChange={v => setIsActive(v === true)}
          />
          <Label htmlFor="hookActive">{t('common:status.active')}</Label>
        </div>

        {schema.length > 0 && (
          <fieldset className="space-y-4">
            <legend className="font-semibold mb-2">
              {t('hooks.settings', { template: templateName })}
            </legend>
            {schema.map(field => (
              <div key={field.fieldName} className="w-full space-y-2">
                <Label htmlFor={`config-${field.fieldName}`}>
                  {field.fieldName}
                  {field.optional ? '' : '*'}
                </Label>
                <Input
                  id={`config-${field.fieldName}`}
                  type={isSecretField(field.fieldName) ? 'password' : 'text'}
                  autoComplete="off"
                  placeholder={field.placeholder}
                  value={config[field.fieldName] ?? ''}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      [field.fieldName]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </fieldset>
        )}

        <fieldset className="space-y-3">
          <legend className="font-semibold mb-2">
            {t('hooks.events.title')}
          </legend>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t('hooks.events.help')}
          </p>
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <AppSelect
              selectLabel={t('hooks.fields.group')}
              selectPlaceholder={t('hooks.placeholders.group')}
              selectValue={grouping}
              selectOnChange={v => {
                setGrouping(v)
                setEntity('')
                setAction('')
              }}
              selectOptions={groupings.map(g => ({
                id: g.name,
                name: humanize(g.name),
              }))}
              selectClassname="w-full md:w-1/3 space-y-2"
            />
            <AppSelect
              selectLabel={t('common:fields.entity')}
              selectPlaceholder={t('hooks.placeholders.entity')}
              selectValue={entity}
              selectOnChange={v => {
                setEntity(v)
                setAction('')
              }}
              selectOptions={entities.map(en => ({
                id: en.name,
                name: humanize(en.name),
              }))}
              selectClassname="w-full md:w-1/3 space-y-2"
            />
            <AppSelect
              selectLabel={t('hooks.fields.action')}
              selectPlaceholder={t('hooks.placeholders.action')}
              selectValue={action}
              selectOnChange={setAction}
              selectOptions={actions.map(a => ({ id: a, name: humanize(a) }))}
              selectClassname="w-full md:w-1/4 space-y-2"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!entity || !action}
              onClick={addEvent}
            >
              {t('hooks.actions.add')}
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">
                    {t('common:fields.entity')}
                  </TableHead>
                  <TableHead className="px-4 py-2">
                    {t('hooks.fields.action')}
                  </TableHead>
                  <TableHead className="px-4 py-2 w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-4 py-3 text-center text-zinc-500"
                    >
                      {t('hooks.events.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((ev, i) => (
                    <TableRow key={`${ev.entityName}-${ev.actionName}`}>
                      <TableCell className="px-4 py-2">
                        {humanize(ev.entityName)}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {humanize(ev.actionName)}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={t('hooks.events.remove', {
                            entity: ev.entityName,
                            action: ev.actionName,
                          })}
                          onClick={() =>
                            setEvents(prev => prev.filter((_, j) => j !== i))
                          }
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-red-600"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </fieldset>

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
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={submitting}
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default HookForm
