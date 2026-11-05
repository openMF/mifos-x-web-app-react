/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate } from '@fortawesome/free-solid-svg-icons'

import DashboardOverview from './DashboardOverview'
import WidgetConfiguration from './WidgetConfiguration'
import {
  fetchDashboard,
  fetchOffices,
  type DashboardData,
  type Office,
} from './data'
import { loadHiddenWidgets, saveHiddenWidgets, type WidgetId } from './widgets'

const AUTO_REFRESH_MS = 10 * 60 * 1000

const TABS = ['overview', 'widgets'] as const

/**
 * System > Manage Dashboards: an institution overview of clients, loans,
 * deposits and shares, and a choice of which of its widgets to show.
 */
const ManageDashboards = () => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview')
  const [offices, setOffices] = useState<Office[]>([])
  const [officeId, setOfficeId] = useState<number | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [hidden, setHidden] = useState<WidgetId[]>(loadHiddenWidgets)

  useEffect(() => {
    fetchOffices()
      .then(list => {
        setOffices(list)
        // The head office covers every office below it
        const head = list.find(o => o.hierarchy === '.') ?? list[0]
        if (head) setOfficeId(head.id)
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [])

  const office = offices.find(o => o.id === officeId)

  const load = useCallback(async () => {
    if (!office) return
    setStatus('loading')
    try {
      setData(await fetchDashboard(office))
      setUpdatedAt(new Date())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [office])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, AUTO_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load])

  const toggleWidget = (id: WidgetId) => {
    const next = hidden.includes(id)
      ? hidden.filter(h => h !== id)
      : [...hidden, id]
    setHidden(next)
    saveHiddenWidgets(next)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageDashboards.title'), current: true },
        ]}
      />

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {t('manageDashboards.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {updatedAt
              ? t('manageDashboards.lastUpdated', {
                  time: updatedAt.toLocaleTimeString(i18n.language),
                })
              : t('manageDashboards.autoRefresh')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={officeId === null ? undefined : String(officeId)}
            onValueChange={value => setOfficeId(Number(value))}
            disabled={offices.length === 0}
          >
            <SelectTrigger
              className="sm:w-64"
              aria-label={t('manageDashboards.office')}
            >
              <SelectValue placeholder={t('manageDashboards.office')} />
            </SelectTrigger>
            <SelectContent>
              {offices.map(o => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={load}
            disabled={!office || status === 'loading'}
          >
            <FontAwesomeIcon
              icon={faRotate}
              className={status === 'loading' ? 'animate-spin' : ''}
            />
            {t('manageDashboards.refresh')}
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        className="mt-6 flex gap-6 border-b border-zinc-200 dark:border-zinc-700"
      >
        {TABS.map(value => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === value
                ? 'border-[#1074b9] text-[#1074b9]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`manageDashboards.tabs.${value}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-6">
        {tab === 'widgets' ? (
          <WidgetConfiguration hidden={hidden} onToggle={toggleWidget} />
        ) : status === 'error' ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 py-12 text-sm text-muted-foreground"
          >
            <p>{t('manageDashboards.loadError')}</p>
            {office && (
              <Button variant="outline" size="sm" onClick={load}>
                {t('common:dashboard.retry')}
              </Button>
            )}
          </div>
        ) : data ? (
          <div
            aria-busy={status === 'loading'}
            className={status === 'loading' ? 'opacity-60' : ''}
          >
            <DashboardOverview data={data} hidden={hidden} />
          </div>
        ) : (
          <p
            role="status"
            className="py-12 text-center text-sm text-muted-foreground"
          >
            {t('common:actions.loading')}
          </p>
        )}
      </div>
    </div>
  )
}

export default ManageDashboards
