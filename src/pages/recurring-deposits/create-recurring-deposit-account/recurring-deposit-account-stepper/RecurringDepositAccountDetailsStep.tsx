/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import { todayInputValue } from '@/lib/date-utils'
import type {
  RecurringDepositAccountStepProps,
  RecurringDepositAccountTemplate,
} from '../recurring-deposit-account-form'

type DetailsStepProps = RecurringDepositAccountStepProps & {
  /** The client template, which lists the products */
  template: RecurringDepositAccountTemplate
  onProductChange: (productId: number) => void
  loadingProduct: boolean
}

const RecurringDepositAccountDetailsStep = ({
  formData,
  onChange,
  template,
  productTemplate,
  onProductChange,
  loadingProduct,
}: DetailsStepProps) => {
  const { t } = useTranslation('clients')

  const productOptions = (template.productOptions ?? []).map(product => ({
    id: product.id.toString(),
    name: product.name ?? product.id.toString(),
  }))
  const fieldOfficerOptions = (productTemplate?.fieldOfficerOptions ?? []).map(
    officer => ({
      id: officer.id.toString(),
      name: officer.displayName ?? officer.id.toString(),
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <AppSelect
          selectLabel={`${t('recurringDepositApplication.fields.product')}*`}
          selectPlaceholder={t('recurringDepositApplication.select')}
          selectValue={formData.productId?.toString() ?? ''}
          selectOnChange={value => onProductChange(Number(value))}
          selectOptions={productOptions}
          selectClassname="flex-1 space-y-2"
          selectEmptyMessage={t('recurringDepositApplication.noProducts')}
        />
        <div className="flex-1 space-y-2">
          <Label htmlFor="rd-submitted-on">
            {`${t('recurringDepositApplication.fields.submittedOn')}*`}
          </Label>
          <Input
            id="rd-submitted-on"
            type="date"
            max={todayInputValue()}
            value={formData.submittedOnDate}
            onChange={e =>
              onChange({ ...formData, submittedOnDate: e.target.value })
            }
          />
        </div>
      </div>

      {loadingProduct && (
        <p className="text-sm text-muted-foreground">
          {t('recurringDepositApplication.loadingProduct')}
        </p>
      )}

      {productTemplate && (
        <div className="flex flex-col md:flex-row gap-6">
          <AppSelect
            selectLabel={t('recurringDepositApplication.fields.fieldOfficer')}
            selectPlaceholder={t('recurringDepositApplication.select')}
            selectValue={formData.fieldOfficerId?.toString() ?? ''}
            selectOnChange={value =>
              onChange({ ...formData, fieldOfficerId: Number(value) })
            }
            selectOptions={fieldOfficerOptions}
            selectClassname="flex-1 space-y-2"
            selectEmptyMessage={t(
              'recurringDepositApplication.noFieldOfficers'
            )}
          />
          <div className="flex-1 space-y-2">
            <Label htmlFor="rd-external-id">
              {t('recurringDepositApplication.fields.externalId')}
            </Label>
            <Input
              id="rd-external-id"
              value={formData.externalId}
              onChange={e =>
                onChange({ ...formData, externalId: e.target.value })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default RecurringDepositAccountDetailsStep
