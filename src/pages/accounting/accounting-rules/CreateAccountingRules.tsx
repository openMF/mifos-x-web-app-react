/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  AccountingRulesApi,
  type AccountingRuleData,
  type AccountRuleRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const accountingRulesApi = new AccountingRulesApi(getConfiguration())

const CreateAccountingRule = () => {
  const navigate = useNavigate()

  const [template, setTemplate] = useState<AccountingRuleData | null>(null)
  const [debitRuleType, setDebitRuleType] = useState('fixedAccount')
  const [creditRuleType, setCreditRuleType] = useState('fixedAccount')

  const [formData, setFormData] = useState<AccountRuleRequest>({
    name: '',
    description: '',
  })

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await accountingRulesApi.retrieveTemplate1()
        setTemplate(response.data)
      } catch (err) {
        console.error('Failed to fetch accounting rule template', err)
      }
    }
    fetchTemplate()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await accountingRulesApi.createAccountingRule(formData)
      navigate('/accounting/accounting-rules')
    } catch (err) {
      console.error('Failed to create accounting rule', err)
    }
  }

  if (!template) {
    return (
      <div className="text-center py-10">
        Loading accounting rule template...
      </div>
    )
  }

  const officeOptions = (template.allowedOffices ?? [])
    .filter(o => o.id !== undefined)
    .map(o => ({ id: o.id!.toString(), name: o.name! }))

  const accountOptions = (template.allowedAccounts ?? [])
    .filter(a => a.id !== undefined)
    .map(a => ({ id: a.id!.toString(), name: a.name! }))

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Accounting Rules', href: '/accounting/accounting-rules' },
          { label: 'Create', current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Accounting Rule</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Accounting Rule Name*</Label>
              <Input
                value={formData.name ?? ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <AppSelect
              selectLabel="Office*"
              selectValue={formData.officeId?.toString() ?? ''}
              selectOnChange={val =>
                setFormData(prev => ({ ...prev, officeId: +val }))
              }
              selectPlaceholder="Select Office"
              selectOptions={officeOptions}
            />
          </div>

          {/* Debit rule type */}
          <div className="flex flex-wrap items-center gap-6">
            <Label className="w-full md:w-[48%]">
              Affected GL Entry (Debit) Rule Type *
            </Label>
            <RadioGroup
              value={debitRuleType}
              onValueChange={setDebitRuleType}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixedAccount" id="debit-fixed" />
                <Label htmlFor="debit-fixed" className="font-normal">
                  Fixed Account
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="listOfAccounts" id="debit-list" />
                <Label htmlFor="debit-list" className="font-normal">
                  List of Accounts
                </Label>
              </div>
            </RadioGroup>
          </div>

          {debitRuleType === 'fixedAccount' ? (
            <AppSelect
              selectLabel="Account to Debit"
              selectValue={formData.accountToDebit?.toString() ?? ''}
              selectOnChange={val =>
                setFormData(prev => ({ ...prev, accountToDebit: +val }))
              }
              selectPlaceholder="Select Account"
              selectOptions={accountOptions}
            />
          ) : (
            <div className="space-y-2">
              <Label>Debit Tags</Label>
              <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
                Missing in OpenAPI
              </div>
            </div>
          )}

          {/* Credit rule type */}
          <div className="flex flex-wrap items-center gap-6">
            <Label className="w-full md:w-[48%]">
              Affected GL Entry (Credit) Rule Type *
            </Label>
            <RadioGroup
              value={creditRuleType}
              onValueChange={setCreditRuleType}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixedAccount" id="credit-fixed" />
                <Label htmlFor="credit-fixed" className="font-normal">
                  Fixed Account
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="listOfAccounts" id="credit-list" />
                <Label htmlFor="credit-list" className="font-normal">
                  List of Accounts
                </Label>
              </div>
            </RadioGroup>
          </div>

          {creditRuleType === 'fixedAccount' ? (
            <AppSelect
              selectLabel="Account to Credit"
              selectValue={formData.accountToCredit?.toString() ?? ''}
              selectOnChange={val =>
                setFormData(prev => ({ ...prev, accountToCredit: +val }))
              }
              selectPlaceholder="Select Account"
              selectOptions={accountOptions}
            />
          ) : (
            <div className="space-y-2">
              <Label>Credit Tags</Label>
              <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
                Missing in OpenAPI
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description ?? ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting/accounting-rules')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAccountingRule
