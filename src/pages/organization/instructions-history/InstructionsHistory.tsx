/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getConfiguration } from '@/lib/fineract-openapi'
import { StandingInstructionsHistoryApi } from '@/fineract-api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const api = new StandingInstructionsHistoryApi(getConfiguration())

const InstructionsHistory = () => {
  const navigate = useNavigate()
  const today = new Date()
  const maximumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  const [form, setForm] = useState({
    clientName: '',
    clientId: '',
    transferType: 'account-transfer',
    accountType: 'loan-account',
    fromAccountId: '',
    fromDate: '',
    toDate: '',
  })

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await api.retrieveAll20(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        form.transferType === 'account-transfer' ? 1 : 2,
        form.clientName || undefined,
        form.clientId ? Number(form.clientId) : undefined,
        form.fromAccountId ? Number(form.fromAccountId) : undefined,
        form.accountType === 'savings-account' ? 1 : 2,
        undefined,
        undefined,
        form.fromDate ? { fromDate: form.fromDate } : undefined,
        form.toDate ? { toDate: form.toDate } : undefined
      )
    } catch (error) {
      console.error('Failed to search standing instructions history', error)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Standing Instructions History', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border shadow p-5 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={form.clientName}
              onChange={event => handleChange('clientName', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-id">Client Id</Label>
            <Input
              id="client-id"
              value={form.clientId}
              onChange={event => handleChange('clientId', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-type">Transfer Type</Label>
            <Select
              value={form.transferType}
              onValueChange={value => handleChange('transferType', value)}
            >
              <SelectTrigger id="transfer-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account-transfer">
                  Account Transfer
                </SelectItem>
                <SelectItem value="loan-repayment">Loan Repayment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select
              value={form.accountType}
              onValueChange={value => handleChange('accountType', value)}
            >
              <SelectTrigger id="account-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings-account">Savings Account</SelectItem>
                <SelectItem value="loan-account">Loan Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Input
              id="from-date"
              type="date"
              max={maximumDate}
              value={form.fromDate}
              onChange={event => handleChange('fromDate', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Input
              id="to-date"
              type="date"
              max={maximumDate}
              value={form.toDate}
              onChange={event => handleChange('toDate', event.target.value)}
            />
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Instructions
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InstructionsHistory
