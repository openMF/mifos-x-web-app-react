/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { ProvisioningCriteriaApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import CriteriaForm, { type CriteriaPayload } from './CriteriaForm'
import { apiErrorMessage, type ProvisioningCriteria } from './types'

const provisioningCriteriaApi = new ProvisioningCriteriaApi(getConfiguration())

/** Creates a loan provisioning criteria (POST /provisioningcriteria) */
const CreateLoanProvisioningCriteria = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [template, setTemplate] = useState<ProvisioningCriteria | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await provisioningCriteriaApi.retrieveTemplate3()
        setTemplate((res.data ?? {}) as ProvisioningCriteria)
      } catch (err) {
        setLoadError(
          apiErrorMessage(
            err,
            t('provisioningCriteria.messages.loadTemplateError')
          )
        )
      }
    })()
  }, [t])

  const handleSubmit = async (payload: CriteriaPayload) => {
    try {
      const res =
        await provisioningCriteriaApi.createProvisioningCriteria(payload)
      const id = res.data?.resourceId
      navigate(
        id
          ? `/organization/loan-provisioning/${id}`
          : '/organization/loan-provisioning'
      )
      return null
    } catch (err) {
      return apiErrorMessage(
        err,
        t('provisioningCriteria.messages.createError')
      )
    }
  }

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
          { label: t('common:actions.create'), current: true },
        ]}
      />

      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </div>
      )}

      {template && (
        <CriteriaForm
          title={t('provisioningCriteria.create')}
          initialDefinitions={template.definitions ?? []}
          productOptions={template.loanProducts ?? []}
          glAccounts={template.glAccounts ?? []}
          cancelPath="/organization/loan-provisioning"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default CreateLoanProvisioningCriteria
