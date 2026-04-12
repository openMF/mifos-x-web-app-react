/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  AccountingRulesApi,
  CurrencyApi,
  JournalEntriesApi,
  OfficesApi,
  PaymentTypeApi,
  type AccountingRuleData,
  type CurrencyData,
  type GLAccountDataForLookup,
  type GetOfficesResponse,
  type GetPaymentTypeData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

// Api calls for the dropdowns
const officeApi = new OfficesApi(getConfiguration())
const currencyApi = new CurrencyApi(getConfiguration())
const paymentApi = new PaymentTypeApi(getConfiguration())
const accRuleApi = new AccountingRulesApi(getConfiguration())
const journalEntryApi = new JournalEntriesApi(getConfiguration())

const FrequentPostings = () => {
  const navigate = useNavigate()

  // states to store the data
  const [offices, setOffices] = useState<GetOfficesResponse[] | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyData[] | null>(null)
  const [paymentTypes, setPaymentTypes] = useState<GetPaymentTypeData[] | null>(
    null
  )

  const [accountingRules, setAccountingRules] = useState<
    AccountingRuleData[] | null
  >(null)

  const [selectedRule, setSelectedRule] = useState<AccountingRuleData | null>(
    null
  )
  const [debitAmount, setDebitAmount] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [selectedDebitAccount, setSelectedDebitAccount] = useState('')
  const [selectedCreditAccount, setSelectedCreditAccount] = useState('')

  // Main form state
  const [formData, setFormData] = useState({
    office: '',
    currency: '',
    accountingRule: '',
    refNo: '',
    date: '',
    paymentType: '',
    accNo: '',
    chequeNo: '',
    routingCode: '',
    receiptNo: '',
    bankNo: '',
    comments: '',
  })

  //Api calls to fetch the data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [officesRes, currenciesRes, paymentTypesRes, accountingRulesRes] =
          await Promise.all([
            officeApi.retrieveOffices(),
            currencyApi.retrieveCurrencies(),
            paymentApi.getAllPaymentTypes(),
            accRuleApi.retrieveAllAccountingRules(),
          ])
        setOffices(officesRes.data)
        setCurrencies(currenciesRes.data.selectedCurrencyOptions ?? [])
        setPaymentTypes(paymentTypesRes.data)
        setAccountingRules(accountingRulesRes.data)
      } catch (err) {
        console.error('Failed to fetch Dropdown Data', err)
      }
    }
    fetchDropdowns()
  }, [])

  const handleRuleChange = (value: string) => {
    setFormData(prev => ({ ...prev, accountingRule: value }))
    const rule = accountingRules?.find(r => r.id?.toString() === value)

    if (!rule) return

    setSelectedRule(rule)
    setSelectedDebitAccount(rule.debitAccounts?.[0]?.id?.toString() ?? '')
    setSelectedCreditAccount(rule.creditAccounts?.[0]?.id?.toString() ?? '')
  }

  //logic to actually subit the frequent postings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.office ||
      !formData.currency ||
      !formData.date ||
      !selectedRule
    ) {
      alert('Please fill all required fields.')
      return
    }

    const payload = {
      officeId: parseInt(formData.office),
      currencyCode: formData.currency,
      transactionDate: formData.date,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
      referenceNumber: formData.refNo,
      paymentTypeId: formData.paymentType
        ? parseInt(formData.paymentType)
        : undefined,
      accountNumber: formData.accNo,
      checkNumber: formData.chequeNo,
      routingCode: formData.routingCode,
      receiptNumber: formData.receiptNo,
      bankNumber: formData.bankNo,
      comments: formData.comments,
      debits: [
        {
          glAccountId: parseInt(selectedDebitAccount),
          amount: parseFloat(debitAmount),
        },
      ],
      credits: [
        {
          glAccountId: parseInt(selectedCreditAccount),
          amount: parseFloat(creditAmount),
        },
      ],
    }

    try {
      await journalEntryApi.createGLJournalEntry(formData.office, payload)
      alert('Frequnet postings entry created successfully!')
    } catch (err) {
      console.error('Failed to create frequnet postings', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Journal Entries' },
          { label: 'Frequent Postings', current: true },
        ]}
      />
      {/* Main Form Div */}
      <div className="bg-white p-8 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6">Frequent Postings</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Office *"
              selectValue={formData.office}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, office: value }))
              }
              selectPlaceholder="Select office"
              selectOptions={(offices || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />
            <AppSelect
              selectLabel="Accounting Rule *"
              selectValue={formData.accountingRule}
              selectOnChange={handleRuleChange}
              selectPlaceholder="Select accounting rule"
              selectOptions={(accountingRules || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Currency *"
              selectValue={formData.currency}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, currency: value }))
              }
              selectPlaceholder="Select currency"
              selectOptions={(currencies || [])
                .filter(option => option.code !== undefined)
                .map(option => ({
                  id: option.code!,
                  name: option.displayLabel!,
                }))}
            />
          </div>

          {selectedRule && (
            <>
              <div className="flex flex-wrap gap-6">
                <AppSelect
                  selectLabel="Affected GL Entry (Debit) *"
                  selectValue={selectedDebitAccount}
                  selectOnChange={setSelectedDebitAccount}
                  selectPlaceholder="Select Debit Account"
                  selectOptions={(selectedRule.debitAccounts || [])
                    .filter(
                      (option: GLAccountDataForLookup) =>
                        option.id !== undefined
                    )
                    .map((option: GLAccountDataForLookup) => ({
                      id: option.id!,
                      name: option.name!,
                    }))}
                />

                <div className="w-full md:w-[48%] space-y-2">
                  <Label>Debit Amount *</Label>
                  <Input
                    value={debitAmount}
                    onChange={e => setDebitAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Credit */}
              <div className="flex flex-wrap gap-6">
                <AppSelect
                  selectLabel="Affected GL Entry (Credit) *"
                  selectValue={selectedCreditAccount}
                  selectOnChange={setSelectedCreditAccount}
                  selectPlaceholder="Select Credit Account"
                  selectOptions={(selectedRule.creditAccounts || [])
                    .filter(
                      (option: GLAccountDataForLookup) =>
                        option.id !== undefined
                    )
                    .map((option: GLAccountDataForLookup) => ({
                      id: option.id!,
                      name: option.name!,
                    }))}
                />
                <div className="w-full md:w-[48%] space-y-2">
                  <Label>Credit Amount *</Label>
                  <Input
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={formData.refNo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, refNo: e.target.value }))
                }
                className="w-full"
                placeholder="Enter reference number"
              />
            </div>
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Transaction Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={e =>
                  setFormData(prev => ({ ...prev, date: e.target.value }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Payment Type"
              selectValue={formData.paymentType}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, paymentType: value }))
              }
              selectPlaceholder="Select payment type"
              selectOptions={(paymentTypes || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />

            <div className="w-full md:w-[48%] space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.accNo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, accNo: e.target.value }))
                }
                className="w-full"
                placeholder="Enter account number"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Cheque Number</Label>
              <Input
                value={formData.chequeNo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, chequeNo: e.target.value }))
                }
                className="w-full"
                placeholder="Enter cheque number"
              />
            </div>
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Routing Code</Label>
              <Input
                value={formData.routingCode}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    routingCode: e.target.value,
                  }))
                }
                className="w-full"
                placeholder="Enter routing code"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Receipt Number</Label>
              <Input
                value={formData.receiptNo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, receiptNo: e.target.value }))
                }
                className="w-full"
                placeholder="Enter receipt number"
              />
            </div>
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Bank Number</Label>
              <Input
                value={formData.bankNo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, bankNo: e.target.value }))
                }
                className="w-full"
                placeholder="Enter bank number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Input
              value={formData.comments}
              onChange={e =>
                setFormData(prev => ({ ...prev, comments: e.target.value }))
              }
              className="w-full"
              placeholder="Enter comments"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting')}
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

export default FrequentPostings
