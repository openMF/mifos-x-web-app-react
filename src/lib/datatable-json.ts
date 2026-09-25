/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Everything the app knows about the shape of a JSON data table column.
 *
 * Fineract has no `JSON` display type: `calcColumnDisplayType` groups JSON with
 * the text types, so a JSON column is reported as `columnType: 'JSON'` with
 * `columnDisplayType: 'TEXT'`. Detection therefore has to go through
 * `columnType`, which is what `isJsonColumn` is for.
 */
import {
  type ResultsetColumnHeaderData,
  ResultsetColumnHeaderDataColumnTypeEnum,
} from '@/fineract-api'

/**
 * A JSON cell as it comes off the wire.
 *
 * With `genericResultSet=true` the driver's own value is serialised straight
 * through, and the drivers disagree: PostgreSQL hands Gson a `PGobject`, which
 * reflects into `{ type: 'json', value: '...' }`, while MySQL/MariaDB return a
 * plain string. Both have to be read, so nothing outside `unwrapJsonCell`
 * should ever touch a raw cell.
 */
export type JsonCellWire =
  | string
  | { type?: string; value?: string | null }
  | null
  | undefined

export type JsonKind =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

export interface JsonParseError {
  /** The engine's message, as-is. */
  message: string
  /** 0-based character offset, when the engine reported one. */
  offset?: number
  /** 1-based, derived from `offset`. */
  line?: number
  /** 1-based, derived from `offset`. */
  column?: number
}

export interface ParsedJson {
  /** The text exactly as received or typed: the source of truth for raw mode. */
  raw: string
  /** The parsed document; `undefined` when `error` is set or `empty` is true. */
  value: unknown
  /** `null` when `raw` parses, or when it is empty. */
  error: JsonParseError | null
  /** True when the cell was null, or holds only whitespace. */
  empty: boolean
}

/** Root path of the document; children extend it as `$.key` / `$[0]`. */
export const JSON_ROOT_PATH = '$'

/** True when the backend declared this column as a JSON column. */
export function isJsonColumn(
  header?: ResultsetColumnHeaderData | null
): boolean {
  return header?.columnType === ResultsetColumnHeaderDataColumnTypeEnum.Json
}

/** Collapses the wire shapes to the JSON document text, or null when absent. */
export function unwrapJsonCell(cell: unknown): string | null {
  if (cell === null || cell === undefined) return null
  if (typeof cell === 'string') return cell
  if (typeof cell === 'object') {
    const value = (cell as { value?: unknown }).value
    if (typeof value === 'string') return value
    // Not the PGobject envelope: a backend that stops double-encoding would
    // land here with the document already parsed, so re-encode it rather than
    // rendering "[object Object]".
    try {
      return JSON.stringify(cell)
    } catch {
      return null
    }
  }
  return String(cell)
}

/**
 * V8 reports the failure position in two forms depending on the version:
 * `...at position 12` and `...at position 12 (line 2 column 5)`. Only the
 * offset is read, and line/column are derived from it, so the numbers shown to
 * the user do not change with the engine.
 */
function toParseError(error: unknown, raw: string): JsonParseError {
  const message = error instanceof Error ? error.message : String(error)
  const match = /position (\d+)/.exec(message)
  if (!match) return { message }

  const offset = Math.min(Number(match[1]), raw.length)
  const upToOffset = raw.slice(0, offset)
  const line = upToOffset.split('\n').length
  const column = offset - upToOffset.lastIndexOf('\n')

  return { message, offset, line, column }
}

/** Parses a JSON document. Never throws. */
export function parseJson(raw?: string | null): ParsedJson {
  const text = raw ?? ''
  if (!text.trim()) {
    return { raw: text, value: undefined, error: null, empty: true }
  }
  try {
    return { raw: text, value: JSON.parse(text), error: null, empty: false }
  } catch (error) {
    return {
      raw: text,
      value: undefined,
      error: toParseError(error, text),
      empty: false,
    }
  }
}

/**
 * Indents a JSON document. Unparseable input is returned unchanged so the user
 * still sees exactly what the server stored. Unlike the Angular `prettyPrint`
 * pipe this covers arrays and bare scalars, not only `{...}`.
 */
export function prettyPrintJson(raw?: string | null, indent = 2): string {
  const parsed = parseJson(raw)
  if (parsed.empty || parsed.error) return parsed.raw
  return JSON.stringify(parsed.value, null, indent)
}

/** Single-line form, used for the request payload. */
export function minifyJson(raw?: string | null): string {
  const parsed = parseJson(raw)
  if (parsed.empty || parsed.error) return parsed.raw
  return JSON.stringify(parsed.value)
}

/**
 * A one-line summary for a table cell.
 *
 * A JSON column has no length limit, so the text is sliced before it is parsed:
 * building the object graph for a megabyte-sized document inside a cell render
 * would cost far more than the sixty characters that end up on screen.
 */
export function summarizeJson(raw?: string | null, maxLength = 60): string {
  const text = (raw ?? '').trim()
  if (!text) return ''

  const truncate = (value: string) =>
    value.length > maxLength ? `${value.slice(0, maxLength)}…` : value

  if (text.length > maxLength * 4) return truncate(text)

  const parsed = parseJson(text)
  if (parsed.error) return truncate(text)
  return truncate(JSON.stringify(parsed.value))
}

/**
 * The value to put in a write payload for a JSON column: always a string,
 * because Fineract treats the column as a string type and would reject (or
 * mangle) a nested object. `null` clears an optional column.
 */
export function toJsonPayloadValue(raw?: string | null): string | null {
  const text = (raw ?? '').trim()
  if (!text) return null
  return minifyJson(text)
}

export function jsonKind(value: unknown): JsonKind {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  switch (typeof value) {
    case 'object':
      return 'object'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'string'
  }
}

/** True for values that have children, i.e. that can be expanded. */
export function isJsonContainer(value: unknown): boolean {
  const kind = jsonKind(value)
  return kind === 'object' || kind === 'array'
}

export function childCount(value: unknown): number {
  if (Array.isArray(value)) return value.length
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length
  }
  return 0
}

/** `[key, value]` for objects, `[index, value]` for arrays, `[]` for leaves. */
export function jsonEntries(value: unknown): Array<[string, unknown]> {
  if (Array.isArray(value)) return value.map((item, i) => [String(i), item])
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
  }
  return []
}

/** The path of a child, in the notation used as the expansion-set key. */
export function childPath(
  parentPath: string,
  key: string,
  isArrayItem: boolean
): string {
  return isArrayItem ? `${parentPath}[${key}]` : `${parentPath}.${key}`
}

/**
 * Every expandable path in the document, for "expand all".
 *
 * `maxDepth` caps how deep the walk goes — `collectContainerPaths(value, 1)`
 * returns just the root, which is the default first render.
 */
export function collectContainerPaths(
  value: unknown,
  maxDepth = Number.POSITIVE_INFINITY
): string[] {
  const paths: string[] = []

  const walk = (node: unknown, path: string, depth: number) => {
    if (depth >= maxDepth || !isJsonContainer(node)) return
    paths.push(path)
    const isArrayItem = Array.isArray(node)
    for (const [key, child] of jsonEntries(node)) {
      walk(child, childPath(path, key, isArrayItem), depth + 1)
    }
  }

  walk(value, JSON_ROOT_PATH, 0)
  return paths
}
