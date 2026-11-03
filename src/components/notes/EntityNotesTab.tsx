/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { NotesApi, type NoteData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { EntityNotesTabProps } from './types'

/**
 * Built per call rather than once at module load: `getConfiguration()` snapshots the
 * auth headers, so a long-lived instance would keep sending stale credentials.
 */
const notesApi = () => new NotesApi(getConfiguration())

/**
 * Shared notes tab component for Fineract entities (Clients, Groups, Centers, Loans).
 * Provides listing, adding, inline editing, and deletion of notes.
 */
const EntityNotesTab = ({
  entityType,
  entityId,
  heading,
}: EntityNotesTabProps) => {
  const { t, i18n } = useTranslation('common')

  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [actionError, setActionError] = useState('')

  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  /** Identifies the newest request, so a response for a previous entity is discarded. */
  const loadIdRef = useRef(0)
  /** The entity currently on screen, so an action started for another entity does not touch this one. */
  const currentIdRef = useRef(entityId)
  /** Set synchronously to prevent duplicate submissions on rapid Enter presses. */
  const addingRef = useRef(false)

  const load = useCallback(async () => {
    const requestId = ++loadIdRef.current
    if (!entityId) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadFailed(false)
    try {
      const res = await notesApi().retrieveNotesByResource(
        entityType,
        Number(entityId)
      )
      if (requestId !== loadIdRef.current) return
      setNotes(res?.data ?? [])
    } catch (e) {
      if (requestId !== loadIdRef.current) return
      console.error(`Failed to load ${entityType} notes`, e)
      setNotes([])
      setLoadFailed(true)
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    currentIdRef.current = entityId
  }, [entityId])

  useEffect(() => {
    setNewNote('')
    setEditingId(null)
    setActionError('')
    load()
  }, [load])

  const addNote = async () => {
    const note = newNote.trim()
    if (!entityId || !note || addingRef.current) return
    addingRef.current = true
    setAdding(true)
    setActionError('')
    try {
      await notesApi().addNewNote(entityType, Number(entityId), { note })
      if (currentIdRef.current !== entityId) return
      setNewNote('')
      await load()
    } catch (e) {
      console.error(`Failed to add ${entityType} note`, e)
      if (currentIdRef.current === entityId) {
        setActionError(
          t('notes.addFailed', 'Could not add the note. Please try again.')
        )
      }
    } finally {
      addingRef.current = false
      setAdding(false)
    }
  }

  const beginEdit = (note: NoteData) => {
    if (note.id === undefined) return
    setEditingId(note.id)
    setEditText(note.note ?? '')
    setActionError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async () => {
    const note = editText.trim()
    if (!entityId || editingId === null || !note) return
    setSaving(true)
    setActionError('')
    try {
      await notesApi().updateNote(entityType, Number(entityId), editingId, {
        note,
      })
      if (currentIdRef.current !== entityId) return
      cancelEdit()
      await load()
    } catch (e) {
      console.error(`Failed to update ${entityType} note`, e)
      if (currentIdRef.current === entityId) {
        setActionError(
          t(
            'notes.updateFailed',
            'Could not update the note. Please try again.'
          )
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (noteId?: number) => {
    if (!entityId || noteId === undefined) return
    if (!confirm(t('notes.confirmDelete', 'Delete this note?'))) return
    setActionError('')
    try {
      await notesApi().deleteNote(entityType, Number(entityId), noteId)
      if (currentIdRef.current !== entityId) return
      await load()
    } catch (e) {
      console.error(`Failed to delete ${entityType} note`, e)
      if (currentIdRef.current === entityId) {
        setActionError(
          t(
            'notes.deleteFailed',
            'Could not delete the note. Please try again.'
          )
        )
      }
    }
  }

  const title = useMemo(
    () => heading ?? t('notes.heading', 'Notes'),
    [heading, t]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
      </div>

      {/* Input section */}
      <div className="flex items-center gap-4">
        <Input
          placeholder={t('notes.placeholder', 'Write a note ....')}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault()
              addNote()
            }
          }}
          disabled={!entityId || adding}
          className="flex-1"
        />
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white shrink-0"
          onClick={addNote}
          disabled={!entityId || !newNote.trim() || adding}
        >
          {adding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('notes.adding', 'Adding...')}
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              {t('notes.addButton', '+ Add')}
            </>
          )}
        </Button>
      </div>

      {actionError && (
        <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
      )}

      <hr className="border-gray-200 dark:border-zinc-700" />

      {/* Notes list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0e77b7]" />
            {t('notes.loading', 'Loading notes...')}
          </div>
        ) : loadFailed ? (
          <div className="py-6 text-center text-sm text-red-600 dark:text-red-400">
            {t('notes.loadFailed', 'Could not load notes.')}
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('notes.empty', 'No notes have been added.')}
          </div>
        ) : (
          notes.map(note => (
            <Card
              key={note.id}
              className="py-4 shadow-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              <CardContent className="px-4 py-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-medium text-foreground">
                      {t('notes.createdBy', 'Created By: {{name}}', {
                        name: note.createdByUsername || '—',
                      })}
                    </span>
                    <span>
                      {t('notes.date', 'Date: {{date}}', {
                        date: formatDate(note.createdOn, i18n.language),
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === note.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={!editText.trim() || saving}
                          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : null}
                          {t('notes.saveButton', 'Save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          {t('notes.cancelButton', 'Cancel')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => beginEdit(note)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          {t('notes.editButton', 'Edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {t('notes.deleteButton', 'Delete')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === note.id ? (
                  <div className="pt-2">
                    <Input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      aria-label={t('notes.editButton', 'Edit')}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          saveEdit()
                        } else if (e.key === 'Escape') {
                          cancelEdit()
                        }
                      }}
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-foreground break-words">
                    {note.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default EntityNotesTab
