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
import fineract from '@/lib/axios'

import HookForm from './HookForm'
import {
  apiErrorMessage,
  type HookPayload,
  type HookRequestError,
  type HooksTemplate,
} from './types'

/** Creates a hook (POST /hooks) */
const CreateHook = () => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [template, setTemplate] = useState<HooksTemplate | null>(null)
  const [loadError, setLoadError] = useState<HookRequestError | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fineract.get<HooksTemplate>('v1/hooks/template')
        setTemplate(res.data ?? {})
      } catch (err) {
        setLoadError({
          message: apiErrorMessage(err),
          fallback: 'loadTemplates',
        })
      }
    })()
  }, [])

  const handleSubmit = async (payload: HookPayload) => {
    try {
      const res = await fineract.post<{ resourceId?: number }>(
        'v1/hooks',
        payload
      )
      const id = res.data?.resourceId
      navigate(id ? `/system/hooks/${id}` : '/system/hooks')
      return null
    } catch (err) {
      return apiErrorMessage(err) ?? t('hooks.errors.create')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageHooks'), href: '/system/hooks' },
          { label: t('common:actions.create'), current: true },
        ]}
      />
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError.message ?? t(`hooks.errors.${loadError.fallback}`)}
        </div>
      )}
      {template && (
        <HookForm
          title={t('hooks.create')}
          template={template}
          cancelPath="/system/hooks"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default CreateHook
