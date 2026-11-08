/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import NumberField from './NumberField'
import {
  MATURITY_TRANSFER_TO_SAVINGS,
  toSelectOptions,
  type EnumOption,
  type FixedDepositAccountStepProps,
} from '../fixed-deposit-account-form'

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex-1 space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{value}</p>
  </div>
)

const FixedDepositAccountSettingsStep = ({
  formData,
  onChange,
  productTemplate,
}: FixedDepositAccountStepProps) => {
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const period = (value?: number, type?: EnumOption) =>
    value === undefined || value === null
      ? tc('actions.na')
      : `${value} ${type?.value ?? ''}`.trim()

  const savingsAccountOptions = (productTemplate?.savingsAccounts ?? []).map(
    account => ({
      id: account.id.toString(),
      name: [account.accountNo, account.savingsProductName]
        .filter(Boolean)
        .join(' - '),
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold">
        {t('fixedDepositApplication.headings.lockinPeriod')}
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        <NumberField
          id="fd-lockin-period"
          label={t('fixedDepositApplication.fields.frequency')}
          value={formData.lockinPeriodFrequency}
          onChange={value =>
            onChange({ ...formData, lockinPeriodFrequency: value })
          }
        />
        <AppSelect
          selectLabel={t('fixedDepositApplication.fields.type')}
          selectPlaceholder={t('fixedDepositApplication.select')}
          selectValue={formData.lockinPeriodFrequencyType?.toString() ?? ''}
          selectOnChange={value =>
            onChange({ ...formData, lockinPeriodFrequencyType: Number(value) })
          }
          selectOptions={toSelectOptions(
            productTemplate?.lockinPeriodFrequencyTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('fixedDepositApplication.headings.depositTerm')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('fixedDepositApplication.fromProduct')}
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <ReadOnlyField
            label={t('fixedDepositApplication.fields.minDepositTerm')}
            value={period(
              productTemplate?.minDepositTerm,
              productTemplate?.minDepositTermType
            )}
          />
          <ReadOnlyField
            label={t('fixedDepositApplication.fields.inMultiplesOfDepositTerm')}
            value={period(
              productTemplate?.inMultiplesOfDepositTerm,
              productTemplate?.inMultiplesOfDepositTermType
            )}
          />
          <ReadOnlyField
            label={t('fixedDepositApplication.fields.maxDepositTerm')}
            value={period(
              productTemplate?.maxDepositTerm,
              productTemplate?.maxDepositTermType
            )}
          />
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <h3 className="font-semibold">
          {t('fixedDepositApplication.headings.preClosure')}
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <ReadOnlyField
            label={t(
              'fixedDepositApplication.fields.preClosurePenalApplicable'
            )}
            value={
              productTemplate?.preClosurePenalApplicable
                ? tc('actions.yes')
                : tc('actions.no')
            }
          />
          {productTemplate?.preClosurePenalApplicable && (
            <>
              <ReadOnlyField
                label={t('fixedDepositApplication.fields.penalInterest')}
                value={`${productTemplate.preClosurePenalInterest ?? 0}%`}
              />
              <ReadOnlyField
                label={t('fixedDepositApplication.fields.penalInterestOn')}
                value={
                  productTemplate.preClosurePenalInterestOnType?.value ??
                  tc('actions.na')
                }
              />
            </>
          )}
        </div>
      </div>

      {productTemplate?.withHoldTax && (
        <div className="border-t pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="fd-withhold-tax"
              checked={formData.withHoldTax}
              onCheckedChange={checked =>
                onChange({ ...formData, withHoldTax: !!checked })
              }
            />
            <Label
              htmlFor="fd-withhold-tax"
              className="cursor-pointer font-normal"
            >
              {t('fixedDepositApplication.fields.withHoldTax')}
            </Label>
          </div>
          {formData.withHoldTax && (
            <ReadOnlyField
              label={t('fixedDepositApplication.fields.taxGroup')}
              value={productTemplate.taxGroup?.name ?? tc('actions.na')}
            />
          )}
        </div>
      )}

      <div className="border-t pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="fd-transfer-interest"
            checked={formData.transferInterestToSavings}
            onCheckedChange={checked =>
              onChange({
                ...formData,
                transferInterestToSavings: !!checked,
                linkAccountId: checked ? formData.linkAccountId : undefined,
              })
            }
          />
          <Label
            htmlFor="fd-transfer-interest"
            className="cursor-pointer font-normal"
          >
            {t('fixedDepositApplication.fields.transferInterestToSavings')}
          </Label>
        </div>
        {formData.transferInterestToSavings && (
          <AppSelect
            selectLabel={`${t('fixedDepositApplication.fields.linkedSavingsAccount')}*`}
            selectPlaceholder={t('fixedDepositApplication.select')}
            selectValue={formData.linkAccountId?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, linkAccountId: Number(value) })
            }
            selectOptions={savingsAccountOptions}
            selectEmptyMessage={t('fixedDepositApplication.noSavingsAccounts')}
          />
        )}
        {formData.transferInterestToSavings && (
          <p className="text-sm text-muted-foreground">
            {t('fixedDepositApplication.linkedAccountFundsDeposit')}
          </p>
        )}
      </div>

      <div className="border-t pt-4 flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={t('fixedDepositApplication.fields.maturityInstruction')}
          selectPlaceholder={t('fixedDepositApplication.select')}
          selectValue={formData.maturityInstructionId?.toString() ?? ''}
          selectOnChange={value =>
            onChange({ ...formData, maturityInstructionId: Number(value) })
          }
          selectOptions={toSelectOptions(
            productTemplate?.maturityInstructionOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
        {formData.maturityInstructionId === MATURITY_TRANSFER_TO_SAVINGS && (
          <AppSelect
            selectLabel={`${t('fixedDepositApplication.fields.transferToSavings')}*`}
            selectPlaceholder={t('fixedDepositApplication.select')}
            selectValue={formData.transferToSavingsId?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, transferToSavingsId: Number(value) })
            }
            selectOptions={savingsAccountOptions}
            selectClassname="flex-1 space-y-2"
            selectEmptyMessage={t('fixedDepositApplication.noSavingsAccounts')}
          />
        )}
      </div>
    </div>
  )
}

export default FixedDepositAccountSettingsStep
