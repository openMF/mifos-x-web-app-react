/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate as _useNavigate, useParams } from 'react-router-dom' // Reserved for future use: _useNavigate
import { useEffect, useState } from 'react'

import { Button as _Button } from '@/components/ui/button' // Reserved for future use: _Button
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  LoanProductsApi,
  type GetLoanProductsProductIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { Separator } from '@radix-ui/react-separator'

const LoanProductApi = new LoanProductsApi(getConfiguration())

const ViewLoanProducts = () => {
  const { id } = useParams()
  const [loanProduct, setLoanProduct] =
    useState<GetLoanProductsProductIdResponse | null>(null)

  useEffect(() => {
    const fetchLoanProduct = async () => {
      try {
        const response = await LoanProductApi.retrieveLoanProductDetails(
          Number(id)
        )
        setLoanProduct(response.data)
      } catch (err) {
        console.error('Failed to fetch loan product', err)
      }
    }
    fetchLoanProduct()
  }, [id])

  if (!loanProduct) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          { label: 'Loan Products', href: '/products/loan-products' },
          { label: loanProduct.name ?? 'Loan', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Details
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Name:
          </div>
          <div>{loanProduct.name ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Short Name:
          </div>
          <div>{loanProduct.shortName ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            External Id:
          </div>
          <div>{'Missing in openApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Include in Customer Loan Counter:
          </div>
          <div>{loanProduct.includeInBorrowerCycle ? 'Yes' : 'No'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Start Date:
          </div>
          <div>{'Missing in openApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Close Date:
          </div>
          <div>{'Missing in openApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Description:
          </div>
          <div>{loanProduct.description ?? '—'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Currency */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Currency
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Currency:
          </div>
          <div>{loanProduct.currency?.code ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Currency:
          </div>
          <div>
            {loanProduct.currency?.displaySymbol
              ? `${loanProduct.currency.name} (${loanProduct.currency.displaySymbol})`
              : (loanProduct.currency?.name ?? '—')}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Decimal Places:
          </div>
          <div>{loanProduct.currency?.decimalPlaces ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Currency in multiples of:
          </div>
          <div>{loanProduct.currency?.inMultiplesOf ?? 0}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Installment in multiples of:
          </div>
          <div>{'Missing in openApi'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* TERMS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Terms
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Principal:
          </div>
          <div>
            {loanProduct.principal} (Min {loanProduct.principal} : Max{' '}
            {loanProduct.principal})
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Allow Approved / Disbursed Amounts Over Applied:
          </div>
          <div>
            {loanProduct.allowApprovedDisbursedAmountsOverApplied
              ? 'Yes'
              : 'No'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Installment day calculation from:
          </div>
          <div>{'No desc in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Number of Repayments:
          </div>
          <div>
            {loanProduct.numberOfRepayments} (Min:{' '}
            {loanProduct.numberOfRepayments}, Max:{' '}
            {loanProduct.numberOfRepayments})
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Linked to floating interest rates:
          </div>
          <div>
            {loanProduct.isLinkedToFloatingInterestRates ? 'Yes' : 'No'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Nominal interest rate:
          </div>
          <div>
            {loanProduct.interestRatePerPeriod} (Min:{' '}
            {loanProduct.interestRatePerPeriod}, Max:{' '}
            {loanProduct.interestRatePerPeriod}){' '}
            {loanProduct.interestRateFrequencyType?.description}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Terms vary based on loan cycle:
          </div>
          <div>{loanProduct.useBorrowerCycle ? 'Yes' : 'No'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Repay Every:
          </div>
          <div>
            {loanProduct.repaymentEvery}{' '}
            {loanProduct.repaymentFrequencyType?.code
              ? loanProduct.repaymentFrequencyType.code
                  .split('.')
                  .pop()
                  ?.replace(/^./, c => c.toUpperCase())
              : '—'}
          </div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* SETTINGS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Settings
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Amortization:
          </div>
          <div>
            {loanProduct.amortizationType?.code
              ? loanProduct.amortizationType.code
                  .split('.')
                  .slice(-2)
                  .map(word => word.replace(/^./, c => c.toUpperCase()))
                  .join(' ')
              : '—'}
          </div>
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Is Equal Amortization?
          </div>
          <div>{loanProduct.amortizationType?.description ? 'Yes' : 'No'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest Method:
          </div>
          <div>
            {loanProduct.interestType?.code
              ? loanProduct.interestType.code
                  .split('.')
                  .slice(-2)
                  .map(word => word.replace(/^./, c => c.toUpperCase()))
                  .join(' ')
              : '—'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest Calculation Period:
          </div>
          <div>
            {loanProduct.interestCalculationPeriodType?.code
              ? loanProduct.interestCalculationPeriodType.code
                  .replace('interestCalculationPeriodType.', '')
                  .split('.')
                  .map(word => word.replace(/^./, c => c.toUpperCase()))
                  .join(' ')
              : '—'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Allow Partial Interest Calculation with same as repayment:
          </div>
          <div>
            {loanProduct.allowPartialPeriodInterestCalculation ? 'Yes' : 'No'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Is interest recognition on disbursement date?
          </div>
          <div>
            {loanProduct.interestRecognitionOnDisbursementDate ? 'Yes' : 'No'}
          </div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* LOAN SCHEDULE */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Loan Schedule
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Loan Schedule Type:
          </div>
          <div>{loanProduct.loanScheduleType?.value ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Repayment Strategy:
          </div>
          <div className="text-blue-600 hover:underline cursor-pointer">
            {loanProduct.transactionProcessingStrategyName ?? '—'}
          </div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* DOWN PAYMENTS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Down Payments
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Enable Down Payments:
          </div>
          <div>{loanProduct.enableDownPayment ? 'Yes' : 'No'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* MORATORIUM */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Moratorium
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Delinquency Bucket:
          </div>
          <div>{loanProduct.delinquencyBucket?.name ?? 'Unassigned'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Enable installment level Delinquency:
          </div>
          <div>
            {loanProduct.enableInstallmentLevelDelinquency ? 'Yes' : 'No'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Days in year:
          </div>
          <div>
            {loanProduct.daysInYearType?.code
              ? loanProduct.daysInYearType.code
                  .split('.')
                  .pop()
                  ?.replace(/^./, c => c.toUpperCase())
              : '—'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Days in month:
          </div>
          <div>
            {loanProduct.daysInMonthType?.code
              ? loanProduct.daysInMonthType.code
                  .split('.')
                  .pop()
                  ?.replace(/^./, c => c.toUpperCase())
              : '—'}
          </div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Allow fixing of the installment amount:
          </div>
          <div>{loanProduct.canDefineInstallmentAmount ? 'Yes' : 'No'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Account moves out of NPA only after all arrears have been cleared:
          </div>
          <div>{'Missing in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Variable Installments allowed:
          </div>
          <div>{loanProduct.allowVariableInstallments ? 'Yes' : 'No'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Allowed to be used for providing Top Up Loans:
          </div>
          <div>{loanProduct.canUseForTopup ? 'Yes' : 'No'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* INTEREST RECALCULATION */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Interest Recalculation
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Recalculate Interest:
          </div>
          <div>{loanProduct.isInterestRecalculationEnabled ? 'Yes' : 'No'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* GUARANTEE REQUIREMENTS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Guarantee Requirements
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Place Guarantee Funds On-Hold:
          </div>
          <div>{'Missing in OpenApi'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* LOAN TRANCHE DETAILS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Loan Tranche Details
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Enable Multiple Disbursals:
          </div>
          <div>{loanProduct.multiDisburseLoan ? 'Yes' : 'No'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* EVENT SETTINGS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Event Settings
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Use Global Configurations for Repayment Event:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Due days for repayment event:
          </div>
          <div>{loanProduct.dueDaysForRepaymentEvent ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            OverDue days for repayment event:
          </div>
          <div>{loanProduct.overDueDaysForRepaymentEvent ?? '—'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* CONFIGURABLE TERMS AND SETTINGS */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Configurable Terms and Settings
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Allow overriding select terms and settings in loan accounts:
          </div>
          {'Missing in OpenApi'}

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Amortization:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest method:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Repayment strategy:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest calculation period:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Arrears tolerance:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Repaid every:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Moratorium:
          </div>
          {'Missing in OpenApi'}
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Number of days a loan may be overdue before moving into arrears:
          </div>
          {'Missing in OpenApi'}
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* ACCOUNTING */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Accounting
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Type:
          </div>
          {'Missing in OpenApi'}
        </div>
      </div>
    </div>
  )
}

export default ViewLoanProducts
