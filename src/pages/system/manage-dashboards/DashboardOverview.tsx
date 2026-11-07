/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { AccountMix, CurrencyTotals, DashboardData } from './data'
import { WIDGETS, type WidgetId } from './widgets'

const SERIES_COLORS = ['#3674b0', '#94a3b8', '#0f9d58', '#f4b400', '#a142f4']

/** A labelled figure inside a KPI card */
const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium tabular-nums">{value}</span>
  </div>
)

const KpiCard = ({
  title,
  value,
  allOffices,
  children,
}: {
  title: string
  value: ReactNode
  allOffices?: boolean
  children: ReactNode
}) => {
  const { t } = useTranslation('organization')
  return (
    <Card className="gap-3 rounded-xl py-5 shadow-none">
      <CardHeader className="px-5">
        <CardDescription className="flex items-center justify-between gap-2">
          {title}
          {allOffices && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              {t('manageDashboards.allOffices')}
            </span>
          )}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-5">{children}</CardContent>
    </Card>
  )
}

const ChartToggle = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => (
  <ToggleGroup
    type="single"
    aria-label={label}
    value={value}
    onValueChange={v => v && onChange(v as T)}
    className="w-fit rounded-lg border bg-muted/40 p-1"
  >
    {options.map(option => (
      <ToggleGroupItem
        key={option.value}
        value={option.value}
        className="h-8 rounded-md px-4 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
)

const TrendChart = ({ data }: { data: DashboardData['trend'] }) => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const [type, setType] = useState<'bar' | 'line'>('bar')
  const config: ChartConfig = {
    newClients: {
      label: t('common:dashboard.newClients'),
      color: SERIES_COLORS[0],
    },
    loans: {
      label: t('common:dashboard.loansDisbursed'),
      color: SERIES_COLORS[1],
    },
  }
  const monthName = (period: string, month: 'short' | 'long') =>
    new Date(`${period}-01T00:00:00`).toLocaleDateString(i18n.language, {
      month,
      year: month === 'long' ? 'numeric' : undefined,
    })
  // An array rather than a fragment: recharts does not look inside fragments
  const axes = [
    <CartesianGrid key="grid" vertical={false} strokeDasharray="3 3" />,
    <XAxis
      key="x"
      dataKey="period"
      tickLine={false}
      axisLine={false}
      tickMargin={12}
      tickFormatter={value => monthName(String(value), 'short')}
    />,
    <YAxis
      key="y"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      allowDecimals={false}
    />,
    <ChartTooltip
      key="tooltip"
      content={
        <ChartTooltipContent
          labelFormatter={value => monthName(String(value), 'long')}
        />
      }
    />,
  ]

  return (
    <Card className="min-w-0 gap-0 rounded-xl py-0 shadow-none lg:col-span-2">
      <CardHeader className="flex flex-col gap-4 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-base">
            {t('manageDashboards.trend.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('manageDashboards.trend.description')}
          </CardDescription>
        </div>
        <ChartToggle
          label={t('manageDashboards.chartType')}
          value={type}
          onChange={setType}
          options={[
            { value: 'bar', label: t('manageDashboards.trend.bar') },
            { value: 'line', label: t('manageDashboards.trend.line') },
          ]}
        />
      </CardHeader>
      <CardContent className="py-6">
        <ChartContainer config={config} className="h-[240px] w-full">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ left: -24, right: 0, top: 8 }}>
              {axes}
              {(['newClients', 'loans'] as const).map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={SERIES_COLORS[i]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ left: -24, right: 8, top: 8 }}>
              {axes}
              {(['newClients', 'loans'] as const).map((key, i) => (
                <Line
                  key={key}
                  dataKey={key}
                  stroke={SERIES_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const AccountMixChart = ({ mix }: { mix: AccountMix }) => {
  const { t } = useTranslation('organization')
  const [type, setType] = useState<'ring' | 'pie'>('ring')
  const keys = Object.keys(mix) as (keyof AccountMix)[]
  const config: ChartConfig = Object.fromEntries(
    keys.map((key, i) => [
      key,
      { label: t(`manageDashboards.mix.${key}`), color: SERIES_COLORS[i] },
    ])
  )
  const data = keys
    .map(key => ({ key, value: mix[key] }))
    .filter(slice => slice.value > 0)

  return (
    <Card className="min-w-0 gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">
            {t('manageDashboards.mix.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('manageDashboards.mix.description')}
          </CardDescription>
        </div>
        <ChartToggle
          label={t('manageDashboards.chartType')}
          value={type}
          onChange={setType}
          options={[
            { value: 'ring', label: t('manageDashboards.mix.ring') },
            { value: 'pie', label: t('manageDashboards.mix.pie') },
          ]}
        />
      </CardHeader>
      <CardContent className="py-6">
        {data.length === 0 ? (
          <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t('manageDashboards.mix.empty')}
          </p>
        ) : (
          <>
            <ChartContainer config={config} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="key" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={type === 'ring' ? 55 : 0}
                  outerRadius={85}
                  isAnimationActive={false}
                >
                  {data.map(slice => (
                    <Cell
                      key={slice.key}
                      fill={SERIES_COLORS[keys.indexOf(slice.key)]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="mt-4 space-y-1 text-sm">
              {keys.map((key, i) => (
                <li key={key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: SERIES_COLORS[i] }}
                  />
                  <span className="text-muted-foreground">
                    {t(`manageDashboards.mix.${key}`)}
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {mix[key]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The Institutional Operations Overview tab. Every figure comes from Fineract;
 * nothing is estimated or filled in when the data is empty.
 */
const DashboardOverview = ({
  data,
  hidden,
}: {
  data: DashboardData
  hidden: WidgetId[]
}) => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const number = new Intl.NumberFormat(i18n.language)
  const money = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const shown = (id: WidgetId) => !hidden.includes(id)

  const currency = (code: string, value: number) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: code,
      }).format(value)
    } catch {
      return `${code} ${money.format(value)}`
    }
  }

  const depositBalances: CurrencyTotals = {}
  for (const kind of ['savings', 'fixed', 'recurring'] as const)
    for (const [code, value] of Object.entries(data.deposits[kind].balances))
      depositBalances[code] = (depositBalances[code] ?? 0) + value
  const balanceLines = Object.entries(depositBalances)

  const { amountCollected, amountDue } = data.loans
  const demand = amountCollected + amountDue

  const kpis = [
    shown('clients') && (
      <KpiCard
        key="clients"
        title={t('manageDashboards.clients.title')}
        value={number.format(data.clients.total)}
      >
        <Row
          label={t('manageDashboards.clients.active')}
          value={number.format(data.clients.active)}
        />
        <Row
          label={t('manageDashboards.clients.pending')}
          value={number.format(data.clients.pending)}
        />
        <Row
          label={t('manageDashboards.clients.newThisMonth')}
          value={number.format(data.clients.newThisMonth)}
        />
      </KpiCard>
    ),
    shown('loans') && (
      <KpiCard
        key="loans"
        title={t('manageDashboards.loans.title')}
        value={money.format(data.loans.disbursed)}
      >
        <Row
          label={t('common:dashboard.awaitingDisbursement')}
          value={money.format(data.loans.awaitingDisbursement)}
        />
        <Row
          label={t('common:dashboard.amountPaid')}
          value={money.format(amountCollected)}
        />
        <Row
          label={t('common:dashboard.amountDue')}
          value={money.format(amountDue)}
        />
        <Row
          label={t('manageDashboards.loans.collectionRate')}
          value={
            demand > 0
              ? `${Math.round((amountCollected / demand) * 100)}%`
              : '—'
          }
        />
      </KpiCard>
    ),
    shown('deposits') && (
      <KpiCard
        key="deposits"
        allOffices
        title={t('manageDashboards.deposits.title')}
        value={
          balanceLines.length === 0
            ? money.format(0)
            : balanceLines.map(([code, value]) => (
                <div key={code}>{currency(code, value)}</div>
              ))
        }
      >
        {(['savings', 'fixed', 'recurring'] as const).map(kind => (
          <Row
            key={kind}
            label={t(`manageDashboards.deposits.${kind}`)}
            value={t('manageDashboards.activeOfTotal', {
              active: number.format(data.deposits[kind].active),
              total: number.format(data.deposits[kind].total),
            })}
          />
        ))}
      </KpiCard>
    ),
    shown('shares') && (
      <KpiCard
        key="shares"
        allOffices
        title={t('manageDashboards.shares.title')}
        value={number.format(data.shares.active)}
      >
        <Row
          label={t('manageDashboards.shares.total')}
          value={number.format(data.shares.total)}
        />
      </KpiCard>
    ),
  ].filter(Boolean)

  if (hidden.length === WIDGETS.length)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('manageDashboards.allHidden')}
      </p>
    )

  return (
    <div className="space-y-6">
      {kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis}</div>
      )}
      {(shown('trend') || shown('accountMix')) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {shown('trend') && <TrendChart data={data.trend} />}
          {shown('accountMix') && <AccountMixChart mix={data.accountMix} />}
        </div>
      )}
    </div>
  )
}

export default DashboardOverview
