/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { RunReportsApi, CentersApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const runReportApi = new RunReportsApi(getConfiguration())
const centersApi = new CentersApi(getConfiguration())

const CentersGeneralTab = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  // State for group summary counts, groups list, and loading flag
  const [summary, setSummary] = useState<any>({})
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        // Fetch summary counts for this center
        const sumRes = await runReportApi.runReport(
          'GroupSummaryCounts',
          false,
          {
            params: {
              R_groupId: Number(id),
              genericResultSet: false,
            },
          }
        )
        setSummary(sumRes.data?.data?.[0] ?? {})

        // Fetch groups associated with this center
        const centerRes = await (centersApi as any).retrieveOne14(Number(id), {
          params: { associations: 'groupMembers' },
        })
        setGroups(centerRes?.data?.groupMembers ?? [])
      } catch (e) {
        console.error('Error fetching general tab data', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // Helper to format dates
  const fmtDate = (arr: any) => formatDate(arr)

  if (loading) return <div>{tc('actions.loading')}</div>

  return (
    <div className="space-y-4 text-black dark:text-white">
      {/*Summary Section*/}
      <div>
        <h2 className="text-lg font-semibold">{t('general.summaryDetails')}</h2>
        <div>{t('general.activeClients')} {summary['Active Clients'] ?? 0}</div>
        <div>
          {t('general.activeGroupBorrowers')} {summary['Active Group Borrowers'] ?? 0}
        </div>
        <div>{t('general.activeGroupLoans')} {summary['Active Group Loans'] ?? 0}</div>
        <div>
          {t('general.activeClientBorrowers')} {summary['Active Client Borrowers'] ?? 0}
        </div>
        <div>{t('general.activeClientLoans')} {summary['Active Client Loans'] ?? 0}</div>
        <div>
          {t('general.activeOverdueClientLoans')}{' '}
          {summary['Active Overdue Client Loans'] ?? 0}
        </div>
        <div>
          {t('general.activeOverdueGroupLoans')}{' '}
          {summary['Active Overdue Group Loans'] ?? 0}
        </div>
      </div>

      {/*Groups Table*/}
      <h2 className="text-lg font-semibold">{t('general.groups')}</h2>
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">{t('general.tableAccountNo')}</TableHead>
              <TableHead className="px-6 py-4">{t('general.tableGroupName')}</TableHead>
              <TableHead className="px-6 py-4">{t('general.tableOfficeName')}</TableHead>
              <TableHead className="px-6 py-4 text-right">
                {t('general.tableSubmittedOn')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g: any) => (
              <TableRow
                key={g.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => navigate(`/groups/${g.id}/general`)}
              >
                <TableCell className="px-6 py-4">
                  <span className="inline-block w-3 h-3 bg-yellow-500 rounded-sm mr-2 align-middle" />
                  <span className="align-middle">{g.accountNo ?? '-'}</span>
                </TableCell>
                <TableCell className="px-6 py-4">{g.name ?? '-'}</TableCell>
                <TableCell className="px-6 py-4">
                  {g.officeName ?? '-'}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  {fmtDate(g?.timeline?.submittedOnDate)}
                </TableCell>
              </TableRow>
            ))}

              {groups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-6 py-6 text-center text-zinc-500"
                >
                  {t('general.noGroups')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default CentersGeneralTab
