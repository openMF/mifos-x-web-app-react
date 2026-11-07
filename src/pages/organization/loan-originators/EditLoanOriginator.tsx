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
import fineract from '@/lib/axios'

import OriginatorForm from './OriginatorForm'
import {
  apiErrorMessage,
  type LoanOriginator,
  type LoanOriginatorPayload,
  type LoanOriginatorTemplate,
} from './types'

/** Edits a loan originator (PUT /loan-originators/{id}) */
const EditLoanOriginator = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [originator, setOriginator] = useState<LoanOriginator | null>(null)
  const [template, setTemplate] = useState<LoanOriginatorTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [o, t] = await Promise.all([
          fineract.get<LoanOriginator>(`v1/loan-originators/${id}`),
          fineract.get<LoanOriginatorTemplate>('v1/loan-originators/template'),
        ])
        setOriginator(o.data ?? {})
        setTemplate(t.data ?? {})
      } catch (err) {
        setLoadError(
          apiErrorMessage(err, 'Failed to load the loan originator.')
        )
      }
    })()
  }, [id])

  const handleSubmit = async (payload: LoanOriginatorPayload) => {
    try {
      await fineract.put(`v1/loan-originators/${id}`, payload)
      navigate(`/organization/loan-originators/${id}`)
      return null
    } catch (err) {
      return apiErrorMessage(err, 'Failed to update the loan originator.')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          {
            label: 'Manage Loan Originators',
            href: '/organization/loan-originators',
          },
          {
            label: originator?.name ?? id ?? '',
            href: `/organization/loan-originators/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}

      {originator && template && (
        <OriginatorForm
          title="Edit Loan Originator"
          template={template}
          initial={originator}
          cancelPath={`/organization/loan-originators/${id}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditLoanOriginator
