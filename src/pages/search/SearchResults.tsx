/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getConfiguration } from '@/lib/fineract-openapi'
import { type GetSearchResponse, SearchAPIApi } from '@/fineract-api'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'

// Built per request so the auth headers from the current session are used
const searchApi = () => new SearchAPIApi(getConfiguration())

// Same resources the Angular web app searches from its toolbar. Fineract has
// no separate centers resource; 'groups' returns centers as entityType CENTER
const SEARCH_RESOURCES = 'clients,clientIdentifiers,groups,savings,shares,loans'

// Fineract also sends parentType ('client' or 'group') for loans and
// savings, but the generated type does not declare it
type SearchResult = GetSearchResponse & { parentType?: string }

// For accounts and identifiers, parentId is the owning client or group
const getResultPath = (result: SearchResult) => {
  const { entityId, entityType, parentId, parentType } = result
  switch (entityType) {
    case 'CLIENT':
      return `/clients/${entityId}/general`
    case 'CLIENTIDENTIFIER':
      return `/clients/${parentId}/identities`
    case 'GROUP':
      return `/groups/${entityId}/general`
    case 'CENTER':
      return `/centers/${entityId}/general`
    case 'LOAN':
      // The loan account view is only routed under /groups, so a client's
      // loan opens the client page, which lists its loan accounts
      return parentType === 'group'
        ? `/groups/${parentId}/loans-accounts/${entityId}/general`
        : `/clients/${parentId}/general`
    case 'SAVING':
      return parentType === 'group'
        ? `/groups/${parentId}/savings-accounts/${entityId}/general`
        : `/clients/${parentId}/savings-accounts/${entityId}/general`
    case 'SHARE':
      return `/clients/${parentId}/shares-accounts/${entityId}/general`
    default:
      return undefined
  }
}

const SearchResults = () => {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query')?.trim() ?? ''

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const getTypeLabel = (entityType?: string) => {
    switch (entityType) {
      case 'CLIENT':
        return t('search.types.client')
      case 'CLIENTIDENTIFIER':
        return t('search.types.clientIdentifier')
      case 'GROUP':
        return t('search.types.group')
      case 'CENTER':
        return t('search.types.center')
      case 'LOAN':
        return t('search.types.loan')
      case 'SAVING':
        return t('search.types.saving')
      case 'SHARE':
        return t('search.types.share')
      default:
        return entityType
    }
  }

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    let ignore = false
    const fetchResults = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await searchApi().searchData(
          query,
          SEARCH_RESOURCES,
          false
        )
        if (!ignore) setResults(response.data)
      } catch (err) {
        console.error('Failed to fetch search results', err)
        if (!ignore) {
          setResults([])
          setError(true)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchResults()

    return () => {
      ignore = true
    }
  }, [query])

  const renderStatusRow = (message: string, hint?: string) => (
    <TableRow>
      <TableCell
        colSpan={6}
        className="px-6 py-6 text-center text-gray-500 dark:text-gray-400 whitespace-normal"
      >
        {message}
        {hint && <p className="mt-2 text-sm">{hint}</p>}
      </TableCell>
    </TableRow>
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('nav.home'), href: '/home' },
          { label: t('search.title'), current: true },
        ]}
      />

      <h1 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100 break-words">
        {query ? t('search.resultsFor', { query }) : t('search.title')}
      </h1>

      {!query ? (
        <p className="text-gray-500 dark:text-gray-400">
          {t('search.enterQuery')}
        </p>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="text-base">
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('fields.type')}
                </TableHead>
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('fields.name')}
                </TableHead>
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('fields.accountNo')}
                </TableHead>
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('fields.externalId')}
                </TableHead>
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('search.parent')}
                </TableHead>
                <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                  {t('fields.status')}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading
                ? renderStatusRow(t('status.loading'))
                : error
                  ? renderStatusRow(t('errors.generic'))
                  : results.length === 0
                    ? renderStatusRow(
                        t('status.noResults'),
                        t('search.noResultsHint')
                      )
                    : results.map(result => {
                        const path = getResultPath(result)
                        return (
                          <TableRow
                            key={`${result.entityType}-${result.entityId}`}
                            className="hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                          >
                            <TableCell className="px-6 py-4">
                              {getTypeLabel(result.entityType)}
                            </TableCell>
                            <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                              {path ? (
                                <Link
                                  to={path}
                                  className="text-[#1074b9] dark:text-sky-400 hover:underline"
                                >
                                  {result.entityName}
                                </Link>
                              ) : (
                                result.entityName
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {result.entityAccountNo}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {result.entityExternalId}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {result.parentName}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {result.entityStatus?.value}
                            </TableCell>
                          </TableRow>
                        )
                      })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default SearchResults
