/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Plus } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

import {
  ClientApi,
  ClientSearchV2Api,
  type GetClientsResponse,
  type PageClientSearchData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

const clientApi = new ClientApi(getConfiguration())
const clientSearchApi = new ClientSearchV2Api(getConfiguration())

/** Client status ids Fineract reports for the states this list distinguishes */
const STATUS_PENDING = 100
const STATUS_ACTIVE = 300

/** Row shape the table renders, normalised from either endpoint */
interface ClientRow {
  id?: number
  displayName?: string
  accountNo?: string
  externalId?: string
  officeName?: string
  status?: { id?: number; value?: string }
}

/**
 * Shape the list endpoint returns at runtime. The generated type declares
 * neither the external id nor the readable status value, so it is described
 * here rather than extended.
 */
interface ClientsListItem {
  id?: number
  displayName?: string
  accountNo?: string
  externalId?: string
  officeName?: string
  status?: { id?: number; value?: string }
}

/** Shape the text search endpoint returns at runtime */
interface ClientsSearchItem {
  id?: number
  displayName?: string
  accountNumber?: string
  externalId?: string
  officeName?: string
  status?: { id?: number; value?: string }
}

const Clients = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  // pagination + filters
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [includePending, setIncludePending] = useState(false)

  // API state
  const [rows, setRows] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fetch one page of clients whenever the query, the filter or the paging
  // changes. Both branches return the rows to render together with the count
  // those rows were drawn from, so the table and its caption always agree.
  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        let content: ClientRow[]
        let totalRecords: number

        if (searchTerm) {
          // Only the search endpoint matches a single term against the name,
          // the account number and the external id. It carries no status
          // filter, so a search deliberately spans every status.
          const res = await clientSearchApi.searchByText({
            request: { text: searchTerm },
            page: Math.max(0, page - 1),
            size: itemsPerPage,
          })

          const data: PageClientSearchData = res.data || {}
          const items = (data.content ?? []) as unknown as ClientsSearchItem[]

          content = items.map(c => ({
            id: c.id,
            displayName: c.displayName,
            accountNo: c.accountNumber,
            externalId: c.externalId,
            officeName: c.officeName,
            status: c.status,
          }))
          totalRecords = data.totalElements ?? content.length
        } else {
          // Fineract's status parameter takes a single value and rejects both
          // "all" and a list, so including pending clients means asking for
          // every status rather than for two of them.
          const res = await clientApi.retrieveAll21(
            undefined, // officeId
            undefined, // externalId
            undefined, // displayName
            undefined, // firstName
            undefined, // lastName
            includePending ? undefined : 'active',
            undefined, // underHierarchy
            (page - 1) * itemsPerPage,
            itemsPerPage
          )

          const data: GetClientsResponse = res.data || {}
          const items = (data.pageItems ?? []) as unknown as ClientsListItem[]

          content = items.map(c => ({
            id: c.id,
            displayName: c.displayName,
            accountNo: c.accountNo,
            externalId: c.externalId,
            officeName: c.officeName,
            status: c.status,
          }))
          totalRecords = data.totalFilteredRecords ?? content.length
        }

        if (!cancelled) {
          setRows(content)
          setTotal(totalRecords)
        }
      } catch (e) {
        console.error('Failed to load clients', e)
        if (!cancelled) {
          setRows([])
          setTotal(0)
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchTerm, page, itemsPerPage, includePending])

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))

  /** Green for active, amber for pending, neutral for every other state */
  const statusColour = (statusId?: number) => {
    if (statusId === STATUS_ACTIVE) return 'text-green-500'
    if (statusId === STATUS_PENDING) return 'text-yellow-500'
    return 'text-zinc-400'
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), current: true },
        ]}
      />

      {/* add client button */}
      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/clients/create')}
        >
          <Plus className="mr-2" /> {t('addClient')}
        </Button>
      </div>

      {/* search + pagination controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder={t('searchByName')}
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
            onValueChange={v => {
              setItemsPerPage(parseInt(v, 10))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder={tc('pagination.itemsPerPage')} />
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {tc('actions.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {tc('actions.next')}
          </Button>
        </div>
      </div>

      {/* show pending checkbox, which a search overrides because the search
          endpoint cannot filter by status */}
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="pending-clients"
          checked={includePending}
          disabled={!!searchTerm}
          onCheckedChange={v => {
            setIncludePending(!!v)
            setPage(1)
          }}
        />
        <label
          htmlFor="pending-clients"
          className={`text-base dark:text-white ${
            searchTerm ? 'text-zinc-400 dark:text-zinc-500' : ''
          }`}
        >
          {t('pending.showPendingClients')}
        </label>
      </div>

      {loading && (
        <p className="text-center py-8 text-zinc-500">
          {tc('actions.loading')}
        </p>
      )}

      {error && (
        <p className="text-center py-8 text-red-500">
          {t('errors.failedLoadClients')}
        </p>
      )}

      {/* results table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <Table>
            <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
              {tc('pagination.showing', {
                current: rows.length,
                total,
                page,
                pages: totalPages,
              })}
            </TableCaption>

            <TableHeader>
              <TableRow className="text-base">
                <TableHead className="px-6 py-4">{t('table.name')}</TableHead>
                <TableHead className="px-6 py-4">
                  {t('table.accountNo')}
                </TableHead>
                <TableHead className="px-6 py-4">
                  {t('table.externalId')}
                </TableHead>
                <TableHead className="px-6 py-4">{t('table.status')}</TableHead>
                <TableHead className="px-6 py-4">
                  {t('table.officeName')}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((c: ClientRow) => (
                <TableRow
                  key={c.id}
                  onClick={() => c.id && navigate(`/clients/${c.id}/general`)}
                  className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                >
                  <TableCell className="px-6 py-4 font-medium">
                    {c.displayName ?? '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {c.accountNo ?? '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {c.externalId ?? '—'}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <FontAwesomeIcon
                      icon={faCircle}
                      title={c.status?.value}
                      className={`w-4 h-4 ${statusColour(c.status?.id)}`}
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {c.officeName ?? '—'}
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-6 py-6 text-center text-zinc-500"
                  >
                    {tc('status.noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default Clients
