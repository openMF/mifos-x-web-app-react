/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import fineract from '@/lib/axios'

import {
  apiErrorDetail,
  formatDateTime,
  type JobsError,
  type JobRun,
  type SchedulerJob,
} from './types'

const PAGE_SIZE = 10

/** GET /jobs/{id}/runhistory returns a page */
type RunHistoryPage = { totalFilteredRecords?: number; pageItems?: JobRun[] }

/** The run history of one scheduler job, paged on the server, newest first */
const SchedulerJobHistory = () => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<SchedulerJob | null>(null)
  const [runs, setRuns] = useState<JobRun[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<JobsError | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fineract.get<SchedulerJob>(`v1/jobs/${id}`)
        setJob(res.data ?? {})
      } catch (err) {
        setError({ key: 'loadJob', detail: apiErrorDetail(err) })
      }
    })()
  }, [id])

  useEffect(() => {
    if (!id) return
    // Fast paging can resolve an older page last; only the latest one is shown
    let cancelled = false
    ;(async () => {
      try {
        const res = await fineract.get<RunHistoryPage>(
          `v1/jobs/${id}/runhistory`,
          {
            params: {
              offset: (page - 1) * PAGE_SIZE,
              limit: PAGE_SIZE,
              orderBy: 'id',
              sortOrder: 'DESC',
            },
          }
        )
        if (cancelled) return
        setRuns(res.data?.pageItems ?? [])
        setTotal(res.data?.totalFilteredRecords ?? 0)
      } catch (err) {
        if (!cancelled)
          setError({ key: 'loadHistory', detail: apiErrorDetail(err) })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const errorText = (e: JobsError) =>
    'text' in e ? e.text : (e.detail ?? t(`jobs.errors.${e.key}`))

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageJobs'), href: '/system/jobs' },
          { label: job?.displayName ?? id ?? '', current: true },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">
          {t('jobs.history.title', { name: job?.displayName ?? '' })}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t('common:actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {errorText(error)}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-x-auto">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('jobs.history.caption', {
              count: total,
              page,
              pages: totalPages,
            })}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">
                {t('jobs.history.columns.started')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('jobs.history.columns.ended')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('common:fields.status')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('jobs.history.columns.trigger')}
              </TableHead>
              <TableHead className="px-4 py-3">
                {t('jobs.history.columns.error')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map(run => (
              <TableRow key={run.id}>
                <TableCell className="px-4 py-3">
                  {formatDateTime(run.jobRunStartTime, i18n.language)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {formatDateTime(run.jobRunEndTime, i18n.language)}
                </TableCell>
                <TableCell className="px-4 py-3 capitalize">
                  {run.status ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3 capitalize">
                  {run.triggerType ?? '—'}
                </TableCell>
                <TableCell
                  className="px-4 py-3 max-w-md truncate text-red-700 dark:text-red-300"
                  title={run.jobRunErrorMessage}
                >
                  {run.jobRunErrorMessage ?? ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SchedulerJobHistory
