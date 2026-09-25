/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { memo, useId, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  childCount,
  childPath,
  isJsonContainer,
  jsonEntries,
  jsonKind,
  type JsonKind,
} from '@/lib/datatable-json'

/** One indentation step, in pixels. */
const INDENT = 14

/**
 * Applied as an inline style rather than a class: Tailwind only emits the
 * utilities it can see in the source, so a computed `pl-[Npx]` would never
 * exist in the stylesheet.
 */
const indentStyle = (depth: number) => ({ paddingLeft: depth * INDENT })

const LEAF_CLASS: Record<JsonKind, string> = {
  string: 'text-emerald-700 dark:text-emerald-400',
  number: 'text-blue-700 dark:text-blue-400',
  boolean: 'text-purple-700 dark:text-purple-400',
  null: 'text-zinc-400 dark:text-zinc-500 italic',
  object: '',
  array: '',
}

/** Renders a leaf the way it appears in the document, quotes included. */
const leafText = (value: unknown, kind: JsonKind) =>
  kind === 'string' ? `"${String(value)}"` : String(value)

export interface JsonTreeNodeProps {
  /** Object key or array index, already stringified. */
  nodeKey: string
  value: unknown
  /** Expansion-set key, e.g. `$.address[0]`. */
  path: string
  depth: number
  expanded: ReadonlySet<string>
  onToggle: (path: string) => void
  /** True when the parent is an array, so the key is an index. */
  isArrayItem: boolean
  /** True for the single root row, which has no key of its own. */
  isRoot?: boolean
}

/**
 * A single row of the JSON tree, plus its children when open.
 *
 * The component is fully controlled: expansion lives in one set owned by
 * `JsonTreeView`, which is what lets expand-all and collapse-all be a single
 * state update instead of a message broadcast through the tree.
 */
const JsonTreeNode = memo(function JsonTreeNode({
  nodeKey,
  value,
  path,
  depth,
  expanded,
  onToggle,
  isArrayItem,
  isRoot = false,
}: JsonTreeNodeProps) {
  const { t } = useTranslation('datatables')
  const childListId = useId()

  const kind = jsonKind(value)
  const container = isJsonContainer(value)
  const open = expanded.has(path)

  const keyLabel = isRoot ? '' : isArrayItem ? `${nodeKey}:` : `"${nodeKey}":`

  if (!container) {
    return (
      <li
        style={indentStyle(depth)}
        className="flex gap-1 py-0.5 leading-relaxed break-all"
      >
        {keyLabel && (
          <span className="text-zinc-700 dark:text-zinc-300">{keyLabel}</span>
        )}
        <span className={LEAF_CLASS[kind]}>{leafText(value, kind)}</span>
      </li>
    )
  }

  const entries = jsonEntries(value)
  const count = childCount(value)
  const isArray = kind === 'array'
  const countLabel = isArray
    ? t('json.items', { count })
    : t('json.keys', { count })

  /**
   * The disclosure pattern rather than `role="tree"`: a real tree needs roving
   * tabindex and full arrow navigation, and a half-implemented one reads worse
   * to a screen reader than a plain group of buttons. Enter and Space come for
   * free from the button; left and right are added because they are what
   * people try in a tree.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' && !open) {
      event.preventDefault()
      onToggle(path)
    } else if (event.key === 'ArrowLeft' && open) {
      event.preventDefault()
      onToggle(path)
    }
  }

  return (
    <li className="leading-relaxed">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={childListId}
        onClick={() => onToggle(path)}
        onKeyDown={onKeyDown}
        style={indentStyle(depth)}
        className="flex w-full items-center gap-1 py-0.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm cursor-pointer"
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'size-3 shrink-0 text-zinc-500 transition-transform',
            open && 'rotate-90'
          )}
        />
        {keyLabel && (
          <span className="text-zinc-700 dark:text-zinc-300">{keyLabel}</span>
        )}
        <span className="text-zinc-400 dark:text-zinc-500">
          {isArray ? '[' : '{'}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
          {countLabel}
        </span>
        {!open && (
          <span className="text-zinc-400 dark:text-zinc-500">
            {isArray ? ']' : '}'}
          </span>
        )}
      </button>

      {open && (
        <>
          <ul id={childListId} className="list-none">
            {entries.map(([key, child]) => (
              <JsonTreeNode
                key={key}
                nodeKey={key}
                value={child}
                path={childPath(path, key, isArray)}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                isArrayItem={isArray}
              />
            ))}
          </ul>
          <div
            aria-hidden="true"
            style={indentStyle(depth)}
            className="text-zinc-400 dark:text-zinc-500 pl-4"
          >
            {isArray ? ']' : '}'}
          </div>
        </>
      )}
    </li>
  )
})

export default JsonTreeNode
