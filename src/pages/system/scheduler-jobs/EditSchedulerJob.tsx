/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import fineract from '@/lib/axios'

import { apiErrorDetail, type JobsError, type SchedulerJob } from './types'

/**
 * Edits a scheduler job (PUT /jobs/{id}): its name, its Quartz cron
 * expression and whether it is active. Fineract validates the expression.
 */
const EditSchedulerJob = () => {
  const { t } = useTranslation(['organization', 'common'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<SchedulerJob | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [cronExpression, setCronExpression] = useState('')
  const [active, setActive] = useState(false)
  const [error, setError] = useState<JobsError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fineract.get<SchedulerJob>(`v1/jobs/${id}`)
        const data = res.data ?? {}
        setJob(data)
        setDisplayName(data.displayName ?? '')
        setCronExpression(data.cronExpression ?? '')
        setActive(Boolean(data.active))
      } catch (err) {
        setError({ key: 'loadJob', detail: apiErrorDetail(err) })
      }
    })()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!displayName.trim()) return setError({ key: 'nameRequired' })
    if (!cronExpression.trim()) return setError({ key: 'cronRequired' })
    setSubmitting(true)
    setError(null)
    try {
      await fineract.put(`v1/jobs/${id}`, {
        displayName: displayName.trim(),
        cronExpression: cronExpression.trim(),
        active,
      })
      navigate('/system/jobs')
    } catch (err) {
      setError({ key: 'updateJob', detail: apiErrorDetail(err) })
      setSubmitting(false)
    }
  }

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

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('jobs.edit.title')}</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="w-full space-y-2">
            <Label htmlFor="jobName">{t('jobs.edit.jobName')}</Label>
            <Input
              id="jobName"
              value={displayName}
              onChange={e => {
                setDisplayName(e.target.value)
                setError(null)
              }}
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="cronExpression">
              {t('jobs.edit.cronExpression')}
            </Label>
            <Input
              id="cronExpression"
              className="font-mono"
              value={cronExpression}
              onChange={e => {
                setCronExpression(e.target.value)
                setError(null)
              }}
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              <Trans
                t={t}
                i18nKey="jobs.edit.cronHelp"
                components={{ code: <code /> }}
              />
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="jobActive"
              checked={active}
              onCheckedChange={v => setActive(v === true)}
            />
            <Label htmlFor="jobActive">{t('common:status.active')}</Label>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {errorText(error)}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/system/jobs')}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={submitting || !job}
            >
              {t('common:actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditSchedulerJob
