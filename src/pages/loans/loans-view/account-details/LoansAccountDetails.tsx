/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type {
  GetLoansLoanIdResponse,
  GetLoansLoanIdAmortizationType,
  GetLoansLoanIdInterestRateFrequencyType,
  GetLoansLoanIdInterestType,
  GetLoansLoanIdInterestCalculationPeriodType,
  GetLoansLoanIdRepaymentFrequencyType,
} from '@/fineract-api'
import { LoansApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const loansApi = new LoansApi(getConfiguration())

/** Extension for properties not on the generated type but returned at runtime. */
type ExtendedLoan = GetLoansLoanIdResponse & {
  transactionProcessingStrategyName?: string
  transactionProcessingStrategyId?: { value?: string }
  isEqualAmortization?: boolean
  isEnableDownPayment?: boolean
  chargeOffReason?: { value?: string }
  isIncomeFromInterestAccrual?: boolean
  graceOnPrincipalPayment?: number
  graceOnInterestPayment?: number
  graceOnInterestCharged?: number
  graceOnArrearsAgeing?: number
  fundSourceName?: string
  fundSourceId?: { value?: string }
  interestFreePeriodInDays?: number
  allowPartialPeriodInterestCalc?: boolean
  isInterestRecognitionAtDisbursement?: boolean
  isInterestRecalculationEnabled?: boolean
  daysInYearType?: { value?: string }
  daysInMonthType?: { value?: string }
}

/** Helper type to extract value from enum option types. */
type EnumValue = { value?: string }

const enumVal = (
  e:
    | EnumValue
    | GetLoansLoanIdAmortizationType
    | GetLoansLoanIdInterestRateFrequencyType
    | GetLoansLoanIdInterestType
    | GetLoansLoanIdInterestCalculationPeriodType
    | GetLoansLoanIdRepaymentFrequencyType
    | undefined
): string | undefined => (e as EnumValue | undefined)?.value

const yesNo = (v?: boolean) => (v ? 'Yes' : 'No')

/* helper: format Fineract dates */
const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'Not Available'
  const dt = new Date(d)
  return isNaN(+dt) ? 'Not Available' : dt.toLocaleDateString()
}

/* simple row component for label + value */
const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-2 gap-4 px-4 py-2">
    <div className="text-zinc-600 dark:text-zinc-300">{label}</div>
    <div className="text-right">{value}</div>
  </div>
)

/* section wrapper with title + content */
const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="mb-10">
    <h3 className="text-lg font-semibold mb-3">{title}</h3>
    <div className="divide-y divide-zinc-200 dark:divide-zinc-700 rounded-md overflow-hidden">
      {children}
    </div>
  </section>
)

