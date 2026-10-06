/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { activities, type Activity } from './activities'

const MAX_RESULTS = 8

const ActivitySearch = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return []

    const labelled = activities.map(activity => ({
      ...activity,
      label: t(`activities.${activity.key}`),
    }))
    const byLabel = (prefix: boolean) =>
      labelled.filter(({ label }) => {
        const lower = label.toLocaleLowerCase()
        return prefix
          ? lower.startsWith(term)
          : !lower.startsWith(term) && lower.includes(term)
      })

    // Labels that start with the search term are listed first.
    return [...byLabel(true), ...byLabel(false)].slice(0, MAX_RESULTS)
  }, [query, t])

  const showResults = open && query.trim() !== ''
  const optionId = (index: number) => `${listboxId}-option-${index}`

  const selectActivity = (activity: Activity) => {
    setQuery('')
    setOpen(false)
    navigate(activity.path)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        setOpen(true)
        if (matches.length === 0) return
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex(
          index => (index + step + matches.length) % matches.length
        )
        break
      }
      case 'Enter':
        if (showResults && matches[activeIndex]) {
          event.preventDefault()
          selectActivity(matches[activeIndex])
        }
        break
      case 'Escape':
        if (showResults) {
          event.preventDefault()
          setOpen(false)
        } else {
          setQuery('')
        }
        break
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={t('ui.searchActivity')}
        aria-autocomplete="list"
        aria-expanded={showResults && matches.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={
          showResults && matches.length > 0 ? optionId(activeIndex) : undefined
        }
        value={query}
        onChange={event => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={t('ui.searchActivityPlaceholder')}
        className="w-full px-4 sm:px-6 py-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />

      {showResults && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
          {matches.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t('ui.searchActivity')}
              className="max-h-80 overflow-y-auto py-2"
            >
              {matches.map((activity, index) => (
                <li
                  key={activity.key}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  // Keep focus in the input so the blur handler does not
                  // close the list before the click registers.
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectActivity(activity)}
                  className={cn(
                    'cursor-pointer px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-800 dark:text-gray-100',
                    index === activeIndex && 'bg-gray-100 dark:bg-zinc-700'
                  )}
                >
                  {activity.label}
                </li>
              ))}
            </ul>
          ) : (
            // Announced through the live region below instead.
            <p
              aria-hidden="true"
              className="px-4 sm:px-6 py-3 text-sm sm:text-base text-gray-500 dark:text-gray-400"
            >
              {t('ui.noActivitiesFound')}
            </p>
          )}
        </div>
      )}

      {/* Kept mounted so screen readers announce changes to its text. */}
      <div role="status" className="sr-only">
        {showResults && matches.length === 0 ? t('ui.noActivitiesFound') : ''}
      </div>
    </div>
  )
}

export default ActivitySearch
