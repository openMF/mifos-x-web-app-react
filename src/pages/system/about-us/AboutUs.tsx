/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Trans, useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

const VALUES = ['transparent', 'affordable', 'innovative', 'secure'] as const

const ECOSYSTEM = ['platform', 'community', 'partners', 'foundation'] as const

const headingClass =
  'text-lg font-semibold text-zinc-800 dark:text-zinc-100 pt-2'

/** About Us, as in the Angular web app */
const AboutUs = () => {
  const { t } = useTranslation(['organization', 'common'])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('aboutUs.title'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 mt-6 text-sm text-zinc-700 dark:text-zinc-200 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          {t('aboutUs.title')}
        </h2>
        <p>{t('aboutUs.introduction')}</p>
        <p>
          <Trans
            i18nKey="aboutUs.platform"
            ns="organization"
            components={{
              mifosLink: (
                <a
                  href="https://mifos.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1074b9] underline"
                />
              ),
            }}
          />
        </p>

        <h3 className={headingClass}>{t('aboutUs.missionTitle')}</h3>
        <p>{t('aboutUs.mission')}</p>

        <h3 className={headingClass}>{t('aboutUs.visionTitle')}</h3>
        <p>{t('aboutUs.vision')}</p>

        <h3 className={headingClass}>{t('aboutUs.openSourceTitle')}</h3>
        <p>{t('aboutUs.openSource')}</p>
        <ul className="list-disc pl-6 space-y-2">
          {VALUES.map(key => (
            <li key={key}>
              <strong>{t(`aboutUs.values.${key}`)}:</strong>{' '}
              {t(`aboutUs.values.${key}Description`)}
            </li>
          ))}
        </ul>

        <h3 className={headingClass}>{t('aboutUs.ecosystemTitle')}</h3>
        <p>{t('aboutUs.ecosystem')}</p>
        <ul className="list-disc pl-6 space-y-2">
          {ECOSYSTEM.map(key => (
            <li key={key}>
              <strong>{t(`aboutUs.ecosystemParts.${key}`)}:</strong>{' '}
              {t(`aboutUs.ecosystemParts.${key}Description`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default AboutUs
