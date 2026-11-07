/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSearch from '@/components/custom/search/AppSearch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getPluginErrorMessage,
  listUsers,
  type ZitadelUser,
} from '@/lib/oidc-users-api'
import { UserStateLabel } from '@/pages/users/oidc/UserStateLabel'

/** Users managed through the identity provider, shown when OIDC is enabled. */
const OidcUsers = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  const [users, setUsers] = useState<ZitadelUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then(result => {
        if (!cancelled) setUsers(result)
      })
      .catch(err => {
        console.error('Failed to fetch users from the identity provider', err)
        if (!cancelled) {
          setError(getPluginErrorMessage(err, t('oidcUsers.loadFailed')))
        }
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const term = searchTerm.trim().toLowerCase()
  const filtered = (users ?? []).filter(user => {
    const profile = user.human?.profile
    return [
      user.userName,
      profile?.firstName,
      profile?.lastName,
      user.human?.email?.email,
    ].some(value => (value ?? '').toLowerCase().includes(term))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('oidcUsers.home'), href: '/home' },
          { label: t('oidcUsers.users'), current: true },
        ]}
      />

      <div className="mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/appusers/create')}
        >
          <Plus className="mr-2" /> {t('oidcUsers.createUser')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <AppSearch
          placeholder={t('oidcUsers.searchUsers')}
          searchItem={searchTerm}
          setsearchItem={value => {
            setSearchTerm(value)
            setPage(1)
          }}
        />

        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={value => {
              setItemsPerPage(parseInt(value, 10))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['5', '10', '25', '50'].map(size => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t('oidcUsers.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('oidcUsers.next')}
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="text-base">
              {[
                t('oidcUsers.loginName'),
                t('oidcUsers.firstName'),
                t('oidcUsers.lastName'),
                t('oidcUsers.email'),
                t('oidcUsers.status'),
              ].map(heading => (
                <TableHead
                  key={heading}
                  className="px-6 py-4 text-gray-600 dark:text-gray-200"
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users === null && !error && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-6 text-center">
                  {t('oidcUsers.loading')}
                </TableCell>
              </TableRow>
            )}
            {users !== null && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-6 text-center">
                  {t('oidcUsers.noUsers')}
                </TableCell>
              </TableRow>
            )}
            {paginated.map(user => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                onClick={() =>
                  navigate(`/appusers/${encodeURIComponent(user.id)}`)
                }
              >
                <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                  {user.userName}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {user.human?.profile?.firstName}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {user.human?.profile?.lastName}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  {user.human?.email?.email}
                </TableCell>
                <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                  <UserStateLabel state={user.state} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default OidcUsers
