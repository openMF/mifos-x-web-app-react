/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  TellerCashManagementApi,
  type PostTellersTellerIdCashiersRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import CashierForm from './CashierForm'
import {
  apiErrorMessage,
  type CashierPayload,
  type CashierTemplate,
} from './types'

const tellersApi = new TellerCashManagementApi(getConfiguration())

/** Adds a cashier to a teller (POST /tellers/{tellerId}/cashiers) */
const CreateCashier = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [template, setTemplate] = useState<CashierTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await tellersApi.getCashierTemplate(Number(id))
        setTemplate((res.data ?? {}) as CashierTemplate)
      } catch (err) {
        setLoadError(apiErrorMessage(err, t('cashiers.errors.loadStaff')))
      }
    })()
  }, [id, t])

  const handleSubmit = async (payload: CashierPayload) => {
    try {
      await tellersApi.createCashier(
        Number(id),
        payload as PostTellersTellerIdCashiersRequest
      )
      navigate(`/organization/tellers/${id}/cashiers`)
      return null
    } catch (err) {
      return apiErrorMessage(err, t('cashiers.errors.create'))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('cashiers.breadcrumbs.tellers'),
            href: '/organization/tellers',
          },
          {
            label: t('cashiers.title'),
            href: `/organization/tellers/${id}/cashiers`,
          },
          { label: t('common:actions.create'), current: true },
        ]}
      />
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}
      {template && (
        <CashierForm
          title={t('cashiers.create')}
          template={template}
          cancelPath={`/organization/tellers/${id}/cashiers`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default CreateCashier
