/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import fineract from '@/lib/axios'

import {
  apiErrorMessage,
  buildServiceUpdate,
  EXTERNAL_SERVICES,
  initialForm,
  toValues,
  type ServiceError,
  type ServiceProperty,
} from './services'

/**
 * Edits one external service (PUT /externalservice/{name}). Only changed
 * fields are sent. Secret fields start empty and are sent only when a new
 * value is typed: Fineract returns some secrets masked (s****rt81) and would
 * store that masked text if it were sent back.
 */
const EditExternalService = () => {
  const { service: slug } = useParams<{ service: string }>()
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const service = EXTERNAL_SERVICES.find(s => s.slug === slug)

  const [original, setOriginal] = useState<Record<string, string> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState<ServiceError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!service) return
    // The route can switch services without remounting: drop the previous
    // service's values and ignore a response that arrives after the switch
    let stale = false
    setOriginal(null)
    setForm({})
    setError(null)
    ;(async () => {
      try {
        const res = await fineract.get<ServiceProperty[]>(
          `v1/externalservice/${service.name}`
        )
        if (stale) return
        const values = toValues(res.data ?? [])
        setOriginal(values)
        // Secrets start empty: leaving them empty keeps the stored value
        setForm(initialForm(service, values))
      } catch (err) {
        if (stale) return
        setError({ message: apiErrorMessage(err), kind: 'loadSettings' })
      }
    })()
    return () => {
      stale = true
    }
  }, [service])

  if (!service) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
        <p>{t('serviceSettings.unknownService', { slug })}</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || !original) return
    const changes = buildServiceUpdate(service, original, form)
    if (Object.keys(changes).length === 0) {
      navigate('/system/external-services')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await fineract.put(`v1/externalservice/${service.name}`, changes)
      navigate('/system/external-services')
    } catch (err) {
      setError({ message: apiErrorMessage(err), kind: 'saveSettings' })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          {
            label: t('externalServices'),
            href: '/system/external-services',
          },
          { label: t(service.titleKey), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {t('serviceSettings.editTitle', { service: t(service.titleKey) })}
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {service.fields.map(field =>
            field.boolean ? (
              <div key={field.name} className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={form[field.name] === 'true'}
                  onCheckedChange={v =>
                    setForm(prev => ({
                      ...prev,
                      [field.name]: v === true ? 'true' : 'false',
                    }))
                  }
                />
                <Label htmlFor={field.name}>{t(field.labelKey)}</Label>
              </div>
            ) : (
              <div key={field.name} className="w-full space-y-2">
                <Label htmlFor={field.name}>{t(field.labelKey)}</Label>
                <Input
                  id={field.name}
                  type={field.secret ? 'password' : 'text'}
                  autoComplete={field.secret ? 'new-password' : 'off'}
                  placeholder={
                    field.secret
                      ? original?.[field.name]
                        ? t('serviceSettings.secretPlaceholder')
                        : t('serviceSettings.notSet')
                      : undefined
                  }
                  value={form[field.name] ?? ''}
                  onChange={e =>
                    setForm(prev => ({ ...prev, [field.name]: e.target.value }))
                  }
                />
              </div>
            )
          )}

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error.message ?? t(`serviceSettings.errors.${error.kind}`)}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/system/external-services')}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={submitting || !original}
            >
              {t('common:actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditExternalService
