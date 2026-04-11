/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import Dropdown from '@/components/custom/navbar/Dropdown'
import AppTabs from '@/components/custom/tabs/AppTabs'

import type {
  GetLoansLoanIdResponse,
  GetLoansLoanIdStatus,
} from '@/fineract-api'
import { LoansApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { faCircle, faMoneyBill } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from 'lucide-react'

const loansApi = new LoansApi(getConfiguration())

/** Extension for properties the API may return but are not on the generated type. */
type ExtendedLoan = GetLoansLoanIdResponse & {
  group?: { name?: string }
  inArrears?: boolean
  loanStatus?: GetLoansLoanIdStatus
  loanStatusType?: { value?: string }
}

/* permissions */
const granted = new Set<string>([
  'ADD_CHARGE',
  'APPROVE_LOAN',
  'UPDATE_LOAN',
  'REJECT_LOAN',
  'WITHDRAW_LOAN',
  'DELETE_LOAN',
  'CREATE_LOANCOLLATERAL',
  'READ_GUARANTOR',
  'CREATE_GUARANTOR',
  'READ_LOAN',
  'ASSIGN_STAFF_LOAN',
  'DISBURSE_LOAN',
  'REPAYMENT_LOAN',
  'FORECLOSE_LOAN',
  'ADD_INTEREST_PAUSE',
  'PREPAY_LOAN',
  'CHARGEOFF_LOAN',
  'REAGE_LOAN',
  'REAMORTIZE_LOAN',
  'GOODWILL_CREDIT',
  'INTEREST_PAYMENT_WAIVER',
  'PAYOUT_REFUND',
  'MERCHANT_ISSUED_REFUND',
])
const hasPerm = (p: string) => granted.has(p)

/* loan stages helper */
type LoanStage = 'CREATED' | 'APPROVED' | 'ACTIVE' | 'CLOSED'
const getLoanStage = (ln: ExtendedLoan): LoanStage => {
  const s = ln.status ?? ({} as GetLoansLoanIdStatus)
  if (s.pendingApproval) return 'CREATED'
  if (
    (!s.active && s.waitingForDisbursal) ||
    (s.description ?? '').toLowerCase() === 'approved'
  ) {
    return 'APPROVED'
  }
  if (s.active) return 'ACTIVE'
  return 'CLOSED'
}

/* build dropdown menu based on loan stage + perms */
interface MenuItem {
  label: string
  path?: string
  disabled?: boolean
  children?: MenuItem[]
}

function buildLoanMenu(loan: ExtendedLoan, groupId?: string, loanId?: string) {
  const stage = getLoanStage(loan)
  const id = loanId
  const items: MenuItem[] = []

  const add = (label: string, path: string, perm?: string) => {
    if (!perm || hasPerm(perm)) items.push({ label, path })
  }
  const allow = (
    label: string,
    path: string,
    perm?: string
  ): MenuItem | null => (!perm || hasPerm(perm) ? { label, path } : null)
  const compact = <T,>(a: Array<T | null | undefined>) =>
    a.filter(Boolean) as T[]

  switch (stage) {
    case 'CREATED': {
      add(
        'Add Loan Charge',
        `loans-accounts/${id}/actions/AddLoanCharge`,
        'ADD_CHARGE'
      )
      add('Approve', `loans-accounts/${id}/actions/Approve`, 'APPROVE_LOAN')
      add(
        'Modify Application',
        `loans-accounts/${id}/actions/Modify`,
        'UPDATE_LOAN'
      )
      add('Reject', `loans-accounts/${id}/actions/Reject`, 'REJECT_LOAN')

      const more = compact([
        allow(
          'Withdrawn by Client',
          `loans-accounts/${id}/actions/WithdrawnByClient`,
          'WITHDRAW_LOAN'
        ),
        allow('Delete', `loans-accounts/${id}/actions/Delete`, 'DELETE_LOAN'),
        allow(
          'Add Collateral',
          `loans-accounts/${id}/actions/AddCollateral`,
          'CREATE_LOANCOLLATERAL'
        ),
        allow(
          'View Guarantors',
          `loans-accounts/${id}/actions/ViewGuarantors`,
          'READ_GUARANTOR'
        ),
        allow(
          'Create Guarantor',
          `loans-accounts/${id}/actions/CreateGuarantor`,
          'CREATE_GUARANTOR'
        ),
        allow(
          'Loan Screen Reports',
          `loans-accounts/${id}/actions/LoanScreenReports`,
          'READ_LOAN'
        ),
        allow(
          'Assign Loan Officer',
          `loans-accounts/${id}/actions/AssignLoanOfficer`,
          'ASSIGN_STAFF_LOAN'
        ),
      ])
      if (more.length) items.push({ label: 'More', children: more })
      break
    }

    case 'APPROVED': {
      add('Disburse', `loans-accounts/${id}/actions/Disburse`, 'DISBURSE_LOAN')
      add(
        'Disburse to Savings',
        `loans-accounts/${id}/actions/DisburseToSavings`,
        'DISBURSE_LOAN'
      )
      add(
        'Undo Approval',
        `loans-accounts/${id}/actions/UndoApproval`,
        'APPROVE_LOAN'
      )
      add(
        'Assign Loan Officer',
        `loans-accounts/${id}/actions/AssignLoanOfficer`,
        'ASSIGN_STAFF_LOAN'
      )

      const more = compact([
        allow(
          'Add Loan Charge',
          `loans-accounts/${id}/actions/AddLoanCharge`,
          'ADD_CHARGE'
        ),
        allow(
          'View Guarantors',
          `loans-accounts/${id}/actions/ViewGuarantors`,
          'READ_GUARANTOR'
        ),
        allow(
          'Create Guarantor',
          `loans-accounts/${id}/actions/CreateGuarantor`,
          'CREATE_GUARANTOR'
        ),
        allow(
          'Loan Screen Report',
          `loans-accounts/${id}/actions/LoanScreenReports`,
          'READ_LOAN'
        ),
      ])
      if (more.length) items.push({ label: 'More', children: more })
      break
    }

    case 'ACTIVE': {
      add(
        'Add Loan Charge',
        `loans-accounts/${id}/actions/AddLoanCharge`,
        'ADD_CHARGE'
      )
      add(
        'Foreclosure',
        `loans-accounts/${id}/actions/Foreclosure`,
        'FORECLOSE_LOAN'
      )
      add(
        'Make Repayment',
        `loans-accounts/${id}/actions/MakeRepayment`,
        'REPAYMENT_LOAN'
      )
      add(
        'Undo Disbursal',
        `loans-accounts/${id}/actions/UndoDisbursal`,
        'DISBURSE_LOAN'
      )
      add(
        'Add Interest Pause',
        `loans-accounts/${id}/actions/AddInterestPause`,
        'ADD_INTEREST_PAUSE'
      )
      add(
        'Assign Loan Officer',
        `loans-accounts/${id}/actions/AssignLoanOfficer`,
        'ASSIGN_STAFF_LOAN'
      )
      add(
        'Prepay Loan',
        `loans-accounts/${id}/actions/PrepayLoan`,
        'PREPAY_LOAN'
      )
      add(
        'Charge-Off',
        `loans-accounts/${id}/actions/Charge-Off`,
        'CHARGEOFF_LOAN'
      )
      add('Re-Age', `loans-accounts/${id}/actions/Re-Age`, 'REAGE_LOAN')
      add(
        'Re-Amortize',
        `loans-accounts/${id}/actions/Re-Amortize`,
        'REAMORTIZE_LOAN'
      )

      const payments = compact([
        allow(
          'Goodwill Credit',
          `loans-accounts/${id}/actions/GoodwillCredit`,
          'GOODWILL_CREDIT'
        ),
        allow(
          'Interest Payment Waiver',
          `loans-accounts/${id}/actions/InterestPaymentWaiver`,
          'INTEREST_PAYMENT_WAIVER'
        ),
        allow(
          'Payout Refund',
          `loans-accounts/${id}/actions/PayoutRefund`,
          'PAYOUT_REFUND'
        ),
        allow(
          'Merchant Issued Refund',
          `loans-accounts/${id}/actions/MerchantIssuedRefund`,
          'MERCHANT_ISSUED_REFUND'
        ),
      ])
      if (payments.length) items.push({ label: 'Payments', children: payments })

      const more = compact([
        {
          label: 'Waive Interest',
          path: `loans-accounts/${id}/actions/WaiveInterest`,
        },
        {
          label: 'Reschedule',
          path: `loans-accounts/${id}/actions/Reschedule`,
        },
        { label: 'Write Off', path: `loans-accounts/${id}/actions/WriteOff` },
        {
          label: 'Close (as Rescheduled)',
          path: `loans-accounts/${id}/actions/Close-as-Rescheduled`,
        },
        { label: 'Close', path: `loans-accounts/${id}/actions/Close` },
        allow(
          'Loan Screen Report',
          `loans-accounts/${id}/actions/LoanScreenReports`,
          'READ_LOAN'
        ),
        allow(
          'View Guarantors',
          `loans-accounts/${id}/actions/ViewGuarantors`,
          'READ_GUARANTOR'
        ),
        allow(
          'Create Guarantor',
          `loans-accounts/${id}/actions/CreateGuarantor`,
          'CREATE_GUARANTOR'
        ),
        {
          label: 'Recover From Guarantor',
          path: `loans-accounts/${id}/actions/RecoverFromGuarantor`,
        },
        { label: 'Sell Loan', path: `loans-accounts/${id}/actions/SellLoan` },
        {
          label: 'Contract Termination',
          path: `loans-accounts/${id}/actions/ContractTermination`,
        },
      ])
      if (more.length) items.push({ label: 'More', children: more })
      break
    }

    case 'CLOSED':
    default: {
      const payments = compact([
        allow(
          'Goodwill Credit',
          `loans-accounts/${id}/actions/GoodwillCredit`,
          'GOODWILL_CREDIT'
        ),
        allow(
          'Interest Payment Waiver',
          `loans-accounts/${id}/actions/InterestPaymentWaiver`,
          'INTEREST_PAYMENT_WAIVER'
        ),
        allow(
          'Payout Refund',
          `loans-accounts/${id}/actions/PayoutRefund`,
          'PAYOUT_REFUND'
        ),
        allow(
          'Merchant Issued Refund',
          `loans-accounts/${id}/actions/MerchantIssuedRefund`,
          'MERCHANT_ISSUED_REFUND'
        ),
      ])
      if (payments.length) items.push({ label: 'Payments', children: payments })
      if (!payments.length) items.push({ label: 'No actions', disabled: true })
      break
    }
  }

  const prefix = groupId ? `groups/${groupId}/` : ''
  return items.map(it =>
    it.children
      ? {
          ...it,
          children: it.children.map(c => ({
            ...c,
            path: `${prefix}${c.path}`,
          })),
        }
      : { ...it, path: `${prefix}${it.path}` }
  )
}

const LoansView = () => {
  const { groupId, loanId } = useParams()
  const [loan, setLoan] = useState<ExtendedLoan>()

  // fetch loan data
  useEffect(() => {
    if (!loanId) return
    ;(async () => {
      try {
        const loanIdNum = Number(loanId)
        const res = await loansApi.retrieveLoan(loanIdNum)
        setLoan(res.data as ExtendedLoan)
      } catch (err) {
        console.error('Failed to fetch loan', err)
      }
    })()
  }, [loanId])

  // status handling
  const s = loan?.status ?? loan?.loanStatus ?? ({} as GetLoansLoanIdStatus)
  const statusDesc = (
    s.description ??
    loan?.loanStatusType?.value ??
    ''
  ).toLowerCase()

  const inArrears = Boolean(loan?.inArrears ?? loan?.summary?.inArrears)
  const isActive = Boolean(s.active || statusDesc === 'active')
  const isApproved = Boolean(
    (!s.active && s.waitingForDisbursal) || statusDesc === 'approved'
  )
  const isPending = Boolean(s.pendingApproval || statusDesc.includes('pending'))

  const statusColor = inArrears
    ? 'text-yellow-400'
    : isActive
      ? 'text-green-400'
      : isApproved
        ? 'text-blue-500'
        : isPending
          ? 'text-orange-400'
          : 'text-zinc-400'

  // key info
  const productName = loan?.loanProductName ?? '—'
  const accountNo = loan?.accountNo ?? '—'
  const borrowerName = loan?.group?.name ?? loan?.clientName ?? '—'

  // build actions + tabs
  const actions = loan ? buildLoanMenu(loan, groupId, loanId) : []
  const base = `groups/${groupId}/loans-accounts/${loanId}`
  const tabs = [
    { label: 'General', href: `${base}/general` },
    { label: 'Account Details', href: `${base}/accountdetail` },
    { label: 'Repayment Schedule', href: `${base}/repayment-schedule` },
    { label: 'Transactions', href: `${base}/transactions` },
    { label: 'Loan Collateral Details', href: `${base}/loan-collateral` },
    { label: 'Term Variations', href: `${base}/term-variations` },
    { label: 'Loan Documents', href: `${base}/loan-documents` },
    { label: 'Notes', href: `${base}/notes` },
  ]

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: borrowerName, href: `/groups/${groupId}/general` },
          { label: 'Loans', href: `/groups/${groupId}/loans-accounts` },
        ]}
      />

      {/* loan header card */}
      <div className="bg-[#0e77b7] text-white p-6 mt-6 rounded-t-lg flex justify-between items-start relative">
        <div className="space-y-2">
          <FontAwesomeIcon
            icon={faMoneyBill}
            className="text-black w-10 h-10"
          />
          <div className="text-xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircle}
              className={`${statusColor} w-3 h-3`}
            />
            <span>Loan Account</span>
          </div>
          <div>Product: {productName}</div>
          <div>Account No: {accountNo}</div>
          <div>Borrower: {borrowerName}</div>
        </div>

        {/* actions dropdown */}
        <div className="flex flex-col h-full">
          <div className="flex justify-end">
            <Dropdown
              name={
                <span className="flex items-center gap-2">
                  <Menu />
                </span>
              }
              options={
                actions.length
                  ? actions
                  : [{ label: 'No actions', disabled: true }]
              }
            />
          </div>
        </div>
      </div>

      {/* tabs + outlet */}
      <AppTabs tabs={tabs} />
      <div className="bg-white dark:bg-zinc-800 rounded-b-lg border p-6 border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default LoansView
