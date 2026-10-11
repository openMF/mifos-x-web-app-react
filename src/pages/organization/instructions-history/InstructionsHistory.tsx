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

const InstructionsHistory = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Standing Instructions History', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow mt-6">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-2xl font-semibold">
            Standing Instructions History
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Review standing instructions across clients and accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="client-query">
              Client Name or ID
            </label>
            <Input id="client-query" placeholder="Search by client" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account-type">
              Account Type
            </label>
            <Select>
              <SelectTrigger id="account-type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="share">Share</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="from-date">
              From Date
            </label>
            <Input id="from-date" type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="to-date">
              To Date
            </label>
            <Input id="to-date" type="date" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <Button variant="outline">Reset</Button>
          <Button>Search</Button>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Instruction Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-zinc-500"
                >
                  No instructions found.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default InstructionsHistory
