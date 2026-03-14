/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useEffect, useState } from 'react'
import { getConfiguration } from '@/lib/fineract-openapi'
import { type GetNotificationsResponse, NotificationApi } from '@/fineract-api'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'

const notiApi = new NotificationApi(getConfiguration())

const Notifications = () => {
  const { t, i18n } = useTranslation('common')
  const [notificationData, setNotificationData] =
    useState<GetNotificationsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    const fetchNotificationDetails = async () => {
      try {
        const response = await notiApi.getAllNotifications()
        setNotificationData(response.data)
      } catch (err) {
        console.log('Failed to fetch Notification Data', err)
      }
    }
    fetchNotificationDetails()
  }, [])

  const totalItems = notificationData?.pageItems?.length ?? 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginated =
    notificationData?.pageItems?.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    ) ?? []

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('nav.home'), href: '/home' },
          { label: t('nav.notifications'), current: true },
        ]}
      />

      <div className="flex flex-wrap justify-end items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[140px] h-11 text-base">
              <SelectValue placeholder={t('pagination.itemsPerPage')} />
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
            {t('actions.prev')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('actions.next')}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            {t('pagination.showing', {
              current: paginated.length,
              total: totalItems,
              page,
              pages: totalPages,
            })}
          </TableCaption>
          <TableHeader>
            <TableRow className="text-base">
              <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                {t('nav.notification')}
              </TableHead>
              <TableHead className="px-6 py-4 text-gray-600 dark:text-gray-200">
                {t('fields.createdAt')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  {t('status.noNotifications')}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((notification, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                >
                  <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                    {notification.content || t('status.noContent')}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                    {notification.createdAt
                      ? new Intl.DateTimeFormat(i18n.language, {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(notification.createdAt))
                      : t('actions.na')}
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

export default Notifications
