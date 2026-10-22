/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faFileExcel } from '@fortawesome/free-solid-svg-icons'

import { BULK_IMPORTS } from './bulkImports'

/** Organization > Bulk Import: the import types, as in the Angular web app */
const BulkImport = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          { label: t('common:actions.bulkImport'), current: true },
        ]}
      />

      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-6">
        {t('bulkImport.description')}
      </p>

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {BULK_IMPORTS.map(entity => (
            <button
              type="button"
              key={entity.slug}
              onClick={() =>
                navigate(`/organization/bulk-import/${entity.slug}`)
              }
              className="flex items-center justify-between px-6 py-4 cursor-pointer text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all"
            >
              <span className="flex items-center gap-4">
                <FontAwesomeIcon
                  icon={faFileExcel}
                  className="text-zinc-700 dark:text-zinc-300 w-4 h-4"
                />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {t(`bulkImport.types.${entity.labelKey}`)}
                </span>
              </span>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-zinc-500 dark:text-zinc-300 w-3 h-3"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BulkImport
