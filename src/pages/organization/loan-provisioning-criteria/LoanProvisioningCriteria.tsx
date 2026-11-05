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

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { getConfiguration } from '@/lib/fineract-openapi'
import { ProvisioningCriteriaApi } from '@/fineract-api'

import { apiErrorMessage, type ProvisioningCriteria } from './types'

const provisioningCriteriaApi = new ProvisioningCriteriaApi(getConfiguration())

/** Organization > Loan Provisioning Criteria, as in the Angular web app */
const LoanProvisioningCriteria = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  const [criteria, setCriteria] = useState<ProvisioningCriteria[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    ;(async () => {
      try {
        const res =
          await provisioningCriteriaApi.retrieveAllProvisioningCriterias()
        setCriteria((res.data ?? []) as ProvisioningCriteria[])
      } catch (err) {
        setLoadError(
          apiErrorMessage(err, t('provisioningCriteria.messages.loadListError'))
        )
      }
    })()
  }, [t])

  // Filter + pagination
  const term = searchTerm.toLowerCase()
  const filtered = criteria.filter(c =>
    [c.criteriaName, c.createdBy].some(v =>
      String(v ?? '')
        .toLowerCase()
        .includes(term)
    )
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          { label: t('provisioningCriteria.title'), current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/loan-provisioning/create')}
        >
          <Plus className="mr-2" /> {t('provisioningCriteria.createButton')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder={t('common:actions.filter')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder={t('common:pagination.itemsPerPage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t('common:actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('common:pagination.showing', {
              current: paginated.length,
              total: filtered.length,
              page,
              pages: totalPages,
            })}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">
                {t('provisioningCriteria.fields.criteriaName')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('provisioningCriteria.fields.createdBy')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(c => (
              <TableRow
                key={c.criteriaId}
                className="text-base hover:bg-muted cursor-pointer"
                onClick={() =>
                  navigate(`/organization/loan-provisioning/${c.criteriaId}`)
                }
              >
                <TableCell className="px-6 py-4">
                  {/* A link too, so the criterion opens from the keyboard */}
                  <Link
                    to={`/organization/loan-provisioning/${c.criteriaId}`}
                    className="hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {c.criteriaName}
                  </Link>
                </TableCell>
                <TableCell className="px-6 py-4">{c.createdBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LoanProvisioningCriteria
