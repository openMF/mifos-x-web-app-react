/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date-utils'
import {
  MATURITY_TRANSFER_TO_SAVINGS,
  inputDateParts,
  type EnumOption,
  type FieldLabelKey,
  type FixedDepositAccountStepProps,
  type FixedDepositAccountTemplate,
} from '../fixed-deposit-account-form'

type PreviewStepProps = FixedDepositAccountStepProps & {
  template: FixedDepositAccountTemplate
}

const FixedDepositAccountPreviewStep = ({
  formData,
  template,
  productTemplate,
}: PreviewStepProps) => {
  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const field = (name: FieldLabelKey) =>
    t(`fixedDepositApplication.fields.${name}`)

  const optionName = (options: EnumOption[] | undefined, id?: number) =>
    options?.find(option => option.id === id)?.value
  const savingsAccountName = (id?: number) => {
    const account = productTemplate?.savingsAccounts?.find(a => a.id === id)
    return account
      ? [account.accountNo, account.savingsProductName]
          .filter(Boolean)
          .join(' - ')
      : undefined
  }
  const withPeriod = (value?: number, typeName?: string) =>
    value === undefined ? undefined : `${value} ${typeName ?? ''}`.trim()

  const sections: {
    title: string
    rows: [string, string | number | undefined][]
  }[] = [
    {
      title: t('fixedDepositApplication.steps.details'),
      rows: [
        [
          field('product'),
          template.productOptions?.find(p => p.id === formData.productId)?.name,
        ],
        [
          field('submittedOn'),
          formatDate(inputDateParts(formData.submittedOnDate), i18n.language),
        ],
        [
          field('fieldOfficer'),
          productTemplate?.fieldOfficerOptions?.find(
            officer => officer.id === formData.fieldOfficerId
          )?.displayName,
        ],
        [field('externalId'), formData.externalId.trim()],
      ],
    },
    {
      title: t('fixedDepositApplication.steps.terms'),
      rows: [
        [field('currency'), productTemplate?.currency?.code],
        [field('depositAmount'), formData.depositAmount],
        [
          field('depositPeriod'),
          withPeriod(
            formData.depositPeriod,
            optionName(
              productTemplate?.periodFrequencyTypeOptions,
              formData.depositPeriodFrequencyId
            )
          ),
        ],
        [
          field('interestCompoundingPeriod'),
          optionName(
            productTemplate?.interestCompoundingPeriodTypeOptions,
            formData.interestCompoundingPeriodType
          ),
        ],
        [
          field('interestPostingPeriod'),
          optionName(
            productTemplate?.interestPostingPeriodTypeOptions,
            formData.interestPostingPeriodType
          ),
        ],
        [
          field('interestCalculatedUsing'),
          optionName(
            productTemplate?.interestCalculationTypeOptions,
            formData.interestCalculationType
          ),
        ],
        [
          field('daysInYear'),
          optionName(
            productTemplate?.interestCalculationDaysInYearTypeOptions,
            formData.interestCalculationDaysInYearType
          ),
        ],
      ],
    },
    {
      title: t('fixedDepositApplication.steps.settings'),
      rows: [
        [
          t('fixedDepositApplication.headings.lockinPeriod'),
          withPeriod(
            formData.lockinPeriodFrequency,
            optionName(
              productTemplate?.lockinPeriodFrequencyTypeOptions,
              formData.lockinPeriodFrequencyType
            )
          ),
        ],
        ...(productTemplate?.withHoldTax
          ? ([
              [
                field('withHoldTax'),
                formData.withHoldTax ? tc('actions.yes') : tc('actions.no'),
              ],
            ] as [string, string][])
          : []),
        [
          field('transferInterestToSavings'),
          formData.transferInterestToSavings
            ? tc('actions.yes')
            : tc('actions.no'),
        ],
        [
          field('linkedSavingsAccount'),
          formData.transferInterestToSavings
            ? savingsAccountName(formData.linkAccountId)
            : undefined,
        ],
        [
          field('maturityInstruction'),
          optionName(
            productTemplate?.maturityInstructionOptions,
            formData.maturityInstructionId
          ),
        ],
        [
          field('transferToSavings'),
          formData.maturityInstructionId === MATURITY_TRANSFER_TO_SAVINGS
            ? savingsAccountName(formData.transferToSavingsId)
            : undefined,
        ],
      ],
    },
    {
      title: t('fixedDepositApplication.steps.interestRateChart'),
      rows: [[field('name'), productTemplate?.accountChart?.name]],
    },
    {
      title: t('fixedDepositApplication.steps.charges'),
      rows:
        formData.charges.length === 0
          ? [[t('fixedDepositApplication.steps.charges'), tc('actions.na')]]
          : formData.charges.map(charge => [
              charge.name ?? String(charge.chargeId),
              [
                charge.amount,
                charge.timeType?.value,
                charge.dueDate &&
                  formatDate(inputDateParts(charge.dueDate), i18n.language),
              ]
                .filter(part => part !== undefined && part !== '')
                .join(' · '),
            ]),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {sections.map(section => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="font-semibold border-b pb-1">{section.title}</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {section.rows
              .filter(([, value]) => value !== undefined && value !== '')
              .map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="font-medium">{label}:</dt>
                  <dd className="text-muted-foreground">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

export default FixedDepositAccountPreviewStep
