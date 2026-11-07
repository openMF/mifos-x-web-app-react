/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import AppSelect from '@/components/custom/select/AppSelect'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { OfficesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'
import ClientTrendsBar from './client-trends-bar/ClientTrendsBar'
import AmountDisbursedPie from './amount-disbursed-pie/AmountDisbursedPie'
import AmountCollectedPie from './amount-collected-pie/AmountCollectedPie'

const officeApi = new OfficesApi(getConfiguration())

const Dashboard = () => {
  const { t } = useTranslation('common')
  const [officeId, setOfficeId] = useState(1)
  const [officeData, setOfficeData] = useState<{ id: number; name: string }[]>(
    []
  )

  useEffect(() => {
    ;(async () => {
      try {
        const res = await officeApi.retrieveOffices()
        setOfficeData(
          (res.data ?? []).map(office => ({
            id: office.id!,
            name: office.name!,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch office data', error)
      }
    })()
  }, [])

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <AppBreadCrumbs
          items={[
            { label: t('nav.home'), href: '/home' },
            { label: t('nav.dashboard'), current: true },
          ]}
        />

        <section className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t('nav.dashboard')}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t('dashboard.overviewDescription')}
            </p>
          </div>

          <div className="w-full sm:w-64">
            <AppSelect
              selectLabel={t('fields.office')}
              selectValue={officeId.toString()}
              selectOnChange={value => setOfficeId(Number(value))}
              selectPlaceholder={t('ui.selectOffice')}
              selectClassname="w-full space-y-2"
              selectOptions={officeData}
            />
          </div>
        </section>

        <section aria-label={t('dashboard.charts')} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AmountDisbursedPie officeId={officeId} />
            <AmountCollectedPie officeId={officeId} />
          </div>
          <ClientTrendsBar officeId={officeId} />
        </section>
      </div>
    </main>
  )
}

export default Dashboard
