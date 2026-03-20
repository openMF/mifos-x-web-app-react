/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { SavingsAccountApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const api = new SavingsAccountApi(getConfiguration())

interface Note {
  id: number
  note?: string
  createdByUsername?: string
  createdByFirstname?: string
  createdOn?: number[] | string
}

const SavingsNotesTab = () => {
  const { accountId } = useParams()

  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Note[]>([])

  // add
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  // edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const load = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    try {
      const res = await api.retrieveOne25(
        Number(accountId),
        undefined,
        undefined,
        'notes'
      )
      const data = res?.data as Record<string, unknown> | undefined
      setNotes((data?.notes as Note[]) || [])
    } catch (e) {
      console.error('Failed to load notes', e)
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    load()
  }, [accountId, load])

  const addNote = async () => {
    if (!accountId || !newNote.trim()) return
    setAdding(true)
    try {
      const resp = await fetch(`/api/v1/savingsaccounts/${accountId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      if (!resp.ok) throw new Error(`Add failed: ${resp.status}`)
      setNewNote('')
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to add note')
    } finally {
      setAdding(false)
    }
  }

  const beginEdit = (n: Note) => {
    setEditingId(n.id)
    setEditText(n.note || '')
  }

  const saveEdit = async () => {
    if (!accountId || editingId == null) return
    try {
      const resp = await fetch(
        `/api/v1/savingsaccounts/${accountId}/notes/${editingId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: editText }),
        }
      )
      if (!resp.ok) throw new Error(`Edit failed: ${resp.status}`)
      setEditingId(null)
      setEditText('')
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to edit note')
    }
  }

  const deleteNote = async (noteId: number) => {
    if (!accountId) return
    if (!confirm('Delete this note?')) return
    try {
      const resp = await fetch(
        `/api/v1/savingsaccounts/${accountId}/notes/${noteId}`,
        { method: 'DELETE' }
      )
      if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`)
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to delete note')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notes</h3>

      {/* Add Note */}
      <div className="flex items-start gap-3">
        <Input
          placeholder="Write a note …"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="min-h-[64px]"
        />
        <Button onClick={addNote} disabled={!newNote.trim() || adding}>
          + Add
        </Button>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-700" />

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div>Loading…</div>
        ) : notes.length === 0 ? (
          <div className="text-sm opacity-70">No notes</div>
        ) : (
          notes.map((n: Note) => (
            <div
              key={n.id}
              className="border rounded p-3 bg-white dark:bg-zinc-900"
            >
              {/* Header meta */}
              <div className="flex justify-between items-center mb-2 text-xs opacity-70">
                <div>
                  {n.createdByUsername || n.createdByFirstname || '—'}{' '}
                  {n.createdOn && (
                    <span className="ml-2">
                      {Array.isArray(n.createdOn)
                        ? new Date(
                            n.createdOn[0],
                            (n.createdOn[1] ?? 1) - 1,
                            n.createdOn[2] ?? 1
                          ).toLocaleDateString()
                        : new Date(n.createdOn).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingId === n.id ? (
                    <>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setEditText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => beginEdit(n)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteNote(n.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              {editingId === n.id ? (
                <Input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="min-h-[88px]"
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {n.note || '—'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SavingsNotesTab
