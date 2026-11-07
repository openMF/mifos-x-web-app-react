/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type {
  GetLoanProductsTemplateResponse,
  PostLoanProductsRequest,
} from '@/fineract-api'
import AppSelect from '@/components/custom/select/AppSelect'

interface LoanProductSettingsStepProps {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
  template: GetLoanProductsTemplateResponse
}

const LoanProductSettingsStep = ({
  formData,
  onChange,
  template,
}: LoanProductSettingsStepProps) => {
  //local UI state
  const [multiDisburseLoan, setMultiDisburseLoan] = useState(false)
  const [enableDownPayment, setEnableDownPayment] = useState(false)
  const [allowVariableInstallments, setAllowVariableInstallments] =
    useState(false)
  const [isInterestRecalculationEnabled, setIsInterestRecalculationEnabled] =
    useState(false)
  const [holdGuaranteeFunds, setHoldGuaranteeFunds] = useState(false)
  const [
    useDueForRepaymentsConfigurations,
    setUseDueForRepaymentsConfigurations,
  ] = useState(false)
  const [allowAttributeConfiguration, setAllowAttributeConfiguration] =
    useState(true)

  // allowPartialPeriodInterestCalcualtion is misspelled in OpenAPI
  const [allowPartialPeriod, setAllowPartialPeriod] = useState(true)

  // Local state for variable installment gaps — not in PostLoanProductsRequest
  const [variableInstallmentMinGap, setVariableInstallmentMinGap] = useState<
    number | undefined
  >(undefined)
  const [variableInstallmentMaxGap, setVariableInstallmentMaxGap] = useState<
    number | undefined
  >(undefined)

  // Local state for guarantee fields — stored in LoanProductGuaranteeDetails, not PostLoanProductsRequest
  const [mandatoryGuarantee, setMandatoryGuarantee] = useState<
    number | undefined
  >(undefined)
  const [minGuaranteeFromOwnFunds, setMinGuaranteeFromOwnFunds] = useState<
    number | undefined
  >(undefined)
  const [minGuaranteeFromGuarantor, setMinGuaranteeFromGuarantor] = useState<
    number | undefined
  >(undefined)

  const [attributeOverrides, setAttributeOverrides] = useState({
    amortizationType: true,
    interestType: true,
    transactionProcessingStrategyCode: true,
    interestCalculationPeriodType: true,
    inArrearsTolerance: true,
    repaymentEvery: true,
    graceOnPrincipalAndInterestPayment: true,
    graceOnArrearsAgeing: true,
  })

  const labelMap: Record<string, string> = {
    amortizationType: 'Amortization',
    interestType: 'Interest method',
    transactionProcessingStrategyCode: 'Repayment strategy',
    interestCalculationPeriodType: 'Interest calculation period',
    inArrearsTolerance: 'Arrears tolerance',
    repaymentEvery: 'Repaid every',
    graceOnPrincipalAndInterestPayment: 'Moratorium',
    graceOnArrearsAgeing:
      'Number of days a loan may be overdue before moving into arrears',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel="Amortization*"
          selectPlaceholder="Select Amortization"
          selectValue={formData.amortizationType?.toString() ?? ''}
          selectOnChange={value =>
            onChange({
              ...formData,
              amortizationType: value === '' ? undefined : Number(value),
            })
          }
          selectOptions={Array.from(template.amortizationTypeOptions ?? [])
            .filter(opt => opt?.id != null && opt?.code != null)
            .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel="Interest Method*"
          selectPlaceholder="Select Interest Method"
          selectValue={formData.interestType?.toString() ?? ''}
          selectOnChange={value =>
            onChange({
              ...formData,
              interestType: value === '' ? undefined : Number(value),
            })
          }
          selectOptions={Array.from(template.interestTypeOptions ?? [])
            .filter(opt => opt?.id != null && opt?.code != null)
            .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
          selectClassname="flex-1 space-y-2"
        />
        <AppSelect
          selectLabel="Interest Calculation Period*"
          selectPlaceholder="Select Period"
          selectValue={formData.interestCalculationPeriodType?.toString() ?? ''}
          selectOnChange={value =>
            onChange({
              ...formData,
              interestCalculationPeriodType:
                value === '' ? undefined : Number(value),
            })
          }
          selectOptions={Array.from(
            template.interestCalculationPeriodTypeOptions ?? []
          )
            .filter(opt => opt?.id != null && opt?.code != null)
            .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="isEqualAmortization"
            checked={formData.isEqualAmortization ?? true}
            onCheckedChange={v =>
              onChange({ ...formData, isEqualAmortization: !!v })
            }
          />
          <Label
            htmlFor="isEqualAmortization"
            className="cursor-pointer font-normal"
          >
            Is Equal Amortization?
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="allowPartialPeriod"
            checked={allowPartialPeriod}
            onCheckedChange={v => setAllowPartialPeriod(!!v)}
          />
          <Label
            htmlFor="allowPartialPeriod"
            className="cursor-pointer font-normal"
          >
            Calculate interest for exact days in partial period
          </Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Loan Schedule</Label>
        <div className="flex flex-col md:flex-row gap-6">
          <AppSelect
            selectLabel="Loan Schedule Type*"
            selectPlaceholder="Select Loan Schedule Type"
            selectValue={formData.loanScheduleType ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, loanScheduleType: value })
            }
            selectOptions={(template.loanScheduleTypeOptions ?? [])
              .filter(opt => opt?.code != null && opt?.value != null)
              .map(opt => ({ id: opt.code ?? '', name: opt.value ?? '' }))}
            selectClassname="flex-1 space-y-2"
          />
          <AppSelect
            selectLabel="Repayment Strategy*"
            selectPlaceholder="Select Repayment Strategy"
            selectValue={formData.transactionProcessingStrategyCode ?? ''}
            selectOnChange={value =>
              onChange({
                ...formData,
                transactionProcessingStrategyCode: value,
              })
            }
            selectOptions={Array.from(
              template.transactionProcessingStrategyOptions ?? []
            )
              .filter(opt => opt?.code != null && opt?.name != null)
              .map(opt => ({ id: opt.code ?? '', name: opt.name ?? '' }))}
            selectClassname="flex-1 space-y-2"
          />
          <AppSelect
            selectLabel="Loan Schedule Processing Type"
            selectPlaceholder="Select Processing Type"
            selectValue={formData.loanScheduleProcessingType ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, loanScheduleProcessingType: value })
            }
            selectOptions={(template.loanScheduleProcessingTypeOptions ?? [])
              .filter(opt => opt?.code != null && opt?.value != null)
              .map(opt => ({ id: opt.code ?? '', name: opt.value ?? '' }))}
            selectClassname="flex-1 space-y-2"
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Loan Tranche Details</Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="multiDisburseLoan"
            checked={multiDisburseLoan}
            onCheckedChange={v => {
              setMultiDisburseLoan(!!v)
              onChange({ ...formData, multiDisburseLoan: !!v })
            }}
          />
          <Label
            htmlFor="multiDisburseLoan"
            className="cursor-pointer font-normal"
          >
            Enable Multiple Disbursals
          </Label>
        </div>

        {multiDisburseLoan && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted ml-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Maximum Tranche Count*</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.maxTrancheCount ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      maxTrancheCount:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Maximum Allowed Outstanding Balance</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.outstandingLoanBalance ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      outstandingLoanBalance:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="disallowExpectedDisbursements"
                  checked={formData.disallowExpectedDisbursements ?? false}
                  onCheckedChange={v =>
                    onChange({
                      ...formData,
                      disallowExpectedDisbursements: !!v,
                    })
                  }
                />
                <Label
                  htmlFor="disallowExpectedDisbursements"
                  className="cursor-pointer font-normal"
                >
                  Disallow Expected Disbursements
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Down Payment</Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="enableDownPayment"
            checked={enableDownPayment}
            onCheckedChange={v => {
              setEnableDownPayment(!!v)
              onChange({ ...formData, enableDownPayment: !!v })
            }}
          />
          <Label
            htmlFor="enableDownPayment"
            className="cursor-pointer font-normal"
          >
            Enable Down Payment
          </Label>
        </div>

        {enableDownPayment && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted ml-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Disbursed Amount Percentage for Down Payment (%)*</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={formData.disbursedAmountPercentageForDownPayment ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      disbursedAmountPercentageForDownPayment:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1 flex items-center gap-3 pt-6">
                <Checkbox
                  id="enableAutoRepaymentForDownPayment"
                  checked={formData.enableAutoRepaymentForDownPayment ?? false}
                  onCheckedChange={v =>
                    onChange({
                      ...formData,
                      enableAutoRepaymentForDownPayment: !!v,
                    })
                  }
                />
                <Label
                  htmlFor="enableAutoRepaymentForDownPayment"
                  className="cursor-pointer font-normal"
                >
                  Enable Auto Repayment for Down Payment
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Moratorium</Label>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Grace on Principal Payment</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.graceOnPrincipalPayment ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  graceOnPrincipalPayment:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Grace on Interest Payment</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.graceOnInterestPayment ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  graceOnInterestPayment:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label>Delinquency Bucket</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3 pt-6">
          <Checkbox
            id="enableInstallmentLevelDelinquency"
            checked={formData.enableInstallmentLevelDelinquency ?? false}
            onCheckedChange={v =>
              onChange({ ...formData, enableInstallmentLevelDelinquency: !!v })
            }
          />
          <Label
            htmlFor="enableInstallmentLevelDelinquency"
            className="cursor-pointer font-normal"
          >
            Enable Installment Level Delinquency
          </Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Interest Free Period</Label>
            <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
              Missing in OpenAPI
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Arrears Tolerance</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.inArrearsTolerance ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  inArrearsTolerance:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <AppSelect
            selectLabel="Days in Year*"
            selectPlaceholder="Select Days in Year"
            selectValue={formData.daysInYearType?.toString() ?? ''}
            selectOnChange={value =>
              onChange({
                ...formData,
                daysInYearType: value === '' ? undefined : Number(value),
              })
            }
            selectOptions={Array.from(template.daysInYearTypeOptions ?? [])
              .filter(opt => opt?.id != null && opt?.code != null)
              .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
            selectClassname="flex-1 space-y-2"
          />
          <AppSelect
            selectLabel="Days in Month*"
            selectPlaceholder="Select Days in Month"
            selectValue={formData.daysInMonthType?.toString() ?? ''}
            selectOnChange={value =>
              onChange({
                ...formData,
                daysInMonthType: value === '' ? undefined : Number(value),
              })
            }
            selectOptions={Array.from(template.daysInMonthTypeOptions ?? [])
              .filter(opt => opt?.id != null && opt?.value != null)
              .map(opt => ({ id: opt.id ?? 0, name: opt.value ?? '' }))}
            selectClassname="flex-1 space-y-2"
          />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="canDefineInstallmentAmount"
            checked={formData.canDefineInstallmentAmount ?? false}
            onCheckedChange={v =>
              onChange({ ...formData, canDefineInstallmentAmount: !!v })
            }
          />
          <Label
            htmlFor="canDefineInstallmentAmount"
            className="cursor-pointer font-normal"
          >
            Allow fixing of the installment amount
          </Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label className="font-semibold leading-snug">
              Number of days a loan may be overdue before moving into arrears
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.graceOnArrearsAgeing ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  graceOnArrearsAgeing:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="font-semibold leading-snug">
              Maximum number of days a loan may be overdue before becoming a NPA
              (non performing asset)
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.overdueDaysForNPA ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  overdueDaysForNPA:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="accountMovesOutOfNPA"
              checked={
                formData.accountMovesOutOfNPAOnlyOnArrearsCompletion ?? false
              }
              onCheckedChange={v =>
                onChange({
                  ...formData,
                  accountMovesOutOfNPAOnlyOnArrearsCompletion: !!v,
                })
              }
            />
            <Label
              htmlFor="accountMovesOutOfNPA"
              className="cursor-pointer font-normal"
            >
              Account moves out of NPA only after all arrears have been cleared
            </Label>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-1/2">
            <Label>Principal Threshold (%) for Last Instalment</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.principalThresholdForLastInstallment ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  principalThresholdForLastInstallment:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-3">
            <Checkbox
              id="allowVariableInstallments"
              checked={allowVariableInstallments}
              onCheckedChange={v => {
                setAllowVariableInstallments(!!v)
                onChange({ ...formData, allowVariableInstallments: !!v })
              }}
            />
            <Label
              htmlFor="allowVariableInstallments"
              className="cursor-pointer font-normal"
            >
              Are Variable Installments allowed?
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="canUseForTopup"
              checked={formData.canUseForTopup ?? false}
              onCheckedChange={v =>
                onChange({ ...formData, canUseForTopup: !!v })
              }
            />
            <Label
              htmlFor="canUseForTopup"
              className="cursor-pointer font-normal"
            >
              Allowed to be used for providing Top Up Loans
            </Label>
          </div>
        </div>

        {allowVariableInstallments && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted ml-3">
            <Label className="text-base font-semibold">
              Variable Installments
            </Label>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Minimum gap between Installments*</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={variableInstallmentMinGap ?? ''}
                  onChange={e =>
                    setVariableInstallmentMinGap(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Maximum gap between Installments*</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={variableInstallmentMaxGap ?? ''}
                  onChange={e =>
                    setVariableInstallmentMaxGap(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">
          Interest Recalculation
        </Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="isInterestRecalculationEnabled"
            checked={isInterestRecalculationEnabled}
            onCheckedChange={v => {
              setIsInterestRecalculationEnabled(!!v)
              onChange({ ...formData, isInterestRecalculationEnabled: !!v })
            }}
          />
          <Label
            htmlFor="isInterestRecalculationEnabled"
            className="cursor-pointer font-normal"
          >
            Recalculate Interest
          </Label>
        </div>

        {isInterestRecalculationEnabled && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted ml-3">
            <div className="flex flex-col md:flex-row gap-6">
              <AppSelect
                selectLabel="Pre-closure Interest Calculation Rule*"
                selectPlaceholder="Select Rule"
                selectValue={
                  formData.preClosureInterestCalculationStrategy?.toString() ??
                  ''
                }
                selectOnChange={value =>
                  onChange({
                    ...formData,
                    preClosureInterestCalculationStrategy:
                      value === '' ? undefined : Number(value),
                  })
                }
                selectOptions={Array.from(
                  template.preClosureInterestCalculationStrategyOptions ?? []
                )
                  .filter(opt => opt?.id != null && opt?.code != null)
                  .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
                selectClassname="flex-1 space-y-2"
              />
              <AppSelect
                selectLabel="Advance Payments Adjustment Type*"
                selectPlaceholder="Select Type"
                selectValue={
                  formData.rescheduleStrategyMethod?.toString() ?? ''
                }
                selectOnChange={value =>
                  onChange({
                    ...formData,
                    rescheduleStrategyMethod:
                      value === '' ? undefined : Number(value),
                  })
                }
                selectOptions={Array.from(
                  template.rescheduleStrategyTypeOptions ?? []
                )
                  .filter(opt => opt?.id != null && opt?.code != null)
                  .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
                selectClassname="flex-1 space-y-2"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <AppSelect
                selectLabel="Interest Recalculation Compounding On*"
                selectPlaceholder="Select Compounding"
                selectValue={
                  formData.interestRecalculationCompoundingMethod?.toString() ??
                  ''
                }
                selectOnChange={value =>
                  onChange({
                    ...formData,
                    interestRecalculationCompoundingMethod:
                      value === '' ? undefined : Number(value),
                  })
                }
                selectOptions={Array.from(
                  template.interestRecalculationCompoundingTypeOptions ?? []
                )
                  .filter(opt => opt?.id != null && opt?.code != null)
                  .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
                selectClassname="flex-1 space-y-2"
              />
              <AppSelect
                selectLabel="Frequency for Recalculate Outstanding Principal*"
                selectPlaceholder="Select Frequency"
                selectValue={
                  formData.recalculationRestFrequencyType?.toString() ?? ''
                }
                selectOnChange={value =>
                  onChange({
                    ...formData,
                    recalculationRestFrequencyType:
                      value === '' ? undefined : Number(value),
                  })
                }
                selectOptions={Array.from(
                  template.interestRecalculationFrequencyTypeOptions ?? []
                )
                  .filter(opt => opt?.id != null && opt?.code != null)
                  .map(opt => ({ id: opt.id ?? 0, name: opt.code ?? '' }))}
                selectClassname="flex-1 space-y-2"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Frequency Interval for Compounding</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={
                    formData.recalculationCompoundingFrequencyInterval ?? ''
                  }
                  onChange={e =>
                    onChange({
                      ...formData,
                      recalculationCompoundingFrequencyInterval:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Frequency Interval for Recalculation</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.recalculationRestFrequencyInterval ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      recalculationRestFrequencyInterval:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isArrearsBasedOnOriginalSchedule"
                  checked={formData.isArrearsBasedOnOriginalSchedule ?? false}
                  onCheckedChange={v =>
                    onChange({
                      ...formData,
                      isArrearsBasedOnOriginalSchedule: !!v,
                    })
                  }
                />
                <Label
                  htmlFor="isArrearsBasedOnOriginalSchedule"
                  className="cursor-pointer font-normal"
                >
                  Is Arrears recognition based on original schedule?
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="disallowInterestCalculationOnPastDue"
                  checked={
                    formData.disallowInterestCalculationOnPastDue ?? false
                  }
                  onCheckedChange={v =>
                    onChange({
                      ...formData,
                      disallowInterestCalculationOnPastDue: !!v,
                    })
                  }
                />
                <Label
                  htmlFor="disallowInterestCalculationOnPastDue"
                  className="cursor-pointer font-normal"
                >
                  Do not calculate interest on past due principal balances
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">
          Guarantee Requirements
        </Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="holdGuaranteeFunds"
            checked={holdGuaranteeFunds}
            onCheckedChange={v => {
              setHoldGuaranteeFunds(!!v)
              onChange({ ...formData, holdGuaranteeFunds: !!v })
            }}
          />
          <Label
            htmlFor="holdGuaranteeFunds"
            className="cursor-pointer font-normal"
          >
            Place Guarantee Funds On-Hold
          </Label>
        </div>

        {holdGuaranteeFunds && (
          <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted ml-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Mandatory Guarantee (%)*</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={mandatoryGuarantee ?? ''}
                  onChange={e =>
                    setMandatoryGuarantee(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Minimum Guarantee from Own Funds (%)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minGuaranteeFromOwnFunds ?? ''}
                  onChange={e =>
                    setMinGuaranteeFromOwnFunds(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Minimum Guarantee from Guarantor Funds (%)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minGuaranteeFromGuarantor ?? ''}
                  onChange={e =>
                    setMinGuaranteeFromGuarantor(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Event Settings</Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="useDueForRepaymentsConfigurations"
            checked={useDueForRepaymentsConfigurations}
            onCheckedChange={v => setUseDueForRepaymentsConfigurations(!!v)}
          />
          <Label
            htmlFor="useDueForRepaymentsConfigurations"
            className="cursor-pointer font-normal"
          >
            Use the Global Configurations values to the Repayment Event
            (notifications)
          </Label>
        </div>

        {!useDueForRepaymentsConfigurations && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label>Due days for repayment event</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={formData.dueDaysForRepaymentEvent ?? ''}
                onChange={e =>
                  onChange({
                    ...formData,
                    dueDaysForRepaymentEvent:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>OverDue days for repayment event</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={formData.overDueDaysForRepaymentEvent ?? ''}
                onChange={e =>
                  onChange({
                    ...formData,
                    overDueDaysForRepaymentEvent:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">
          Configurable Terms and Settings
        </Label>
        <div className="flex items-center gap-3">
          <Checkbox
            id="allowAttributeConfiguration"
            checked={allowAttributeConfiguration}
            onCheckedChange={v => setAllowAttributeConfiguration(!!v)}
          />
          <Label
            htmlFor="allowAttributeConfiguration"
            className="cursor-pointer font-normal"
          >
            Allow overriding select terms and settings in loan accounts
          </Label>
        </div>

        {allowAttributeConfiguration && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-muted ml-3">
            {Object.entries(attributeOverrides).map(([id, checked]) => (
              <div key={id} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={v => {
                    const updated = { ...attributeOverrides, [id]: !!v }
                    setAttributeOverrides(updated)
                    onChange({ ...formData, allowAttributeOverrides: updated })
                  }}
                />
                <Label htmlFor={id} className="cursor-pointer font-normal">
                  {labelMap[id]}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoanProductSettingsStep
