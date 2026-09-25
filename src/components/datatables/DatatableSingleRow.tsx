/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import type { ResultsetColumnHeaderData } from '@/fineract-api'
import { Button } from '@/components/ui/button'
import { isJsonColumn } from '@/lib/datatable-json'
import { formatDatatableLabel, type DatatableEntry } from '@/lib/datatables-api'
import DatatableCell from './DatatableCell'

export interface DatatableSingleRowProps {
  columnHeaders: ResultsetColumnHeaderData[]
  /** The single entry, or undefined when the entity has none yet. */
  entry?: DatatableEntry
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * The one entry a one-to-one data table holds for an entity, as a label/value
 * list. JSON columns take a full row of their own so the tree has room.
 */
const DatatableSingleRow = ({
  columnHeaders,
  entry,
  onAdd,
  onEdit,
  onDelete,
}: DatatableSingleRowProps) => {
  const { t } = useTranslation('datatables')

  if (!entry) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-zinc-500">{t('entry.none')}</p>
        <Button type="button" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          {t('entry.add')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          {t('entry.edit')}
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" />
          {t('entry.delete')}
        </Button>
      </div>

      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {columnHeaders.map(header => {
          const name = header.columnName as string
          return (
            <div
              key={name}
              className={isJsonColumn(header) ? 'sm:col-span-2' : undefined}
            >
              <dt className="text-sm font-medium text-zinc-500">
                {formatDatatableLabel(name)}
              </dt>
              <dd className="mt-1 text-sm">
                <DatatableCell header={header} value={entry[name]} />
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

export default DatatableSingleRow
