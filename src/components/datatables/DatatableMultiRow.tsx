/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Braces, Pencil, Plus, Trash2 } from 'lucide-react'

import type { ResultsetColumnHeaderData } from '@/fineract-api'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  isJsonColumn,
  summarizeJson,
  unwrapJsonCell,
} from '@/lib/datatable-json'
import {
  formatDatatableLabel,
  isSystemColumn,
  type DatatableEntry,
} from '@/lib/datatables-api'
import JsonTreeView from '@/components/custom/json/JsonTreeView'
import DatatableCell from './DatatableCell'

export interface DatatableMultiRowProps {
  columnHeaders: ResultsetColumnHeaderData[]
  entries: DatatableEntry[]
  onAdd: () => void
  onEdit: (entry: DatatableEntry) => void
  onDelete: (entry: DatatableEntry) => void
}

/**
 * The entries a one-to-many data table holds for an entity.
 *
 * A JSON document is shown as a one-line summary with the tree behind a
 * popover: a row of expanded trees would make the table unreadable, and
 * building one tree per cell is work the user has not asked for.
 */
const DatatableMultiRow = ({
  columnHeaders,
  entries,
  onAdd,
  onEdit,
  onDelete,
}: DatatableMultiRowProps) => {
  const { t } = useTranslation('datatables')

  const columns = columnHeaders.filter(
    header => !isSystemColumn(header.columnName)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          {t('entry.add')}
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">{t('entry.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(header => (
                  <TableHead key={header.columnName}>
                    {formatDatatableLabel(header.columnName)}
                  </TableHead>
                ))}
                <TableHead className="text-right">
                  <span className="sr-only">{t('entry.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={String(entry.id ?? index)}>
                  {columns.map(header => {
                    const name = header.columnName as string
                    const cell = entry[name]

                    if (isJsonColumn(header)) {
                      const raw = unwrapJsonCell(cell)
                      const summary = summarizeJson(raw)
                      return (
                        <TableCell key={name} className="font-mono text-xs">
                          {summary ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="max-w-xs justify-start gap-1 font-mono text-xs"
                                >
                                  <Braces
                                    className="size-3.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{summary}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96">
                                <JsonTreeView
                                  raw={raw}
                                  label={formatDatatableLabel(name)}
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell key={name}>
                        <DatatableCell header={header} value={cell} compact />
                      </TableCell>
                    )
                  })}

                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('entry.edit')}
                      onClick={() => onEdit(entry)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('entry.delete')}
                      onClick={() => onDelete(entry)}
                    >
                      <Trash2
                        className="size-4 text-destructive"
                        aria-hidden="true"
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default DatatableMultiRow
