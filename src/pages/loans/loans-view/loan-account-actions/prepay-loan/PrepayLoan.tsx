/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const PrepayLoan = () => {
  const navigate = useNavigate()

  // form state
  const [transactionDate, setTransactionDate] = useState('')
  const [principalDisplay] = useState('')
  const [interestDisplay] = useState('')
  const [feesDisplay] = useState('')
  const [penaltiesDisplay] = useState('')
  const [currencyCode] = useState('')
  const [amountDisplay] = useState('')

  const [externalId, setExternalId] = useState('')
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)

  // extra payment details
  const [accountNumber, setAccountNumber] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [routingCode, setRoutingCode] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [bankNumber, setBankNumber] = useState('')

  const [note, setNote] = useState('')

  // simple validation
  const canSubmit = Boolean(transactionDate)

  // handle submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    navigate(-1)
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Prepay Loan', current: true },
        ]}
      />

      {/* form card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Prepay Loan</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* transaction date */}
          <div className="space-y-2">
            <Label>Transaction Date*</Label>
            <Input
              type="date"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
            />
          </div>

          {/* loan breakdown */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Principal</Label>
              <Input value={principalDisplay} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Interest</Label>
              <Input value={interestDisplay} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Fees</Label>
              <Input value={feesDisplay} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Penalties</Label>
              <Input value={penaltiesDisplay} readOnly />
            </div>
          </div>

          {/* total transaction amount */}
          <div className="space-y-2">
            <Label>Transaction Amount*</Label>
            <div className="flex items-center gap-3">
              <Input value={currencyCode} readOnly className="w-24" />
              <Input value={amountDisplay} readOnly />
            </div>
          </div>

          {/* external id */}
          <div className="space-y-2">
            <Label>External Id</Label>
            <Input
              value={externalId}
              onChange={e => setExternalId(e.target.value)}
            />
          </div>

          {/* payment type */}
          <div className="space-y-2">
            <AppSelect
              selectLabel="Payment Type"
              selectPlaceholder="Select payment type"
              selectValue={paymentTypeId}
              selectOnChange={setPaymentTypeId}
              selectOptions={[]}
              selectClassname="w-full space-y-2"
            />
          </div>

          {/* toggle payment details */}
          <div className="flex items-center gap-3">
            <Switch
              checked={showPaymentDetails}
              onCheckedChange={v => setShowPaymentDetails(Boolean(v))}
            />
            <span className="text-sm font-medium">Show Payment Details</span>
          </div>

          {/* extra payment details */}
          {showPaymentDetails && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Account #</Label>
                <Input
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cheque #</Label>
                <Input
                  value={checkNumber}
                  onChange={e => setCheckNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Routing Code</Label>
                <Input
                  value={routingCode}
                  onChange={e => setRoutingCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Receipt #</Label>
                <Input
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank #</Label>
                <Input
                  value={bankNumber}
                  onChange={e => setBankNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
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

export default PrepayLoan
