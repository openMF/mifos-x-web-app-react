/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
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
import { SpmSurveysApi } from '@/fineract-api'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'

import { apiErrorMessage, isSurveyActive, type Survey } from './types'

const surveysApi = new SpmSurveysApi(getConfiguration())

/** System > Manage Surveys, as in the Angular web app */
const ManageSurveys = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const loadSurveys = useCallback(async () => {
    try {
      const res = await surveysApi.fetchAllSurveys1()
      setSurveys((res.data ?? []) as Survey[])
    } catch (err) {
      setError(apiErrorMessage(err, t('surveys.messages.loadListError')))
    }
  }, [t])

  useEffect(() => {
    loadSurveys()
  }, [loadSurveys])

  const toggleStatus = async (survey: Survey) => {
    if (!survey.id || togglingId) return
    setTogglingId(survey.id)
    setError(null)
    try {
      await surveysApi.activateOrDeactivateSurvey(
        survey.id,
        isSurveyActive(survey) ? 'deactivate' : 'activate'
      )
      // Fineract moves validFrom/validTo, so reload rather than guess them
      await loadSurveys()
    } catch (err) {
      setError(apiErrorMessage(err, t('surveys.messages.statusError')))
    } finally {
      setTogglingId(null)
    }
  }

  // Filter + pagination
  const term = searchTerm.toLowerCase()
  const filtered = surveys.filter(s =>
    [s.key, s.name, s.description, s.countryCode].some(v =>
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
          { label: t('common:nav.system'), href: '/system' },
          { label: t('surveys.title'), current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/system/surveys/create')}
        >
          <Plus className="mr-2" /> {t('surveys.createButton')}
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

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
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
                {t('surveys.fields.key')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('surveys.fields.name')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('surveys.fields.description')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('surveys.fields.countryCode')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('surveys.fields.status')}
              </TableHead>
              <TableHead className="px-6 py-4">
                {t('surveys.fields.action')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(s => {
              const active = isSurveyActive(s)
              return (
                <TableRow
                  key={s.id}
                  className="text-base hover:bg-muted cursor-pointer"
                  onClick={() => navigate(`/system/surveys/${s.id}`)}
                >
                  <TableCell className="px-6 py-4">
                    {/* A link too, so the survey opens from the keyboard */}
                    <Link
                      to={`/system/surveys/${s.id}`}
                      className="hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {s.key}
                    </Link>
                  </TableCell>
                  <TableCell className="px-6 py-4">{s.name}</TableCell>
                  <TableCell className="px-6 py-4">{s.description}</TableCell>
                  <TableCell className="px-6 py-4">{s.countryCode}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={
                        active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {active
                        ? t('surveys.status.active')
                        : t('surveys.status.inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={togglingId !== null}
                      onClick={e => {
                        e.stopPropagation()
                        toggleStatus(s)
                      }}
                    >
                      <FontAwesomeIcon
                        icon={active ? faLock : faLockOpen}
                        className="mr-2"
                      />
                      {active
                        ? t('surveys.deactivate')
                        : t('common:actions.activate')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ManageSurveys
