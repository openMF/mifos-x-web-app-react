/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import ClientTrendsBar from './client-trends-bar/ClientTrendsBar'
import AmountDisbursedPie from './amount-disbursed-pie/AmountDisbursedPie'
import AmountCollectedPie from './amount-collected-pie/AmountCollectedPie'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('nav.home'), href: '/home' },
          { label: t('nav.dashboard'), current: true },
        ]}
      />

      <Card className="p-6 space-y-8">
        {/* Search Activity */}
        <CardContent className="p-0">
          <div className="w-full max-w-md flex flex-col gap-1 flex-1">
            <Label htmlFor="search">{t('ui.searchActivity')}</Label>
            <Input id="search" placeholder={t('ui.searchActivity')} />
            {/* Optionally add autocomplete logic here */}
          </div>
        </CardContent>

        {/* Client Trends */}
        <div className="w-full">
          <ClientTrendsBar />
        </div>

        {/* Disbursed & Collected Pie Charts */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <AmountDisbursedPie />
          </div>
          <div className="flex-1">
            <AmountCollectedPie />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
