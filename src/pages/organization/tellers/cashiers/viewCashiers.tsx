/**
 * Copyright since 2025 Mifos Initiative.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 **/

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { TellerCashManagementApi, type CashierData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { Plus } from 'lucide-react'

const tellersApi = new TellerCashManagementApi(getConfiguration())

const ViewCashiers = () => {
  const { id } = useParams<{ id: string }>()

  const [cashiers, setCashiers] = useState<CashierData[]>([])
  const [tellerName, setTellerName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchCashiers = async () => {
      const tellerId = Number(id)

      if (!id || !Number.isInteger(tellerId) || tellerId <= 0) {
        setError('Invalid teller ID.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await tellersApi.getCashierData1(tellerId)
        const response: unknown = res.data

        if (cancelled) return

        // Support either a direct array or an object containing cashiers.
        if (Array.isArray(response)) {
          setCashiers(response as CashierData[])
          setTellerName('')
        } else if (
          typeof response === 'object' &&
          response !== null &&
          'cashiers' in response &&
          Array.isArray(response.cashiers)
        ) {
          setCashiers(response.cashiers as CashierData[])

          setTellerName(
            'tellerName' in response && typeof response.tellerName === 'string'
              ? response.tellerName
              : ''
          )
        } else {
          setCashiers([])
          setError('Unexpected response received while fetching cashiers.')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch cashiers', err)
          setError('Failed to load cashiers. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchCashiers()

    return () => {
      cancelled = true
    }
  }, [id])

  const filtered = cashiers.filter(cashier =>
    cashier.staffName?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Tellers', href: '/organization/tellers' },
          {
            label: tellerName || `Teller ${id ?? ''}`,
            href: `/organization/tellers/${id}`,
          },
          { label: 'Cashiers', current: true },
        ]}
      />

      <div className="flex justify-end mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          disabled={loading || Boolean(error)}
        >
          <Plus className="mr-2" />
          New Cashier
        </Button>
      </div>

      <Input
        placeholder="Filter by staff name"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="max-w-sm h-11 text-base mb-6"
      />

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <Table>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4">Period</TableHead>
              <TableHead className="px-6 py-4">Cashier/Staff</TableHead>
              <TableHead className="px-6 py-4">Full Day/Time</TableHead>
              <TableHead className="px-6 py-4">Vault Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  Loading cashiers...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-red-600"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  {searchTerm
                    ? 'No cashiers match your search.'
                    : 'No cashiers found for this teller.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(cashier => (
                <TableRow key={cashier.id} className="text-base">
                  <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                    {cashier.startDate || '—'} - {cashier.endDate || '—'}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                    {cashier.staffName || '—'}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                    {cashier.isFullDay
                      ? 'Full Day'
                      : `${cashier.startTime || '—'} - ${cashier.endTime || '—'}`}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                    —
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ViewCashiers
