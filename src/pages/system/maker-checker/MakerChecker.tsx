/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import fineract from '@/lib/axios'

/** One row of GET /permissions?makerCheckerable=true */
type Permission = {
  grouping?: string
  code: string
  entityName?: string
  actionName?: string
  selected?: boolean
}

type GlobalConfig = { id?: number; enabled?: boolean }

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** The server's message, if any; the page falls back to its own text */
const apiErrorMessage = (err: unknown) => {
  const data = (err as AxiosError<ApiErrorResponse>).response?.data
  return data?.errors?.[0]?.defaultUserMessage || data?.defaultUserMessage
}

type PageError = { kind: 'loadFailed' | 'saveFailed'; message?: string }

/** CREATE_LOAN_CHECKER -> "Create Loan Checker", loan_reschedule -> "Loan Reschedule" */
const humanize = (code?: string) =>
  (code ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/**
 * System > Configure Maker Checker Tasks, as in the Angular web app: which
 * actions need a second user (the checker) to approve them. The choices only
 * take effect while the global "maker-checker" configuration is enabled, so
 * the page shows that switch's state too.
 */
const MakerChecker = () => {
  const { t } = useTranslation(['organization', 'common'])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null)
  const [grouping, setGrouping] = useState('portfolio')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<PageError | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const load = useCallback(async () => {
    // The global setting only drives the notice: if it can't be read (for example
    // without permission to read configurations), the tasks can still be managed
    const [perms, config] = await Promise.allSettled([
      fineract.get<Permission[]>('v1/permissions', {
        params: { makerCheckerable: true },
      }),
      fineract.get<GlobalConfig>('v1/configurations/name/maker-checker'),
    ])
    if (perms.status === 'fulfilled') {
      setPermissions(perms.value.data ?? [])
    } else {
      setError({ kind: 'loadFailed', message: apiErrorMessage(perms.reason) })
    }
    setGlobalConfig(
      config.status === 'fulfilled' ? (config.value.data ?? {}) : null
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groupings = useMemo(
    () =>
      // Some groupings come in upper case, so sort by the shown name
      [...new Set(permissions.map(p => p.grouping ?? ''))].sort((a, b) =>
        humanize(a).localeCompare(humanize(b))
      ),
    [permissions]
  )

  const isSelected = (p: Permission) =>
    editing && p.code in draft ? draft[p.code] : Boolean(p.selected)

  const term = searchTerm.toLowerCase()
  const shown = permissions.filter(p =>
    term
      ? humanize(p.code).toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term)
      : p.grouping === grouping
  )
  const changes = Object.entries(draft).filter(
    ([code, value]) =>
      Boolean(permissions.find(p => p.code === code)?.selected) !== value
  )

  const startEditing = () => {
    setDraft({})
    setSavedCount(null)
    setError(null)
    setEditing(true)
  }

  const setAllShown = (value: boolean) =>
    setDraft(prev => ({
      ...prev,
      ...Object.fromEntries(shown.map(p => [p.code, value])),
    }))

  const save = async () => {
    if (saving) return
    if (changes.length === 0) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Only the codes that changed, as the Angular web app sends
      await fineract.put(
        'v1/permissions',
        { permissions: Object.fromEntries(changes) },
        { params: { makerCheckerable: true } }
      )
      setSavedCount(changes.length)
      setEditing(false)
      setDraft({})
      await load()
    } catch (err) {
      setError({ kind: 'saveFailed', message: apiErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const selectedIn = (g: string) =>
    permissions.filter(p => p.grouping === g && isSelected(p)).length

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('configureMakerCheckerTasks'), current: true },
        ]}
      />

      {globalConfig && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            globalConfig.enabled
              ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300'
              : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          {globalConfig.enabled ? (
            <Trans
              t={t}
              i18nKey="manageMakerChecker.statusOn"
              components={{ strong: <strong /> }}
            />
          ) : (
            <Trans
              t={t}
              i18nKey="manageMakerChecker.statusOff"
              components={{
                strong: <strong />,
                code: <code />,
                link: (
                  <Link
                    to="/system/configurations"
                    className="font-medium underline"
                  />
                ),
              }}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <Input
          placeholder={t('manageMakerChecker.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm h-11 text-base"
        />
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setEditing(false)
                  setDraft({})
                }}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="button"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                disabled={saving}
                onClick={save}
              >
                {saving
                  ? t('common:actions.saving')
                  : changes.length
                    ? t('manageMakerChecker.saveWithCount', {
                        count: changes.length,
                      })
                    : t('common:actions.save')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              onClick={startEditing}
            >
              {t('common:actions.edit')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error.message || t(`manageMakerChecker.errors.${error.kind}`)}
        </div>
      )}
      {savedCount !== null && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          {t('manageMakerChecker.savedChanges', { count: savedCount })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <nav
          aria-label={t('manageMakerChecker.taskGroups')}
          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-2 h-fit"
        >
          {groupings.map(g => (
            <button
              type="button"
              key={g}
              onClick={() => {
                setGrouping(g)
                setSearchTerm('')
              }}
              aria-current={!term && g === grouping ? 'true' : undefined}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                !term && g === grouping
                  ? 'bg-[#1074b9] text-white'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <span>{humanize(g)}</span>
              <span className="text-xs opacity-80">{selectedIn(g)}</span>
            </button>
          ))}
        </nav>

        <section className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold">
              {term
                ? t('manageMakerChecker.tasksMatching', { term: searchTerm })
                : humanize(grouping)}
            </h2>
            {editing && shown.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllShown(true)}
                >
                  {t('manageMakerChecker.selectAll')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllShown(false)}
                >
                  {t('manageMakerChecker.clearAll')}
                </Button>
              </div>
            )}
          </div>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
            {shown.map(p => (
              <li key={p.code} className="flex items-center gap-2">
                <Checkbox
                  id={`mc-${p.code}`}
                  checked={isSelected(p)}
                  disabled={!editing}
                  onCheckedChange={v =>
                    setDraft(prev => ({ ...prev, [p.code]: v === true }))
                  }
                />
                <label htmlFor={`mc-${p.code}`} className="text-sm">
                  {humanize(p.code)}
                </label>
              </li>
            ))}
          </ul>
          {shown.length === 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t('manageMakerChecker.noTasksMatch')}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default MakerChecker
