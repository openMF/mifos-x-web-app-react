/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RunReportsApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const reports = new RunReportsApi(getConfiguration())
const reportNames = {
  disbursements: 'Disbursal Vs Awaitingdisbursal',
  collections: 'Demand Vs Collection',
}
const labels: Record<
  string,
  'awaitingDisbursement' | 'disbursed' | 'amountDue' | 'amountPaid'
> = {
  amountToBeDisburse: 'awaitingDisbursement',
  disbursedAmount: 'disbursed',
  AmountDue: 'amountDue',
  AmountPaid: 'amountPaid',
}

type Props = { officeId: number; kind: keyof typeof reportNames }

export default function ReportSummary({ officeId, kind }: Props) {
  const { t, i18n } = useTranslation('common')
  const [rows, setRows] = useState<[string, number][]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    reports
      .runReport(reportNames[kind], false, {
        params: { R_officeId: officeId, genericResultSet: false },
      })
      .then(response => {
        if (!active) return
        const raw = Array.isArray(response.data) ? response.data[0] : undefined
        setRows(
          raw
            ? Object.entries(raw).flatMap(([key, value]) => {
                const amount = Number(value)
                return value !== null && Number.isFinite(amount)
                  ? [[key, amount] as [string, number]]
                  : []
              })
            : []
        )
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [officeId, kind, attempt])

  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 2,
  })
  const max = Math.max(0, ...rows.map(([, value]) => value))

  return (
    <Card
      className="gap-0 overflow-hidden rounded-xl border-border/70 py-0 shadow-none"
      aria-busy={status === 'loading'}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <h2 className="text-base font-semibold">{t(`dashboard.${kind}`)}</h2>
        <span className="text-xs text-muted-foreground">
          {t('dashboard.reportAmounts')}
        </span>
      </div>
      <div className="p-6">
        {status === 'loading' ? (
          <div
            className="grid min-h-24 grid-cols-2 gap-6"
            role="status"
            aria-label={t('dashboard.loading')}
          >
            {[0, 1].map(key => (
              <div key={key} className="space-y-4">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-8 w-32 rounded bg-muted" />
                <div className="h-1 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : status === 'error' ? (
          <div
            role="alert"
            className="flex min-h-24 items-center justify-between gap-4 text-sm text-muted-foreground"
          >
            <p>{t('dashboard.loadError')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttempt(value => value + 1)}
            >
              {t('dashboard.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="flex min-h-24 items-center text-sm text-muted-foreground">
            {t('dashboard.noReportData')}
          </p>
        ) : (
          <dl className="grid gap-6 sm:grid-cols-2">
            {rows.map(([key, value], index) => (
              <div key={key} className="min-w-0 space-y-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={
                      index === 0
                        ? 'h-2 w-2 shrink-0 rounded-full bg-slate-400'
                        : 'h-2 w-2 shrink-0 rounded-full bg-[#3674b0]'
                    }
                    aria-hidden="true"
                  />
                  {labels[key]
                    ? t(`dashboard.${labels[key]}`)
                    : key.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </dt>
                <dd className="text-xl font-semibold leading-none tracking-tight tabular-nums 2xl:text-2xl">
                  {number.format(value)}
                </dd>
                <div
                  className="h-1 overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className={
                      index === 0
                        ? 'h-full rounded-full bg-slate-400'
                        : 'h-full rounded-full bg-[#3674b0]'
                    }
                    style={{
                      width: `${max > 0 ? (Math.max(0, value) / max) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  )
}
