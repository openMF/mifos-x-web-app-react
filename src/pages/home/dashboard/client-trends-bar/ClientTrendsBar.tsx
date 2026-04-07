/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, CartesianGrid, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  OfficesApi,
  RunReportsApi,
  type GetOfficesResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { format, subDays, subWeeks, subMonths } from 'date-fns'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'

const officeApi = new OfficesApi(getConfiguration())
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

const ClientTrendsLine = () => {
  //state for storing the data
  const [officeId, setOfficeId] = useState<number>(1)
  const [officeData, setOfficeData] = useState<GetOfficesResponse[]>()
  const [timescale, setTimescale] = useState('Day')
  const [chartData, setChartData] = useState<
    { label: string; onboarded: number; loaned: number }[]
  >([])
  const { t } = useTranslation('common')

  const chartConfig: ChartConfig = {
    onboarded: {
      label: t('dashboard.newClients'),
      color: 'var(--chart-3)',
    },
    loaned: {
      label: t('dashboard.loansDisbursed'),
      color: 'var(--chart-1)',
    },
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await officeApi.retrieveOffices()
        const data = res.data ?? []
        setOfficeData(
          data.map(option => ({ id: option.id!, name: option.name! }))
        )
      } catch (err) {
        console.error('Failed to fetch office data', err)
      }
    })()
  }, [])

  //api fetch to get the chart data
  useEffect(() => {
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

        setChartData(formatted)
      } catch (err) {
        console.error('Failed to fetch client trends', err)
        setChartData([])
      }
    })()
  }, [officeId, timescale])

  return (
    //main chart card
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{t('dashboard.clientTrends')}</CardTitle>
        <CardDescription>
          {t('dashboard.trackClientOnboarding')}
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mt-2">
          <div className="flex flex-col gap-1 flex-1">
            <AppSelect
              selectLabel={t('fields.office')}
              selectValue={officeId.toString()}
              selectOnChange={value => setOfficeId(Number(value))}
              selectPlaceholder={t('ui.selectOffice')}
              selectOptions={(officeData || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="timescale">{t('dashboard.timescale')}</Label>
            <ToggleGroup
              type="single"
              value={timescale}
              onValueChange={v => v && setTimescale(v)}
              className="mt-1"
            >
              <ToggleGroupItem value="Day">
                {t('dashboard.day')}
              </ToggleGroupItem>
              <ToggleGroupItem value="Week">
                {t('dashboard.week')}
              </ToggleGroupItem>
              <ToggleGroupItem value="Month">
                {t('dashboard.month')}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical horizontal strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="onboarded"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="loaned"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

export default ClientTrendsLine
