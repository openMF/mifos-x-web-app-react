/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ResultsetColumnHeaderData } from '@/fineract-api'
import {
  createEntry,
  datatableErrorMessage,
  deleteMultiRowEntry,
  deleteSingleRowEntry,
  fetchDatatableResultSet,
  formatDatatableLabel,
  isMultiRowResultSet,
  toEntries,
  updateMultiRowEntry,
  updateSingleRowEntry,
  type DatatableEntry,
} from '@/lib/datatables-api'
import DatatableEntryDialog from './DatatableEntryDialog'
import DatatableMultiRow from './DatatableMultiRow'
import DatatableSingleRow from './DatatableSingleRow'

export interface EntityDatatableTabProps {
  /**
   * The entity the entries belong to. The data table endpoints are keyed by
   * table name and entity id alone, so the kind of entity never appears in a
   * request -- which is what lets one component serve every entity view.
   */
  entityId?: number
  /** The registered data table name. */
  datatableName: string
  /** Heading above the entries; defaults to the table's own name. */
  heading?: string
}

/**
 * The entries one data table holds for one entity, for viewing and editing.
 *
 * Shared by every entity view: the data table API is keyed by application
 * table and entity id, so nothing here needs to know which kind of entity it
 * is looking at.
 */
const EntityDatatableTab = ({
  entityId,
  datatableName,
  heading,
}: EntityDatatableTabProps) => {
  const { t } = useTranslation('datatables')

  const [columnHeaders, setColumnHeaders] = useState<
    ResultsetColumnHeaderData[]
  >([])
  const [entries, setEntries] = useState<DatatableEntry[]>([])
  const [multiRow, setMultiRow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DatatableEntry | undefined>()

  /** Identifies the newest request, so stale responses can be discarded. */
  const loadIdRef = useRef(0)

  const load = useCallback(async () => {
    // These routes keep the component mounted while the entity id changes, so
    // a slower response for the previous entity must not land here: the edit
    // and delete buttons would then act on that entity's entries.
    const requestId = ++loadIdRef.current
    if (!entityId) {
      setEntries([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resultSet = await fetchDatatableResultSet(datatableName, entityId)
      if (requestId !== loadIdRef.current) return
      setColumnHeaders(resultSet.columnHeaders)
      setMultiRow(isMultiRowResultSet(resultSet.columnHeaders))
      setEntries(toEntries(resultSet))
    } catch (loadError) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to load data table', loadError)
      setEntries([])
      setError(datatableErrorMessage(loadError) ?? t('entry.loadFailed'))
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [datatableName, entityId, t])

  useEffect(() => {
    load()
  }, [load])

  const title = heading ?? formatDatatableLabel(datatableName)
  const singleEntry = useMemo(
    () => (multiRow ? undefined : entries[0]),
    [multiRow, entries]
  )

  const openAdd = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }

  const openEdit = (entry?: DatatableEntry) => {
    setEditing(entry)
    setDialogOpen(true)
  }

  const submit = async (payload: Record<string, unknown>) => {
    if (!entityId) return

    if (!multiRow) {
      if (singleEntry) {
        await updateSingleRowEntry(datatableName, entityId, payload)
      } else {
        await createEntry(datatableName, entityId, payload)
      }
    } else if (editing?.id !== undefined) {
      await updateMultiRowEntry(
        datatableName,
        entityId,
        Number(editing.id),
        payload
      )
    } else {
      await createEntry(datatableName, entityId, payload)
    }

    await load()
  }

  const remove = async (entry?: DatatableEntry) => {
    if (!entityId) return
    if (!window.confirm(t('entry.deleteConfirm'))) return

    try {
      if (multiRow && entry?.id !== undefined) {
        await deleteMultiRowEntry(datatableName, entityId, Number(entry.id))
      } else {
        await deleteSingleRowEntry(datatableName, entityId)
      }
      await load()
    } catch (deleteError) {
      console.error('Failed to delete data table entry', deleteError)
      setError(datatableErrorMessage(deleteError) ?? t('entry.saveFailed'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      {loading ? (
        <p className="text-sm text-zinc-500">{t('loading')}</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : multiRow ? (
        <DatatableMultiRow
          columnHeaders={columnHeaders}
          entries={entries}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={remove}
        />
      ) : (
        <DatatableSingleRow
          columnHeaders={columnHeaders}
          entry={singleEntry}
          onAdd={openAdd}
          onEdit={() => openEdit(singleEntry)}
          onDelete={() => remove(singleEntry)}
        />
      )}

      <DatatableEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`${editing ? t('entry.edit') : t('entry.add')} — ${title}`}
        columnHeaders={columnHeaders}
        entry={editing}
        onSubmit={submit}
      />
    </div>
  )
}

export default EntityDatatableTab
