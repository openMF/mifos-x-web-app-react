/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import fineract from '@/lib/axios'

import {
  apiErrorMessage,
  type LoanOriginator,
} from '@/pages/organization/loan-originators/types'
import {
  attachableOriginators,
  type LoanOriginatorsResponse,
} from '../../loan-originators-tab/originators'

/** Loan account action: attach an active originator, as in the Angular web app */
const AttachLoanOriginator = () => {
  const breadcrumbs = useAccountBreadcrumbs({
    actionLabel: 'Attach Loan Originator',
  })
  const navigate = useNavigate()
  const { loanId } = useParams()

  const [options, setOptions] = useState<LoanOriginator[]>([])
  const [originatorId, setOriginatorId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loanId) return
    ;(async () => {
      try {
        const [all, attached] = await Promise.all([
          fineract.get<LoanOriginator[]>('v1/loan-originators'),
          fineract.get<LoanOriginatorsResponse>(
            `v1/loans/${loanId}/originators`
          ),
        ])
        setOptions(
          attachableOriginators(
            all.data ?? [],
            attached.data?.originators ?? []
          )
        )
      } catch (err) {
        setError(apiErrorMessage(err, 'Failed to load the loan originators.'))
      } finally {
        setLoading(false)
      }
    })()
  }, [loanId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originatorId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await fineract.post(`v1/loans/${loanId}/originators/${originatorId}`, {})
      // Same as the other loan account actions: client loan paths have no
      // LoansView route, so a built /originators URL would not match there
      navigate(-1)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to attach the loan originator.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs items={breadcrumbs} />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Attach Loan Originator</h2>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <AppSelect
            selectLabel="Loan Originator*"
            selectPlaceholder="Select originator"
            selectValue={originatorId}
            selectOnChange={setOriginatorId}
            selectOptions={options.flatMap(o =>
              o.id == null ? [] : [{ id: o.id, name: o.name ?? String(o.id) }]
            )}
            selectEmptyMessage={
              loading ? 'Loading…' : 'No active originators left to attach'
            }
            selectClassname="w-full space-y-2"
          />

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!originatorId || submitting}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AttachLoanOriginator
