/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  JSON_ROOT_PATH,
  collectContainerPaths,
  isJsonContainer,
  parseJson,
  prettyPrintJson,
} from '@/lib/datatable-json'
import JsonTreeNode from './JsonTreeNode'

type ViewMode = 'tree' | 'raw'

/**
 * Above this many characters the document is shown as text only, until the
 * user asks for the tree. A JSON column has no length limit, and building the
 * node graph for a very large document freezes the tab it is rendered in.
 */
const DEFAULT_MAX_TREE_LENGTH = 200_000

export interface JsonTreeViewProps {
  /** The JSON document text, already unwrapped from the wire envelope. */
  raw: string | null | undefined
  /** Accessible name for the panel. */
  label?: string
  defaultMode?: ViewMode
  /** Containers shallower than this are open on first render. */
  defaultExpandedDepth?: number
  maxTreeLength?: number
  /** Drops the toolbar, for tight surfaces such as a table-cell popover. */
  hideToolbar?: boolean
  className?: string
}

/**
 * Displays a JSON data table value as a collapsible tree, with a raw view for
 * the exact stored text.
 *
 * Values are attacker-controlled user data, so every one of them is rendered as
 * a React text child. Nothing here sets HTML.
 */
const JsonTreeView = ({
  raw,
  label,
  defaultMode = 'tree',
  defaultExpandedDepth = 1,
  maxTreeLength = DEFAULT_MAX_TREE_LENGTH,
  hideToolbar = false,
  className,
}: JsonTreeViewProps) => {
  const { t } = useTranslation('datatables')

  const parsed = useMemo(() => parseJson(raw), [raw])
  const pretty = useMemo(() => prettyPrintJson(raw), [raw])

  const oversized = parsed.raw.length > maxTreeLength
  const [forceTree, setForceTree] = useState(false)
  /** The tree cannot be built for a broken document, or for an oversized one. */
  const treeAvailable = !parsed.error && (!oversized || forceTree)

  const [mode, setMode] = useState<ViewMode>(defaultMode)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const allPaths = useMemo(
    () => (treeAvailable ? collectContainerPaths(parsed.value) : []),
    [parsed.value, treeAvailable]
  )

  // Reset expansion when the document changes, but keep the chosen view mode:
  // a refetch that returns the same data should not throw the user back to the
  // default view mid-read.
  useEffect(() => {
    setExpanded(
      new Set(collectContainerPaths(parsed.value, defaultExpandedDepth))
    )
  }, [parsed.value, defaultExpandedDepth])

  useEffect(() => {
    if (!treeAvailable) setMode('raw')
  }, [treeAvailable])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const toggle = useCallback((path: string) => {
    setExpanded(current => {
      const next = new Set(current)
      if (!next.delete(path)) next.add(path)
      return next
    })
  }, [])

  const allExpanded = allPaths.length > 0 && expanded.size >= allPaths.length

  // Clipboard access needs a secure context; the button is hidden rather than
  // left there to fail silently when the app is served over plain http.
  const canCopy =
    typeof navigator !== 'undefined' && Boolean(navigator.clipboard)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pretty)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy JSON', error)
    }
  }

  if (parsed.empty) {
    return <span className="text-zinc-400 dark:text-zinc-500">—</span>
  }

  const rootIsContainer = !parsed.error && isJsonContainer(parsed.value)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {!hideToolbar && (
        <div className="flex items-center gap-2 flex-wrap">
          {label && (
            <span className="text-sm font-medium mr-auto">{label}</span>
          )}

          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={mode}
            onValueChange={value => value && setMode(value as ViewMode)}
            aria-label={label}
          >
            <ToggleGroupItem
              value="tree"
              disabled={!treeAvailable}
              aria-label={t('json.mode.tree')}
              className="px-3"
            >
              {t('json.mode.tree')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="raw"
              aria-label={t('json.mode.raw')}
              className="px-3"
            >
              {t('json.mode.raw')}
            </ToggleGroupItem>
          </ToggleGroup>

          {mode === 'tree' && treeAvailable && rootIsContainer && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={
                allExpanded ? t('json.collapseAll') : t('json.expandAll')
              }
              title={allExpanded ? t('json.collapseAll') : t('json.expandAll')}
              onClick={() =>
                setExpanded(allExpanded ? new Set() : new Set(allPaths))
              }
            >
              {allExpanded ? (
                <ChevronsDownUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronsUpDown className="size-4" aria-hidden="true" />
              )}
            </Button>
          )}

          {canCopy && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('json.copy')}
              title={t('json.copy')}
              onClick={copy}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          )}

          <span aria-live="polite" className="sr-only">
            {copied ? t('json.copied') : ''}
          </span>
        </div>
      )}

      {parsed.error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-destructive"
        >
          <AlertTriangle
            className="size-4 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            {t('json.invalid')}
            {parsed.error.line !== undefined && (
              <>
                {' '}
                {t('json.errorAt', {
                  line: parsed.error.line,
                  column: parsed.error.column,
                })}
              </>
            )}
          </span>
        </p>
      )}

      {oversized && !forceTree && !parsed.error && (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          {t('json.tooLarge', { size: parsed.raw.length })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setForceTree(true)
              setMode('tree')
            }}
          >
            {t('json.showAnyway')}
          </Button>
        </p>
      )}

      {mode === 'tree' && treeAvailable ? (
        <ul className="list-none font-mono text-xs overflow-auto max-h-96">
          <JsonTreeNode
            nodeKey=""
            value={parsed.value}
            path={JSON_ROOT_PATH}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            isArrayItem={false}
            isRoot
          />
        </ul>
      ) : (
        <pre
          className={cn(
            'font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all',
            'rounded-md bg-zinc-50 dark:bg-zinc-900 p-2 border border-zinc-200 dark:border-zinc-700'
          )}
        >
          {pretty}
        </pre>
      )}
    </div>
  )
}

export default JsonTreeView
