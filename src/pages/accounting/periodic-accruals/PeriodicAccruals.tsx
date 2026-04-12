/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Play } from 'lucide-react'

const PeriodicAccruals = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: ' Execute Periodic Accrual Accounting', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          Execute Periodic Accrual
        </h2>

        <form className="space-y-6">
          <div className="w-full space-y-2">
            <Label>Accrue Till Date*</Label>
            <Input type="date" />
          </div>

          <div className="flex justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting')}
            >
              Cancel
            </Button>
            <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white">
              <Play />
              Run Periodic Accruals
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PeriodicAccruals
