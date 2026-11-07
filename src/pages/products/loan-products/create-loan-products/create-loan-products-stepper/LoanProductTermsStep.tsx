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

interface LoanProductTermsStepProps {
  formData: PostLoanProductsRequest
  onChange: (data: PostLoanProductsRequest) => void
  template: GetLoanProductsTemplateResponse
}

const LoanProductTermsStep = ({
  formData,
  onChange,
  template,
}: LoanProductTermsStepProps) => {
  //local UI state
  const [
    allowApprovedDisbursedAmountsOverApplied,
    setAllowApprovedDisbursedAmountsOverApplied,
  ] = useState(false)
  const [isZeroInterest, setIsZeroInterest] = useState(false)
  const [isLinkedToFloatingInterestRates, setIsLinkedToFloatingInterestRates] =
    useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Principal</Label>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Minimum</Label>
            <Input
              type="number"
              min={1}
              step={0.01}
              placeholder="0"
              value={formData.minPrincipal ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  minPrincipal:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Default*</Label>
            <Input
              type="number"
              min={1}
              step={0.01}
              placeholder="0"
              value={formData.principal ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  principal:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Maximum</Label>
            <Input
              type="number"
              min={1}
              step={0.01}
              placeholder="0"
              value={formData.maxPrincipal ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  maxPrincipal:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="allowApprovedDisbursedAmountsOverApplied"
            checked={allowApprovedDisbursedAmountsOverApplied}
            onCheckedChange={v => {
              setAllowApprovedDisbursedAmountsOverApplied(!!v)
              onChange({
                ...formData,
                allowApprovedDisbursedAmountsOverApplied: !!v,
              })
            }}
          />
          <Label
            htmlFor="allowApprovedDisbursedAmountsOverApplied"
            className="cursor-pointer font-normal"
          >
            Allow approval / disbursal above loan applied amount
          </Label>
        </div>

        {allowApprovedDisbursedAmountsOverApplied && (
          <div className="flex flex-col md:flex-row gap-6 pl-6 border-l-2 border-muted ml-3">
            <div className="flex-1 space-y-2">
              <Label>Over Amount Calculation Type*</Label>
              <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
                Missing in OpenAPI
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Over Amount*</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={formData.overAppliedNumber ?? ''}
                onChange={e =>
                  onChange({
                    ...formData,
                    overAppliedNumber:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-2 w-full md:w-1/2">
          <Label>Installment day calculation from</Label>
          <AppSelect
            selectLabel=""
            selectPlaceholder="Select type"
            selectValue={formData.repaymentStartDateType?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, repaymentStartDateType: Number(value) })
            }
            selectOptions={Array.from(
              template.repaymentStartDateTypeOptions ?? []
            )
              .filter(
                (opt): opt is { id: number; code: string } =>
                  opt.id != null && opt.code != null
              )
              .map(opt => ({
                id: opt.id,
                name: opt.code,
              }))}
            selectClassname="w-full space-y-0"
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Number of Repayments</Label>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Minimum</Label>
            <Input
              type="number"
              min={1}
              placeholder="0"
              value={formData.minNumberOfRepayments ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  minNumberOfRepayments:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Default*</Label>
            <Input
              type="number"
              min={1}
              placeholder="0"
              value={formData.numberOfRepayments ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  numberOfRepayments:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Maximum</Label>
            <Input
              type="number"
              min={1}
              placeholder="0"
              value={formData.maxNumberOfRepayments ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  maxNumberOfRepayments:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <Checkbox
          id="interestRecognitionOnDisbursementDate"
          checked={formData.interestRecognitionOnDisbursementDate ?? false}
          onCheckedChange={v =>
            onChange({
              ...formData,
              interestRecognitionOnDisbursementDate: !!v,
            })
          }
        />
        <Label
          htmlFor="interestRecognitionOnDisbursementDate"
          className="cursor-pointer font-normal"
        >
          Is interest recognition on disbursement date?
        </Label>
      </div>

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Interest Rates</Label>
        <div className="flex flex-col md:flex-row gap-6">
          {!isLinkedToFloatingInterestRates && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="isZeroInterest"
                checked={isZeroInterest}
                onCheckedChange={v => setIsZeroInterest(!!v)}
              />
              <Label
                htmlFor="isZeroInterest"
                className="cursor-pointer font-normal"
              >
                Is Zero Interest Rate?
              </Label>
            </div>
          )}
          {!isZeroInterest && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="isLinkedToFloatingInterestRates"
                checked={isLinkedToFloatingInterestRates}
                onCheckedChange={v => {
                  setIsLinkedToFloatingInterestRates(!!v)
                  onChange({
                    ...formData,
                    isLinkedToFloatingInterestRates: !!v,
                  })
                }}
              />
              <Label
                htmlFor="isLinkedToFloatingInterestRates"
                className="cursor-pointer font-normal"
              >
                Is Linked to floating interest rates?
              </Label>
            </div>
          )}
        </div>

        {!isLinkedToFloatingInterestRates && (
          <div className="flex flex-col gap-4">
            <Label className="font-semibold">Nominal Interest Rate</Label>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <Label>Minimum</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.000001}
                  placeholder="0"
                  disabled={isZeroInterest}
                  value={formData.minInterestRatePerPeriod ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      minInterestRatePerPeriod:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Default*</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.000001}
                  placeholder="0"
                  disabled={isZeroInterest}
                  value={formData.interestRatePerPeriod ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      interestRatePerPeriod:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Maximum</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.000001}
                  placeholder="0"
                  disabled={isZeroInterest}
                  value={formData.maxInterestRatePerPeriod ?? ''}
                  onChange={e =>
                    onChange({
                      ...formData,
                      maxInterestRatePerPeriod:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <AppSelect
                selectLabel="Frequency*"
                selectPlaceholder="Select Frequency"
                selectValue={
                  formData.interestRateFrequencyType?.toString() ?? ''
                }
                selectOnChange={value =>
                  onChange({
                    ...formData,
                    interestRateFrequencyType: Number(value),
                  })
                }
                selectOptions={Array.from(
                  template.interestRateFrequencyTypeOptions ?? []
                )
                  .filter(
                    (opt): opt is { id: number; code: string } =>
                      opt.id != null && opt.code != null
                  )
                  .map(opt => ({
                    id: opt.id,
                    name: opt.code,
                  }))}
                selectClassname="flex-1 space-y-2"
              />
            </div>
          </div>
        )}

        {isLinkedToFloatingInterestRates && !isZeroInterest && (
          <div className="flex flex-col gap-4">
            <Label className="font-semibold">Floating Interest Rate</Label>
            <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
              Missing in OpenAPI
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Variations</Label>
        <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
          Broken in web app
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Label className="text-base font-semibold">Repaid Every</Label>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <Label>Frequency*</Label>
            <Input
              type="number"
              min={1}
              placeholder="1"
              value={formData.repaymentEvery ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  repaymentEvery:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <AppSelect
            selectLabel="Frequency Type*"
            selectPlaceholder="Select Frequency Type"
            selectValue={formData.repaymentFrequencyType?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, repaymentFrequencyType: Number(value) })
            }
            selectOptions={Array.from(
              template.repaymentFrequencyTypeOptions ?? []
            )
              .filter(
                (opt): opt is { id: number; code: string } =>
                  opt.id != null && opt.code != null
              )
              .map(opt => ({
                id: opt.id,
                name: opt.code,
              }))}
            selectClassname="flex-1 space-y-2"
          />
          <div className="flex-1 space-y-2">
            <Label>Fixed Length</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.fixedLength ?? ''}
              onChange={e =>
                onChange({
                  ...formData,
                  fixedLength:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="space-y-2 w-full md:w-1/2">
          <Label>Minimum days between disbursal and first repayment date</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={formData.minimumDaysBetweenDisbursalAndFirstRepayment ?? ''}
            onChange={e =>
              onChange({
                ...formData,
                minimumDaysBetweenDisbursalAndFirstRepayment:
                  e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

export default LoanProductTermsStep
