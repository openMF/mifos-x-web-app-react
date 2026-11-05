/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SchedulerApi } from '@/fineract-api'
import fineract from '@/lib/axios'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faClockRotateLeft,
  faPen,
  faPlay,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorDetail,
  formatDateTime,
  type JobsError,
  type SchedulerJob,
} from './types'

const schedulerApi = new SchedulerApi(getConfiguration())

/** A green or red pill */
const Badge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
      ok
        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
    }`}
  >
    {label}
  </span>
)

/** The status of a run: Success in green, anything else (e.g. Failed) in red */
const RunStatus = ({ status }: { status: string }) => {
  const { t } = useTranslation('organization')
  const ok = status.toLowerCase() === 'success'
  return (
    <Badge
      ok={ok}
      label={
        ok
          ? t('jobs.list.success')
          : status.charAt(0).toUpperCase() + status.slice(1)
      }
    />
  )
}

/**
 * System > Manage Jobs: the scheduler jobs of the Angular web app. Shows
 * whether the scheduler is running, every job with its last and next run,
 * and runs the selected jobs now.
 */
const SchedulerJobs = () => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<SchedulerJob[]>([])
  const [schedulerActive, setSchedulerActive] = useState<boolean | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [busy, setBusy] = useState<'scheduler' | 'run' | null>(null)
  const [error, setError] = useState<JobsError | null>(null)
  const [startedCount, setStartedCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const [jobsRes, statusRes] = await Promise.all([
        fineract.get<SchedulerJob[]>('v1/jobs'),
        schedulerApi.retrieveStatus(),
      ])
      setJobs(jobsRes.data ?? [])
      setSchedulerActive(Boolean(statusRes.data?.active))
      // A successful refresh clears an earlier load failure, but not per-job run failures
      setError(prev =>
        prev && 'key' in prev && prev.key === 'loadJobs' ? null : prev
      )
    } catch (err) {
      setError({ key: 'loadJobs', detail: apiErrorDetail(err) })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleScheduler = async () => {
    if (busy || schedulerActive === null) return
    setBusy('scheduler')
    setError(null)
    try {
      await schedulerApi.changeSchedulerStatus(
        schedulerActive ? 'stop' : 'start'
      )
      setSchedulerActive(!schedulerActive)
    } catch (err) {
      setError({ key: 'changeStatus', detail: apiErrorDetail(err) })
    } finally {
      setBusy(null)
    }
  }

  const runSelected = async () => {
    if (busy || selected.length === 0) return
    setBusy('run')
    setError(null)
    setStartedCount(0)
    const failed: string[] = []
    // One at a time, as the Angular web app does, so a failure names its job
    for (const jobId of selected) {
      try {
        await fineract.post(
          `v1/jobs/${jobId}`,
          {},
          { params: { command: 'executeJob' } }
        )
      } catch (err) {
        const name = jobs.find(j => j.jobId === jobId)?.displayName ?? jobId
        failed.push(
          `${name}: ${apiErrorDetail(err) ?? t('jobs.errors.notStarted')}`
        )
      }
    }
    const started = selected.length - failed.length
    setStartedCount(started)
    if (failed.length) setError({ text: failed.join(' ') })
    setSelected([])
    setBusy(null)
    await load()
  }

  const errorText = (e: JobsError) =>
    'text' in e ? e.text : (e.detail ?? t(`jobs.errors.${e.key}`))

  const term = searchTerm.toLowerCase()
  const filtered = jobs.filter(j =>
    (j.displayName ?? '').toLowerCase().includes(term)
  )
  const allFilteredSelected =
    filtered.length > 0 && filtered.every(j => selected.includes(j.jobId ?? -1))

  // Only the jobs shown by the filter change; hidden selections are kept
  const toggleAll = (checked: boolean) => {
    const ids = filtered.map(j => j.jobId ?? -1)
    setSelected(prev =>
      checked
        ? Array.from(new Set([...prev, ...ids]))
        : prev.filter(id => !ids.includes(id))
    )
  }

  const toggleOne = (jobId: number, checked: boolean) =>
    setSelected(prev =>
      checked ? [...prev, jobId] : prev.filter(id => id !== jobId)
    )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageJobs'), current: true },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-medium">{t('jobs.list.scheduler')}</span>
          {schedulerActive === null ? (
            <span>—</span>
          ) : (
            <Badge
              ok={schedulerActive}
              label={
                schedulerActive
                  ? t('common:status.active')
                  : t('jobs.list.suspended')
              }
            />
          )}
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {schedulerActive === null
              ? ''
              : schedulerActive
                ? t('jobs.list.activeHint')
                : t('jobs.list.suspendedHint')}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null || schedulerActive === null}
            onClick={toggleScheduler}
          >
            {schedulerActive
              ? t('jobs.list.suspendScheduler')
              : t('jobs.list.activateScheduler')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={load}>
            <FontAwesomeIcon icon={faRotate} className="mr-2" />
            {t('common:tooltips.refresh')}
          </Button>
          <Button
            type="button"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={busy !== null || selected.length === 0}
            onClick={runSelected}
          >
            <FontAwesomeIcon icon={faPlay} className="mr-2" />
            {busy === 'run'
              ? t('jobs.list.starting')
              : selected.length
                ? t('jobs.list.runSelectedCount', { count: selected.length })
                : t('jobs.list.runSelected')}
          </Button>
        </div>
      </div>

      <Input
        placeholder={t('jobs.list.filterPlaceholder')}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="max-w-sm h-11 text-base mb-6"
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {errorText(error)}
        </div>
      )}
      {startedCount > 0 && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          {t('jobs.list.started', { count: startedCount })}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-x-auto">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('jobs.list.caption', {
              shown: filtered.length,
              total: jobs.length,
            })}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 py-3 w-10">
                <Checkbox
                  aria-label={t('jobs.list.selectAll')}
                  checked={allFilteredSelected}
                  onCheckedChange={v => toggleAll(v === true)}
                />
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('jobs.list.columns.job')}
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('common:status.active')}
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('jobs.list.columns.previousRun')}
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('jobs.list.columns.nextRun')}
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('jobs.list.columns.running')}
              </TableHead>
              <TableHead className="px-3 py-3">
                {t('jobs.list.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(job => {
              const id = job.jobId ?? -1
              const run = job.lastRunHistory
              const runError = run?.jobRunErrorMessage || job.initializingError
              return (
                <TableRow key={id}>
                  <TableCell className="px-3 py-3">
                    <Checkbox
                      aria-label={t('jobs.list.selectJob', {
                        name: job.displayName,
                      })}
                      checked={selected.includes(id)}
                      onCheckedChange={v => toggleOne(id, v === true)}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3 font-medium whitespace-normal min-w-[220px]">
                    {job.displayName}
                    {runError && (
                      <p
                        className="mt-1 max-w-md truncate text-xs font-normal text-red-700 dark:text-red-300"
                        title={runError}
                      >
                        {runError}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <FontAwesomeIcon
                      icon={job.active ? faCircleCheck : faCircleXmark}
                      className={job.active ? 'text-green-500' : 'text-red-500'}
                      aria-label={
                        job.active
                          ? t('common:status.active')
                          : t('common:status.inactive')
                      }
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span>
                        {formatDateTime(run?.jobRunStartTime, i18n.language)}
                      </span>
                      {run?.status && <RunStatus status={run.status} />}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    {formatDateTime(job.nextRunTime, i18n.language)}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    {job.currentlyRunning
                      ? t('common:actions.yes')
                      : t('common:actions.no')}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t('jobs.list.editJob', {
                          name: job.displayName,
                        })}
                        onClick={() => navigate(`/system/jobs/${id}/edit`)}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t('jobs.list.runHistoryOf', {
                          name: job.displayName,
                        })}
                        onClick={() => navigate(`/system/jobs/${id}/history`)}
                      >
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SchedulerJobs
