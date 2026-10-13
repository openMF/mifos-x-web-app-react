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
  type PutTellersTellerIdCashiersCashierIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import CashierForm from './CashierForm'
import {
  apiErrorMessage,
  type Cashier,
  type CashierPayload,
  type CashierTemplate,
} from './types'

const tellersApi = new TellerCashManagementApi(getConfiguration())

/** Edits a cashier (PUT /tellers/{tellerId}/cashiers/{cashierId}) */
const EditCashier = () => {
  const { id, cashierId } = useParams<{ id: string; cashierId: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [cashier, setCashier] = useState<Cashier | null>(null)
  const [template, setTemplate] = useState<CashierTemplate | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !cashierId) return
    ;(async () => {
      try {
        const [c, t] = await Promise.all([
          tellersApi.findCashierData(Number(id), Number(cashierId)),
          tellersApi.getCashierTemplate(Number(id)),
        ])
        setCashier((c.data ?? {}) as Cashier)
        setTemplate((t.data ?? {}) as CashierTemplate)
      } catch (err) {
        setLoadError(apiErrorMessage(err, t('cashiers.errors.load')))
      }
    })()
  }, [id, cashierId, t])

  const handleSubmit = async (payload: CashierPayload) => {
    try {
      await tellersApi.updateCashier(
        Number(id),
        Number(cashierId),
        payload as PutTellersTellerIdCashiersCashierIdRequest
      )
      navigate(`/organization/tellers/${id}/cashiers/${cashierId}`)
      return null
    } catch (err) {
      return apiErrorMessage(err, t('cashiers.errors.update'))
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
          { label: t('common:actions.edit'), current: true },
        ]}
      />
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}
      {cashier && template && (
        <CashierForm
          title={t('cashiers.edit')}
          template={template}
          initial={cashier}
          cancelPath={`/organization/tellers/${id}/cashiers/${cashierId}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditCashier
