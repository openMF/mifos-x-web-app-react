/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const CentersNotesTab = () => {
  const [newNote, setNewNote] = useState('')
  const { t } = useTranslation('centers')

  return (
    <div className="text-black dark:text-white px-6 py-4 space-y-4">
      <h2 className="text-lg font-semibold">{t('notes.heading')}</h2>

      {/* Input section */}
      <div className="flex items-start gap-4">
        <Input
          placeholder={t('notes.placeholder')}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
        />
        <Button
          variant="outline"
          className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
        >
          {t('notes.addButton')}
        </Button>
      </div>

      <hr className="border-gray-400 dark:border-white" />

      {/* Notes list */}
      <div className="space-y-4"></div>
    </div>
  )
}

export default CentersNotesTab
