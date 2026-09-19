/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from 'react'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { sanitizeHtml } from '@/lib/sanitize-html'

import { templateHtmlClasses } from './templateHtmlStyles'
import type { TemplateTextFormat } from './templateText'

export interface TemplateTextEditorHandle {
  /** Inserts a snippet at the caret, used by the parameter buttons. */
  insert: (snippet: string) => void
}

interface TemplateTextEditorProps {
  format: TemplateTextFormat
  onFormatChange: (format: TemplateTextFormat) => void
  text: string
  onTextChange: (text: string) => void
  ref?: Ref<TemplateTextEditorHandle>
}

interface RichTextCommand {
  command: string
  label: string
  icon: typeof Bold
}

const RICH_TEXT_COMMANDS: RichTextCommand[] = [
  { command: 'bold', label: 'Bold', icon: Bold },
  { command: 'italic', label: 'Italic', icon: Italic },
  { command: 'underline', label: 'Underline', icon: Underline },
  { command: 'insertUnorderedList', label: 'Bulleted list', icon: List },
  { command: 'insertOrderedList', label: 'Numbered list', icon: ListOrdered },
  {
    command: 'removeFormat',
    label: 'Clear formatting',
    icon: RemoveFormatting,
  },
  { command: 'undo', label: 'Undo', icon: Undo2 },
  { command: 'redo', label: 'Redo', icon: Redo2 },
]

/**
 * The template body editor, in whichever of the two formats is selected.
 *
 * Switching format is handled by the caller's draft state, not here: this
 * component only renders the surface for the current one. The rich-text side
 * is a `contentEditable` region kept uncontrolled — React is told what the
 * body is, but never re-writes the DOM while the user is typing in it, which
 * is what would otherwise send the caret back to the start on every keystroke.
 */
const TemplateTextEditor = ({
  format,
  onFormatChange,
  text,
  onTextChange,
  ref,
}: TemplateTextEditorProps) => {
  const editableRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  /** The markup this component last read out of the DOM. */
  const lastReadFromDom = useRef<string | null>(null)
  /** Where the caret was before the user clicked a toolbar or parameter button. */
  const savedRange = useRef<Range | null>(null)
  const textRef = useRef(text)

  useEffect(() => {
    textRef.current = text
  }, [text])

  const readFromDom = useCallback(() => {
    const html = editableRef.current?.innerHTML ?? ''
    lastReadFromDom.current = html
    onTextChange(html)
  }, [onTextChange])

  // Seeds the region whenever it mounts — including on a switch back from
  // plain text, where the previous DOM node is gone but `text` has not changed.
  const attachEditable = useCallback((element: HTMLDivElement | null) => {
    editableRef.current = element
    savedRange.current = null
    if (!element) return
    element.innerHTML = sanitizeHtml(textRef.current)
    lastReadFromDom.current = textRef.current
  }, [])

  // Picks up changes made anywhere other than the region itself, such as a
  // format switch or the entity change that clears the body.
  useEffect(() => {
    const element = editableRef.current
    if (!element || text === lastReadFromDom.current) return
    element.innerHTML = sanitizeHtml(text)
    lastReadFromDom.current = text
  }, [text])

  const rememberSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection?.rangeCount) return
    if (!editableRef.current?.contains(selection.anchorNode)) return
    savedRange.current = selection.getRangeAt(0).cloneRange()
  }, [])

  const restoreSelection = useCallback(() => {
    const element = editableRef.current
    if (!element) return
    element.focus()
    const selection = window.getSelection()
    if (!selection) return
    if (savedRange.current) {
      selection.removeAllRanges()
      selection.addRange(savedRange.current)
      return
    }
    // No prior caret: append at the end rather than at the start.
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [])

  const runCommand = useCallback(
    (command: string) => {
      restoreSelection()
      if (command === 'createLink') {
        const url = window.prompt('Link URL')
        if (!url) return
        document.execCommand(command, false, url)
      } else {
        document.execCommand(command)
      }
      rememberSelection()
      readFromDom()
    },
    [readFromDom, rememberSelection, restoreSelection]
  )

  const insertIntoTextarea = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current
      const start = textarea?.selectionStart ?? text.length
      const end = textarea?.selectionEnd ?? start
      onTextChange(text.slice(0, start) + snippet + text.slice(end))

      const caret = start + snippet.length
      requestAnimationFrame(() => {
        textarea?.focus()
        textarea?.setSelectionRange(caret, caret)
      })
    },
    [onTextChange, text]
  )

  useImperativeHandle(
    ref,
    () => ({
      insert: (snippet: string) => {
        if (format === 'plain') {
          insertIntoTextarea(snippet)
          return
        }
        restoreSelection()
        // insertText rather than insertHTML: a parameter such as
        // `{{#client.groups}}` is literal text, never markup.
        document.execCommand('insertText', false, snippet)
        rememberSelection()
        readFromDom()
      },
    }),
    [
      format,
      insertIntoTextarea,
      readFromDom,
      rememberSelection,
      restoreSelection,
    ]
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="template-text-editor">
          Text<span className="text-red-600">*</span>
        </Label>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={format}
          // Radix reports an empty string when the active item is clicked
          // again; a body always has a format, so that is ignored.
          onValueChange={value => {
            if (value === 'html' || value === 'plain') onFormatChange(value)
          }}
          aria-label="Template body format"
        >
          <ToggleGroupItem value="html">HTML</ToggleGroupItem>
          <ToggleGroupItem value="plain">Plain text</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {format === 'html' ? (
        <div className="rounded-md border border-input">
          <div className="flex flex-wrap items-center gap-1 border-b border-input p-1">
            {RICH_TEXT_COMMANDS.map(({ command, label, icon: Icon }) => (
              <Button
                key={command}
                type="button"
                variant="ghost"
                size="sm"
                title={label}
                aria-label={label}
                // Keep the caret in the body: without this the button takes
                // focus first and the command has no selection to act on.
                onMouseDown={event => event.preventDefault()}
                onClick={() => runCommand(command)}
              >
                <Icon className="size-4" />
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Insert link"
              aria-label="Insert link"
              onMouseDown={event => event.preventDefault()}
              onClick={() => runCommand('createLink')}
            >
              <LinkIcon className="size-4" />
            </Button>
          </div>

          <div
            id="template-text-editor"
            ref={attachEditable}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Template body"
            className={`min-h-64 overflow-auto p-3 text-sm outline-none ${templateHtmlClasses}`}
            onInput={readFromDom}
            onBlur={rememberSelection}
            onKeyUp={rememberSelection}
            onMouseUp={rememberSelection}
          />
        </div>
      ) : (
        <Textarea
          id="template-text-editor"
          ref={textareaRef}
          value={text}
          onChange={event => onTextChange(event.target.value)}
          aria-label="Template body"
          spellCheck={false}
          className="min-h-64 font-mono text-sm whitespace-pre"
        />
      )}

      <p className="text-xs text-muted-foreground">
        {format === 'html'
          ? 'Formatting is kept when you switch to plain text and back.'
          : 'Line breaks and indentation are kept when you switch to HTML and back.'}
      </p>
    </div>
  )
}

export default TemplateTextEditor
