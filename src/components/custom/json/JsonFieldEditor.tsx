/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { parseJson, prettyPrintJson } from '@/lib/datatable-json'
import JsonTreeView from './JsonTreeView'

export interface JsonFieldEditorProps {
  id?: string
  label: string
  /** Controlled raw text; the dialog owns it so it can build the payload. */
  value: string
  onChange: (raw: string) => void
  /** Fired when validity flips, so the form can block submission. */
  onValidityChange?: (valid: boolean) => void
  required?: boolean
  disabled?: boolean
  rows?: number
  placeholder?: string
  /** Extra id to append to `aria-describedby`, e.g. a server-side error. */
  describedById?: string
}

/**
 * A textarea for a JSON data table column, with live syntax validation.
 *
 * Fineract does not validate the document: PostgreSQL rejects a malformed one
 * with a database error the user cannot act on, and MySQL may simply store it.
 * The message produced here is the only usable feedback there is, which is why
 * the form blocks submission on it rather than only warning.
 *
 * The value is emitted as raw text. Turning it into the string the API expects
 * is the caller's job, through `toJsonPayloadValue`.
 */
const JsonFieldEditor = ({
  id,
  label,
  value,
  onChange,
  onValidityChange,
  required = false,
  disabled = false,
  rows = 8,
  placeholder = '{ }',
  describedById,
}: JsonFieldEditorProps) => {
  const { t } = useTranslation('datatables')
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`

  // Derived, not stored: a second copy of the validity would only be a second
  // thing to keep in step with the text.
  const parsed = useMemo(() => parseJson(value), [value])
  const missing = required && parsed.empty
  const valid = parsed.empty ? !required : parsed.error === null

  useEffect(() => {
    onValidityChange?.(valid)
  }, [valid, onValidityChange])

  const showError = Boolean(parsed.error) || missing

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fieldId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || parsed.empty || Boolean(parsed.error)}
          onClick={() => onChange(prettyPrintJson(value))}
        >
          <Wand2 className="size-3.5" aria-hidden="true" />
          {t('json.format')}
        </Button>
      </div>

      <Textarea
        id={fieldId}
        value={value}
        rows={rows}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-invalid={showError || undefined}
        aria-describedby={
          [showError ? errorId : null, describedById]
            .filter(Boolean)
            .join(' ') || undefined
        }
        onChange={event => onChange(event.target.value)}
        className="font-mono text-xs"
      />

      {showError && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {missing ? (
            t('json.required')
          ) : (
            <>
              {t('json.invalid')}
              {parsed.error?.line !== undefined && (
                <>
                  {' '}
                  {t('json.errorAt', {
                    line: parsed.error.line,
                    column: parsed.error.column,
                  })}
                </>
              )}
            </>
          )}
        </p>
      )}

      {!parsed.empty && !parsed.error && (
        <Accordion type="single" collapsible>
          <AccordionItem value="preview" className="border-b-0">
            <AccordionTrigger className="py-1 text-xs">
              {t('json.preview')}
            </AccordionTrigger>
            <AccordionContent>
              <JsonTreeView raw={value} hideToolbar />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}

export default JsonFieldEditor
