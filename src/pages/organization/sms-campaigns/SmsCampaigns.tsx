/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
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
import fineract from '@/lib/axios'

import { apiErrorMessage, type SmsCampaign } from './types'
import { CampaignStatus } from './CampaignStatus'

const PAGE_SIZE = 10

/** Organization > SMS Campaigns, as in the Angular web app */
const SmsCampaigns = () => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fineract.get<{ pageItems?: SmsCampaign[] }>(
          'v1/smscampaigns'
        )
        setCampaigns(res.data?.pageItems ?? [])
      } catch (err) {
        setError(apiErrorMessage(err, t('smsCampaign.errors.loadList')))
      } finally {
        setLoaded(true)
      }
    })()
  }, [t])

  const term = searchTerm.trim().toLowerCase()
  const filtered = campaigns.filter(c =>
    [
      c.campaignName,
      c.campaignMessage,
      c.campaignType?.value,
      c.triggerType?.value,
      c.campaignStatus?.value,
      c.smsCampaignTimeLine?.submittedByUsername,
    ].some(v =>
      String(v ?? '')
        .toLowerCase()
        .includes(term)
    )
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          { label: t('smsCampaign.title'), current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/sms-campaigns/create')}
        >
          <Plus className="mr-2" /> {t('smsCampaign.create')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder={t('common:actions.filter')}
          aria-label={t('common:actions.filter')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            {t('common:actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {loaded && !campaigns.length
              ? t('smsCampaign.empty')
              : t('common:pagination.showing', {
                  current: paginated.length,
                  total: filtered.length,
                  page: currentPage,
                  pages: totalPages,
                })}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.name')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.templateMessage')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.campaignType')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.triggerType')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.status')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('smsCampaign.fields.submittedBy')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(c => (
              <TableRow
                key={c.id}
                className="text-base hover:bg-muted cursor-pointer"
                onClick={() => navigate(`/organization/sms-campaigns/${c.id}`)}
              >
                <TableCell className="px-6 py-4">
                  {/* A link too, so the campaign opens from the keyboard */}
                  <Link
                    to={`/organization/sms-campaigns/${c.id}`}
                    className="hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {c.campaignName}
                  </Link>
                </TableCell>
                <TableCell className="px-6 py-4 max-w-md truncate">
                  {c.campaignMessage || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.campaignType?.value ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.triggerType?.value ?? '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <CampaignStatus status={c.campaignStatus} />
                </TableCell>
                <TableCell className="px-6 py-4">
                  {c.smsCampaignTimeLine?.submittedByUsername ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SmsCampaigns
