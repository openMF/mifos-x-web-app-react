/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

const BulkImport = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Bulk Import', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow mt-6">
        <h2 className="text-2xl font-semibold mb-2">Bulk Import</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          This page is not implemented yet. Please check back later.
        </p>
      </div>
    </div>
  )
}

export default BulkImport