const LoansAccountDetails = () => {
  const { loanId } = useParams()
  const [loan, setLoan] = useState<ExtendedLoan | null>(null)
  const [loading, setLoading] = useState(true)

  // fetch loan details
  useEffect(() => {
    ;(async () => {
      try {
        if (!loanId) return
        const loanIdNum = Number(loanId)
        const res = await loansApi.retrieveLoan(loanIdNum)
        setLoan(res.data as ExtendedLoan)
      } finally {
        setLoading(false)
      }
    })()
  }, [loanId])

  if (loading)
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
    )
  if (!loan) return <div className="text-sm">Not Available</div>

  // derive display values with fallbacks
  const repaymentStrategy =
    loan.transactionProcessingStrategyName ??
    loan.transactionProcessingStrategyId?.value ??
    'Not Provided'

  const repayments =
    loan.repaymentEvery && enumVal(loan.repaymentFrequencyType)
      ? `${loan.repaymentEvery} every ${enumVal(loan.repaymentFrequencyType)}`
      : 'Not Provided'

  const amortization = enumVal(loan.amortizationType) ?? 'Equal installments'
  const equalAmortization = yesNo(loan.isEqualAmortization)

  const annualRate =
    typeof loan.annualInterestRate === 'number'
      ? loan.annualInterestRate.toFixed(2)
      : undefined
  const freqVal = enumVal(loan.interestRateFrequencyType)
  const perPeriodRate =
    typeof loan.interestRatePerPeriod === 'number' && freqVal
      ? `${loan.interestRatePerPeriod} % Per ${freqVal.toLowerCase()}`
      : undefined
  const interest = annualRate
    ? `${annualRate} % per annum${perPeriodRate ? ` (${perPeriodRate})` : ''}`
    : 'Not Provided'

  const interestType = enumVal(loan.interestType) ?? 'Declining Balance'
  const enableDownPayments = yesNo(loan.isEnableDownPayment)
  const chargeOffBehaviour = loan.chargeOffReason?.value ?? 'Regular'
  const enableIncomeCapitalization = yesNo(loan.isIncomeFromInterestAccrual)
  const graceOnPrincipal = loan.graceOnPrincipalPayment ?? 0
  const graceOnInterest =
    loan.graceOnInterestPayment ?? loan.graceOnInterestCharged ?? 0
  const graceOnArrears = loan.graceOnArrearsAgeing ?? 0
  const installmentLevelDelinquency = yesNo(
    loan.enableInstallmentLevelDelinquency
  )

  const fundSource =
    loan.fundSourceName ?? loan.fundSourceId?.value ?? 'Unassigned'

  const interestFreePeriod =
    typeof loan.interestFreePeriodInDays === 'number'
      ? `${loan.interestFreePeriodInDays} Days`
      : 'Not Provided'

  const interestCalcPeriod =
    enumVal(loan.interestCalculationPeriodType) ?? 'Same as repayment period'
  const allowPartialInterestSameAsRepayment = yesNo(
    loan.allowPartialPeriodInterestCalc
  )
  const interestRecognitionAtDisbursement = yesNo(
    loan.isInterestRecognitionAtDisbursement
  )

  const submittedOn = fmtDate(loan.timeline?.submittedOnDate)
  const approvedOn = fmtDate(loan.timeline?.approvedOnDate)
  const disbursedOn = fmtDate(
    loan.timeline?.actualDisbursementDate ??
      loan.timeline?.expectedDisbursementDate
  )
  const maturesOn = fmtDate(loan.timeline?.expectedMaturityDate)

  const recalcInterestOnNewTerms = yesNo(loan.isInterestRecalculationEnabled)
  const daysInYear = loan.daysInYearType?.value ?? 'Actual'
  const daysInMonth = loan.daysInMonthType?.value ?? 'Actual'

  return (
    <div className="space-y-10 text-black dark:text-white">
      {/* loan details section */}
      <Section title="Loan Details">
        <Row label="Repayment Strategy" value={repaymentStrategy} />
        <Row label="Repayments" value={repayments} />
        <Row label="Amortization" value={amortization} />
        <Row label="Equal Amortization" value={equalAmortization} />
        <Row label="Interest" value={interest} />
        <Row label="Interest Type" value={interestType} />
        <Row label="Enable Down Payments:" value={enableDownPayments} />
        <Row label="Loan Charge-off behaviour:" value={chargeOffBehaviour} />
        <Row
          label="Enable income capitalization"
          value={enableIncomeCapitalization}
        />
        <Row
          label="Grace: On Principal Payment"
          value={graceOnPrincipal ? String(graceOnPrincipal) : '—'}
        />
        <Row
          label="Grace: On Interest Payment"
          value={graceOnInterest ? String(graceOnInterest) : '—'}
        />
        <Row
          label="Grace on Arrears Ageing"
          value={graceOnArrears ? String(graceOnArrears) : '—'}
        />
        <Row
          label="Enable installment level Delinquency"
          value={installmentLevelDelinquency}
        />
        <Row label="Fund Source" value={fundSource} />
        <Row label="Interest Free Period" value={interestFreePeriod} />
        <Row label="Interest Calculation Period" value={interestCalcPeriod} />
        <Row
          label="Allow Partial Interest Calculation with same as repayment"
          value={allowPartialInterestSameAsRepayment}
        />
        <Row
          label="Is interest recognition on disbursement date?:"
          value={interestRecognitionAtDisbursement}
        />
        <Row label="Submitted on" value={submittedOn} />
        <Row label="Approved on" value={approvedOn} />
        <Row label="Disbursed on" value={disbursedOn} />
        <Row label="Matures on" value={maturesOn} />
        <Row
          label="Recalculate Interest based on new terms"
          value={recalcInterestOnNewTerms}
        />
        <Row label="Days in year" value={daysInYear} />
        <Row label="Days in month" value={daysInMonth} />
      </Section>
    </div>
  )
}

export default LoansAccountDetails
