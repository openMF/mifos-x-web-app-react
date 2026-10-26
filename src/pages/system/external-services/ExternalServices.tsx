/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import fineract from '@/lib/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorMessage,
  EXTERNAL_SERVICES,
  toValues,
  type ServiceError,
  type ServiceProperty,
} from './services'

/**
 * System > External Services, as in the Angular web app: the email (SMTP),
 * Amazon S3, SMS gateway and push notification settings. Secret values are
 * never shown, only whether one is set.
 */
const ExternalServices = () => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    {}
  )
  const [error, setError] = useState<ServiceError | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const results = await Promise.all(
          EXTERNAL_SERVICES.map(s =>
            fineract.get<ServiceProperty[]>(`v1/externalservice/${s.name}`)
          )
        )
        setValues(
          Object.fromEntries(
            EXTERNAL_SERVICES.map((s, i) => [
              s.name,
              toValues(results[i].data ?? []),
            ])
          )
        )
      } catch (err) {
        setError({ message: apiErrorMessage(err), kind: 'loadServices' })
      }
    })()
  }, [])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('externalServices'), current: true },
        ]}
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error.message ?? t(`serviceSettings.errors.${error.kind}`)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {EXTERNAL_SERVICES.map(service => {
          const current = values[service.name] ?? {}
          return (
            <section
              key={service.name}
              className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t(service.titleKey)}</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/system/external-services/${service.slug}/edit`)
                  }
                >
                  <FontAwesomeIcon icon={faPen} className="mr-2" />
                  {t('common:actions.edit')}
                </Button>
              </div>
              <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
                {service.fields.map(field => {
                  const value = current[field.name] ?? ''
                  let shown: string
                  if (field.secret)
                    shown = value
                      ? t('serviceSettings.secretSet')
                      : t('serviceSettings.notSet')
                  else if (field.boolean)
                    shown =
                      value === 'true'
                        ? t('common:actions.yes')
                        : value
                          ? t('common:actions.no')
                          : '—'
                  else shown = value || '—'
                  return (
                    <div key={field.name} className="contents">
                      <dt className="font-medium">{t(field.labelKey)}</dt>
                      <dd className="break-all">{shown}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default ExternalServices
