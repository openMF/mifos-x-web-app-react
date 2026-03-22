/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Pie, PieChart, Cell, Legend } from 'recharts'

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
import { RunReportsApi, OfficesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'

const runreportApi = new RunReportsApi(getConfiguration())
const officeApi = new OfficesApi(getConfiguration())

// Glowing vibrant red, blue, and accent tones
const customColors = [
  '#ff4d4f', // neon red
  '#1e90ff', // dodger blue
  '#00cfff', // bright cyan
  '#ff6ec7', // neon pink
  '#00ffcc', // neon mint
  '#ffcc00', // bright yellow
  '#ff1493', // deep pink
  '#00bfff', // deep sky blue
]

const AmountDisbursedPie = () => {
  //state to store the data
  const [officeId, setOfficeId] = useState<number>(1)
  const [officeData, setOfficeData] = useState<{ id: number; name: string }[]>(
    []
  )
  const [chartData, setChartData] = useState<
    { name: string; visitors: number; fill: string }[]
  >([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  const { t } = useTranslation('common')

  //api call to fetch the data for the different offices
  useEffect(() => {
    ;(async () => {
      const res = await officeApi.retrieveOffices()
      const data = res.data ?? []
      setOfficeData(data.map(o => ({ id: o.id!, name: o.name! })))
    })()
  }, [])

  //api to fetch actual chart data
  useEffect(() => {
    ;(async () => {
      try {
        const res = await runreportApi.runReport(
          'Demand Vs Collection',
          false,
          {
            params: { R_officeId: officeId, genericResultSet: false },
          }
        )

        const rows: Record<string, unknown>[] = Array.isArray(res.data)
          ? (res.data as Record<string, unknown>[])
          : []
        const raw = rows[0]
        if (!raw) {
          setChartData([])
          setChartConfig({})
          return
        }

        const dynamicData = Object.entries(raw).map(([key, val], idx) => ({
          name: key,
          visitors: Number(val),
          fill: customColors[idx % customColors.length],
        }))

        const config: ChartConfig = {
          visitors: { label: 'Value' },
          ...Object.fromEntries(
            dynamicData.map(d => [d.name, { label: d.name, color: d.fill }])
          ),
        }

        setChartData(dynamicData)
        setChartConfig(config)
      } catch (error) {
        console.error('Failed to fetch report data', error)
        setChartData([])
        setChartConfig({})
      }
    })()
  }, [officeId])

  const hasNonZero = chartData.some(d => d.visitors > 0)

  return (
    //main chart card
    <Card className="flex flex-col h-full">
      <CardHeader className="gap-4">
        <div>
          <CardTitle className="text-xl">
            {t('dashboard.amountCollected')}
          </CardTitle>
          <CardDescription>{t('dashboard.selectOfficeToView')}</CardDescription>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-2">
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
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {chartData.length > 0 && hasNonZero ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="visitors"
                nameKey="name"
                outerRadius={100}
                stroke="none"
                label={({ value }) => (value === 0 ? '0' : undefined)}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ChartContainer>
        ) : (
          <p className="text-center text-muted-foreground text-sm mt-4">
            {t('dashboard.noCollectedAmounts')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default AmountDisbursedPie
