/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import fineract from '@/lib/axios'

import OriginatorForm from './OriginatorForm'
import {
  apiErrorMessage,
  type LoanOriginatorPayload,
  type LoanOriginatorTemplate,
} from './types'

/** Creates a loan originator (POST /loan-originators) */
const CreateLoanOriginator = () => {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<LoanOriginatorTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fineract.get<LoanOriginatorTemplate>(
          'v1/loan-originators/template'
        )
        setTemplate(res.data ?? {})
      } catch (err) {
        setLoadError(apiErrorMessage(err, 'Failed to load the template.'))
      }
    })()
  }, [])

  const handleSubmit = async (payload: LoanOriginatorPayload) => {
    try {
      const res = await fineract.post<{ resourceId?: number }>(
        'v1/loan-originators',
        payload
      )
      const id = res.data?.resourceId
      navigate(
        id
          ? `/organization/loan-originators/${id}`
          : '/organization/loan-originators'
      )
      return null
    } catch (err) {
      return apiErrorMessage(err, 'Failed to create the loan originator.')
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
          { label: 'Create', current: true },
        ]}
      />

      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}

      {template && (
        <OriginatorForm
          title="Create Loan Originator"
          template={template}
          cancelPath="/organization/loan-originators"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default CreateLoanOriginator
