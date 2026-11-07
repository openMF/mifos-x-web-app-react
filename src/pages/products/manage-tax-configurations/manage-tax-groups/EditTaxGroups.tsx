/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

const EditTaxGroups = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Tax Configurations',
            href: '/products/tax-configurations',
          },
          {
            label: 'Tax Groups',
            href: '/products/tax-configurations/tax-groups',
          },
          {
            label: `${id}`,
            href: `/products/tax-configurations/tax-groups/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold mb-6">Edit Tax Group</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name*</Label>
            <Input id="name" placeholder="Name" />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Tax Components</span>
          </div>

          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() =>
                navigate('/products/tax-configurations/tax-groups')
              }
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditTaxGroups
