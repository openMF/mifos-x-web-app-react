/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getConfiguration } from '@/lib/fineract-openapi'
import { NotificationApi } from '@/fineract-api'

interface Notification {
  id?: number
  objectType?: string
  objectId?: number
  action?: string
  content?: string
  isRead?: boolean
  createdAt?: string | number[]
}

const NotificationTray = () => {
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  const [readNotifications, setReadNotifications] = useState<Notification[]>([])
  const [displayedReadNotifications, setDisplayedReadNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Format date from array or string
  const formatDate = (createdAt?: string | number[]): string => {
    if (!createdAt) return 'N/A'
    
    try {
      if (Array.isArray(createdAt)) {
        // Handle array format [year, month, day, hour, minute, second]
        const [year, month, day, hour, minute] = createdAt
        const date = new Date(year, month - 1, day, hour || 0, minute || 0)
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date)
      } else {
        // Handle string format
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(createdAt))
      }
    } catch {
      return 'N/A'
    }
  }

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const api = new NotificationApi(getConfiguration())
      const [unreadResponse, readResponse] = await Promise.all([
        api.getAllNotifications(undefined, 9, undefined, undefined, false),
        api.getAllNotifications(undefined, 9, undefined, undefined, true),
      ])

      const unread = unreadResponse.data.pageItems || []
      const read = readResponse.data.pageItems || []

      setUnreadNotifications(unread)
      setReadNotifications(read)

      // Display read notifications to fill up to 9 items total
      const displayCount = Math.max(0, 9 - unread.length)
      setDisplayedReadNotifications(read.slice(0, displayCount))
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark notifications as read when menu closes
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)

    if (!open && unreadNotifications.length > 0) {
      try {
        const api = new NotificationApi(getConfiguration())
        // Mark all as read on the server
        await api.update5()

        // Update local state: move unread to read
        const newlyRead = unreadNotifications
        setReadNotifications((prev) => {
          const nextRead = [...newlyRead, ...prev]
          const displayCount = 9
          // Update displayed read notifications based on the next read state
          setDisplayedReadNotifications(nextRead.slice(0, displayCount))
          return nextRead
        })
        setUnreadNotifications([])
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    }
  }

  // Navigate to notification entity
  const handleNotificationClick = (notification: Notification) => {
    // TODO: Implement navigation when modules are complete
    // For now, do nothing when notification is clicked
  }

  const allNotifications = [...unreadNotifications, ...displayedReadNotifications]

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative hover:text-gray-200 transition-colors hover:bg-transparent dark:hover:bg-transparent cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {unreadNotifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[500px] overflow-y-auto"
        sideOffset={8}
      >
        {allNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              No notifications
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
            </div>

            {allNotifications.map((notification, index) => {
              const isUnread = index < unreadNotifications.length

              return (
                <DropdownMenuItem
                  key={notification.id || index}
                  className={`flex flex-col items-start px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
                    isUnread
                      ? 'bg-blue-50 dark:bg-blue-950/20'
                      : 'bg-white dark:bg-transparent'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full gap-2 mb-1">
                    <span
                      className={`text-sm flex-1 ${
                        isUnread
                          ? 'font-medium text-gray-900 dark:text-gray-100'
                          : 'font-normal text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {notification.content || 'No content'}
                    </span>
                    {isUnread && (
                      <span className="text-blue-500 text-lg leading-none mt-1">•</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(notification.createdAt)}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationTray
