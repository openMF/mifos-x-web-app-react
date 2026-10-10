/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { NotesApi, type NoteData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Built per call so it picks up the current credentials; see EntityDocumentsTab.
const notesApi = () => new NotesApi(getConfiguration())

const RESOURCE_TYPE = 'clients'

const ClientNotesTab = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation('clients')

  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [actionError, setActionError] = useState('')

  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)
  /** The client currently on screen, so an action started for another client does not touch this one. */
  const currentIdRef = useRef(id)
  /** Set synchronously, so a second Enter press in the same render cannot send a duplicate note. */
  const addingRef = useRef(false)

  const load = useCallback(async () => {
    const requestId = ++loadIdRef.current
    if (!id) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadFailed(false)
    try {
      const res = await notesApi().retrieveNotesByResource(
        RESOURCE_TYPE,
        Number(id)
      )
      if (requestId !== loadIdRef.current) return
      setNotes(res?.data ?? [])
    } catch (e) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to load client notes', e)
      setNotes([])
      setLoadFailed(true)
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    currentIdRef.current = id
  }, [id])

  useEffect(() => {
    setEditingId(null)
    setActionError('')
    load()
  }, [load])

  const addNote = async () => {
    const note = newNote.trim()
    if (!id || !note || addingRef.current) return
    addingRef.current = true
    setAdding(true)
    setActionError('')
    try {
      await notesApi().addNewNote(RESOURCE_TYPE, Number(id), { note })
      if (currentIdRef.current !== id) return
      setNewNote('')
      await load()
    } catch (e) {
      console.error('Failed to add client note', e)
      if (currentIdRef.current === id) setActionError(t('notes.addFailed'))
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
    if (!id || editingId === null || !note) return
    setSaving(true)
    setActionError('')
    try {
      await notesApi().updateNote(RESOURCE_TYPE, Number(id), editingId, {
        note,
      })
      if (currentIdRef.current !== id) return
      cancelEdit()
      await load()
    } catch (e) {
      console.error('Failed to update client note', e)
      if (currentIdRef.current === id) setActionError(t('notes.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (noteId?: number) => {
    if (!id || noteId === undefined) return
    if (!confirm(t('notes.confirmDelete'))) return
    setActionError('')
    try {
      await notesApi().deleteNote(RESOURCE_TYPE, Number(id), noteId)
      if (currentIdRef.current !== id) return
      await load()
    } catch (e) {
      console.error('Failed to delete client note', e)
      if (currentIdRef.current === id) setActionError(t('notes.deleteFailed'))
    }
  }

  return (
    <div className="text-black dark:text-white px-6 py-4 space-y-4">
      <h2 className="text-lg font-semibold">{t('notes.heading')}</h2>

      {/* Input section */}
      <div className="flex items-start gap-4">
        <Input
          placeholder={t('notes.placeholder')}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) addNote()
          }}
          disabled={!id || adding}
        />
        <Button
          variant="outline"
          className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
          onClick={addNote}
          disabled={!id || !newNote.trim() || adding}
        >
          {t('notes.addButton')}
        </Button>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <hr className="border-gray-400 dark:border-white" />

      {/* Notes list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-zinc-500">{t('notes.loading')}</p>
        ) : loadFailed ? (
          <p className="text-sm text-red-600">{t('notes.loadFailed')}</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('notes.empty')}</p>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-700"
            >
              <div className="flex-1 space-y-1">
                <p>
                  {t('notes.createdBy', {
                    name: note.createdByUsername || '—',
                  })}
                </p>
                <p>
                  {t('notes.date', {
                    date: formatDate(note.createdOn, i18n.language),
                  })}
                </p>
                {editingId === note.id ? (
                  <Input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    aria-label={t('notes.editButton')}
                  />
                ) : (
                  <p className="text-sm italic whitespace-pre-wrap">
                    {note.note}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === note.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={!editText.trim() || saving}
                    >
                      {t('notes.saveButton')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      {t('notes.cancelButton')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => beginEdit(note)}
                    >
                      {t('notes.editButton')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      {t('notes.deleteButton')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ClientNotesTab
