/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useTranslation } from 'react-i18next'

const Profile = () => {
  const { t, i18n } = useTranslation(['common', 'auth'])
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.profile'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-4">
          <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white px-4 py-2">
            {t('auth:user.permissions')}
          </Button>
          <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white px-4 py-2">
            {t('auth:user.changePassword')}
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          {t('auth:user.userInformation')}
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">{t('auth:user.tenantId')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">default</div>

          <div className="font-medium">{t('auth:user.userId')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">1</div>

          <div className="font-medium">{t('auth:user.userName')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">mifos</div>

          <div className="font-medium">{t('common:fields.office')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">Head Office</div>

          <div className="font-medium">{t('common:fields.status')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {t('common:status.authenticated')}
          </div>

          <div className="font-medium">{t('common:fields.language')}</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {t(
              `languages.${i18n.resolvedLanguage ?? 'en-US'}` as 'languages.en-US',
              { ns: 'common' }
            )}
          </div>
        </div>

        <div className="mt-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
          <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-700 font-semibold text-sm text-zinc-700 dark:text-zinc-300 p-3 border-b dark:border-zinc-600">
            <div>{t('common:fields.role')}</div>
            <div>{t('common:fields.description')}</div>
          </div>
          <div className="grid grid-cols-2 text-sm text-zinc-700 dark:text-zinc-200 p-3">
            <div>{t('auth:user.superUser')}</div>
            <div>{t('auth:user.superUserDescription')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
