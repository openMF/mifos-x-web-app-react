/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'

const LoanScreenReports = () => {
  const breadcrumbs = useAccountBreadcrumbs({
    actionLabel: 'Loan Screen Reports',
  })

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs items={breadcrumbs} />
    </div>
  )
}

export default LoanScreenReports
