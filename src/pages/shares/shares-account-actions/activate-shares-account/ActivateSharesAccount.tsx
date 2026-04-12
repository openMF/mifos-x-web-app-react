/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const ActivateSharesAccount = () => {
  const { clientId, sharesAccountId } = useParams()
  const navigate = useNavigate()

  const [activatedDate, setActivatedDate] = useState('')

  const backToAccount = () => {
    if (clientId && sharesAccountId) {
      navigate(-1)
    } else if (clientId) {
      navigate(`/clients/${clientId}/shares`)
    } else {
      navigate(-1)
    }
  }

  const onSubmit = () => {
    backToAccount()
  }

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Clients', href: '/clients' },
          {
            label: 'Shares',
            href: clientId ? `/clients/${clientId}/shares` : '/clients',
          },
          { label: 'Activate', current: true },
        ]}
      />

      {/* Card */}
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Activate</h2>

          <div className="space-y-6">
            {/* Activated On Date */}
            <div className="space-y-2">
              <Label>Activated On Date*</Label>
              <Input
                type="date"
                value={activatedDate}
                onChange={e => setActivatedDate(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={backToAccount}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={!activatedDate}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivateSharesAccount
