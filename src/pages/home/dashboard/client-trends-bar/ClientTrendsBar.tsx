/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, CartesianGrid, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RunReportsApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { format, subDays, subWeeks, subMonths } from 'date-fns'
import { useTranslation } from 'react-i18next'

const runReportApi = new RunReportsApi(getConfiguration())

//generates labels for the client trends graph
const generateLabels = (scale: string): string[] => {
  const now = new Date()
  return Array.from({ length: 12 }).map((_, i) => {
    const date =
      scale === 'Day'
        ? subDays(now, 11 - i)
        : scale === 'Week'
          ? subWeeks(now, 11 - i)
          : subMonths(now, 11 - i)

    if (scale === 'Month') return format(date, 'MMMM')
    if (scale === 'Week') return format(date, 'w')
    return format(date, 'd/M')
  })
}

const ClientTrendsLine = ({ officeId }: { officeId: number }) => {
  //state for storing the data
  const [timescale, setTimescale] = useState('Day')
  const [chartData, setChartData] = useState<
    { label: string; onboarded: number; loaned: number }[]
  >([])
  const { t, i18n } = useTranslation('common')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  const chartConfig: ChartConfig = {
    onboarded: {
      label: t('dashboard.newClients'),
      color: '#3674b0',
    },
    loaned: {
      label: t('dashboard.loansDisbursed'),
      color: '#94a3b8',
    },
  }

  //api fetch to get the chart data
  useEffect(() => {
    let active = true
    setStatus('loading')
    ;(async () => {
      try {
        const [clientRes, loanRes] = await Promise.all([
          runReportApi.runReport(`ClientTrendsBy${timescale}`, false, {
            params: { R_officeId: officeId, genericResultSet: false },
          }),
          runReportApi.runReport(`LoanTrendsBy${timescale}`, false, {
            params: { R_officeId: officeId, genericResultSet: false },
          }),
        ])

        const clientRows: Record<string, unknown>[] = Array.isArray(
          clientRes.data
        )
          ? (clientRes.data as Record<string, unknown>[])
          : []
        const loanRows: Record<string, unknown>[] = Array.isArray(loanRes.data)
          ? (loanRes.data as Record<string, unknown>[])
          : []
        const labels = generateLabels(timescale)

        const formatted = labels.map(label => {
          const matchClient = clientRows.find(r => {
            if (timescale === 'Month') {
              return r.Months === label
            } else if (timescale === 'Week') {
              return String(r.Weeks) === label
            } else {
              const entryDate = new Date(r.days as string | number)
              const formattedDate = format(
                entryDate,
                timescale === 'Month' ? 'MMMM' : 'd/M'
              )
              return formattedDate === label
            }
          })

          const matchLoan = loanRows.find(r => {
            if (timescale === 'Month') {
              return r.Months === label
            } else if (timescale === 'Week') {
              return String(r.Weeks) === label
            } else {
              const entryDate = new Date(r.days as string | number)
              const formattedDate = format(
                entryDate,
                timescale === 'Month' ? 'MMMM' : 'd/M'
              )
              return formattedDate === label
            }
          })

          return {
            label,
            onboarded: (matchClient?.count as number) ?? 0,
            loaned: (matchLoan?.lcount as number) ?? 0,
          }
        })

        if (active) {
          setChartData(formatted)
          setStatus('ready')
        }
      } catch (err) {
        console.error('Failed to fetch client trends', err)
        if (active) {
          setChartData([])
          setStatus('error')
        }
      }
    })()
    return () => {
      active = false
    }
  }, [officeId, timescale, attempt])

  const totals = chartData.reduce(
    (sum, row) => ({
      onboarded: sum.onboarded + Number(row.onboarded),
      loaned: sum.loaned + Number(row.loaned),
    }),
    { onboarded: 0, loaned: 0 }
  )
  const number = new Intl.NumberFormat(i18n.language)

  return (
    <Card
      className="gap-0 rounded-xl border-border/70 py-0 shadow-none"
      aria-busy={status === 'loading'}
    >
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-base">
            {t('dashboard.clientTrends')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('dashboard.clientTrendsDescription')}
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          aria-label={t('dashboard.timescale')}
          value={timescale}
          onValueChange={value => value && setTimescale(value)}
          className="w-fit rounded-lg border bg-muted/40 p-1"
        >
          {(['Day', 'Week', 'Month'] as const).map(value => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="h-8 rounded-md px-4 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {t(
                value === 'Day'
                  ? 'dashboard.day'
                  : value === 'Week'
                    ? 'dashboard.week'
                    : 'dashboard.month'
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="space-y-6 py-6">
        <div className="flex flex-wrap gap-8">
          {(['onboarded', 'loaned'] as const).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: chartConfig[key].color }}
                />
                {chartConfig[key].label}
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {status === 'ready' ? number.format(totals[key]) : '—'}
              </p>
            </div>
          ))}
        </div>
        {status === 'error' ? (
          <div
            role="alert"
            className="flex h-48 items-center justify-center gap-4 text-sm text-muted-foreground"
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
        ) : status === 'loading' ? (
          <div
            role="status"
            aria-label={t('dashboard.loading')}
            className="h-48 rounded-lg bg-muted/40"
          />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full sm:h-[240px]"
          >
            <BarChart
              data={chartData}
              margin={{ left: -24, right: 0, top: 8 }}
              barGap={4}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={8}
                tickFormatter={value =>
                  timescale === 'Month' ? String(value).slice(0, 3) : value
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                content={<ChartTooltipContent className="[&_.flex-1]:gap-4" />}
              />
              <Bar
                dataKey="onboarded"
                fill="#3674b0"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
              <Bar
                dataKey="loaned"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        )}
        <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {t('dashboard.periodNote')}
        </p>
      </CardContent>
    </Card>
  )
}

export default ClientTrendsLine
