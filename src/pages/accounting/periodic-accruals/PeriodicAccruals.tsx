/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Play } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { PeriodicAccrualAccountingApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { todayInputValue } from '@/lib/date-utils'
import {
  buildPeriodicAccrualPayload,
  getPeriodicAccrualErrorMessage,
  validateAccrueTillDate,
} from './periodic-accruals.utils'

const periodicAccrualAccountingApi = new PeriodicAccrualAccountingApi(
  getConfiguration()
)

const PeriodicAccruals = () => {
  const navigate = useNavigate()
  const [tillDate, setTillDate] = useState('')
  const [maxDate, setMaxDate] = useState(todayInputValue)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh max date limit when window/tab regains focus or visibility
  useEffect(() => {
    const refreshLimit = () => setMaxDate(todayInputValue())
    window.addEventListener('focus', refreshLimit)
    document.addEventListener('visibilitychange', refreshLimit)
    return () => {
      window.removeEventListener('focus', refreshLimit)
      document.removeEventListener('visibilitychange', refreshLimit)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const currentToday = todayInputValue()
    setMaxDate(currentToday)

    const validationError = validateAccrueTillDate(tillDate, currentToday)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = buildPeriodicAccrualPayload(tillDate)
      await periodicAccrualAccountingApi.executePeriodicAccrualAccounting(
        payload
      )

      const state: RouteSuccessState = {
        successMessage: 'Periodic accrual accounting executed successfully.',
      }
      navigate('/accounting', { state })
    } catch (err) {
      setError(getPeriodicAccrualErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Execute Periodic Accrual Accounting', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold mb-6">
          Execute Periodic Accrual
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full space-y-2">
            <Label htmlFor="tillDate">Accrue Till Date*</Label>
            <Input
              id="tillDate"
              type="date"
              value={tillDate}
              max={maxDate}
              onFocus={() => setMaxDate(todayInputValue())}
              onChange={e => {
                setTillDate(e.target.value)
                if (error) setError(null)
              }}
              disabled={submitting}
              required
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Periodic Accruals
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PeriodicAccruals
