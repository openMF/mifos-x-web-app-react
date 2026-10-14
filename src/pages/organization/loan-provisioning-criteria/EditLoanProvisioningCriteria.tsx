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
import { ProvisioningCriteriaApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import CriteriaForm, { type CriteriaPayload } from './CriteriaForm'
import { apiErrorMessage, type ProvisioningCriteria } from './types'

const provisioningCriteriaApi = new ProvisioningCriteriaApi(getConfiguration())

/** Edits a loan provisioning criteria (PUT /provisioningcriteria/{id}) */
const EditLoanProvisioningCriteria = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [criteria, setCriteria] = useState<ProvisioningCriteria | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        // template=true adds the GL accounts and the selectable products
        const res = await provisioningCriteriaApi.retrieveProvisioningCriteria(
          Number(id),
          {
            params: { template: true },
          }
        )
        setCriteria((res.data ?? {}) as ProvisioningCriteria)
      } catch (err) {
        setLoadError(
          apiErrorMessage(err, t('provisioningCriteria.messages.loadError'))
        )
      }
    })()
  }, [id, t])

  const handleSubmit = async (payload: CriteriaPayload) => {
    try {
      await provisioningCriteriaApi.updateProvisioningCriteria(
        Number(id),
        payload
      )
      navigate(`/organization/loan-provisioning/${id}`)
      return null
    } catch (err) {
      return apiErrorMessage(
        err,
        t('provisioningCriteria.messages.updateError')
      )
    }
  }

  // The criteria's own products plus those still free, without repeats
  const selected = criteria?.selectedLoanProducts ?? []
  const productOptions = [
    ...selected,
    ...(criteria?.loanProducts ?? []).filter(
      p => !selected.some(s => s.id === p.id)
    ),
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('provisioningCriteria.title'),
            href: '/organization/loan-provisioning',
          },
          {
            label: criteria?.criteriaName ?? id ?? '',
            href: `/organization/loan-provisioning/${id}`,
          },
          { label: t('common:actions.edit'), current: true },
        ]}
      />

      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}

      {criteria && (
        <CriteriaForm
          title={t('provisioningCriteria.edit')}
          initialName={criteria.criteriaName}
          initialProductIds={selected.map(p => String(p.id))}
          initialDefinitions={criteria.definitions ?? []}
          productOptions={productOptions}
          glAccounts={criteria.glAccounts ?? []}
          cancelPath={`/organization/loan-provisioning/${id}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditLoanProvisioningCriteria
