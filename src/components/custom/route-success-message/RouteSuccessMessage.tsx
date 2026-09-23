/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** Router state a page can be navigated to with, to confirm what just happened */
export type RouteSuccessState = {
  successMessage?: string
}

interface RouteSuccessMessageProps {
  className?: string
}

/**
 * Shows the message the current page was navigated to with, so an action
 * finished on another page is confirmed once the user arrives. The message is
 * dropped from history state as soon as it is read, so that reloading the page
 * or returning to it with the back button does not show it again.
 */
const RouteSuccessMessage = ({ className }: RouteSuccessMessageProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const { successMessage } = (location.state ?? {}) as RouteSuccessState
    if (!successMessage) return

    setMessage(successMessage)
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    })
  }, [location, navigate])

  if (!message) return null

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700',
        'dark:border-green-900 dark:bg-green-950 dark:text-green-300',
        className
      )}
    >
      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => setMessage(null)}
        aria-label={t('actions.close')}
        className="cursor-pointer opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default RouteSuccessMessage
