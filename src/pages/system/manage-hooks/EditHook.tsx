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
import fineract from '@/lib/axios'

import HookForm from './HookForm'
import {
  apiErrorMessage,
  type Hook,
  type HookPayload,
  type HookRequestError,
  type HooksTemplate,
} from './types'

/** Edits a hook (PUT /hooks/{id}) */
const EditHook = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [hook, setHook] = useState<Hook | null>(null)
  const [template, setTemplate] = useState<HooksTemplate | null>(null)
  const [loadError, setLoadError] = useState<HookRequestError | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [h, t] = await Promise.all([
          fineract.get<Hook>(`v1/hooks/${id}`),
          fineract.get<HooksTemplate>('v1/hooks/template'),
        ])
        setHook(h.data ?? {})
        setTemplate(t.data ?? {})
      } catch (err) {
        setLoadError({ message: apiErrorMessage(err), fallback: 'loadHook' })
      }
    })()
  }, [id])

  const handleSubmit = async (payload: HookPayload) => {
    try {
      await fineract.put(`v1/hooks/${id}`, payload)
      navigate(`/system/hooks/${id}`)
      return null
    } catch (err) {
      return apiErrorMessage(err) ?? t('hooks.errors.update')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('manageHooks'), href: '/system/hooks' },
          {
            label: hook?.displayName ?? id ?? '',
            href: `/system/hooks/${id}`,
          },
          { label: t('common:actions.edit'), current: true },
        ]}
      />
      {loadError && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {loadError.message ?? t(`hooks.errors.${loadError.fallback}`)}
        </div>
      )}
      {hook && template && (
        <HookForm
          title={t('hooks.edit')}
          template={template}
          initial={hook}
          cancelPath={`/system/hooks/${id}`}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default EditHook
