/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const LoanProvisioning = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Loan Provisioning Criteria', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow mt-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Loan Provisioning Criteria
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Define provisioning buckets and percentages for loan risk.
            </p>
          </div>
          <Button>Create Criteria</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="criteria-name">
              Criteria Name
            </label>
            <Input
              id="criteria-name"
              placeholder="e.g. Standard Provisioning"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="currency">
              Currency
            </label>
            <Select>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="inr">INR</SelectItem>
                <SelectItem value="kes">KES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="effective-date">
              Effective Date
            </label>
            <Input id="effective-date" type="date" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead>Min Days</TableHead>
                <TableHead>Max Days</TableHead>
                <TableHead>Provisioning %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-zinc-500"
                >
                  No buckets configured.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline">Cancel</Button>
          <Button>Save Draft</Button>
        </div>
      </div>
    </div>
  )
}

export default LoanProvisioning
