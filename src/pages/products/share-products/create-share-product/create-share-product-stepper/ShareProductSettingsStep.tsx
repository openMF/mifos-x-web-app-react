/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSelect from '@/components/custom/select/AppSelect'
import {
  toOptionalNumber,
  toSelectOptions,
  type FormUpdater,
  type ShareProductForm,
  type ShareProductTemplate,
} from '../share-product-form'

interface ShareProductSettingsStepProps {
  form: ShareProductForm
  update: FormUpdater
  template?: ShareProductTemplate
}

type NumberKey =
  | 'minimumShares'
  | 'nominalShares'
  | 'maximumShares'
  | 'minimumActivePeriodForDividends'
  | 'lockinPeriodFrequency'

/** A select item cannot hold an empty value, so "none" has its own */
const NO_LOCKIN = 'none'

const ShareProductSettingsStep = ({
  form,
  update,
  template,
}: ShareProductSettingsStepProps) => {
  const { t } = useTranslation('products')

  const renderNumberInput = (key: NumberKey, label: string) => (
    <div className="flex-1 space-y-2">
      <Label htmlFor={`sp-${key}`}>{label}</Label>
      <Input
        id={`sp-${key}`}
        type="number"
        min={1}
        step={1}
        value={form[key] ?? ''}
        onChange={e => update({ [key]: toOptionalNumber(e.target.value) })}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold">
        {t('createShareProduct.settings.sharesPerClient')}
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        {renderNumberInput(
          'minimumShares',
          t('createShareProduct.settings.minimumShares')
        )}
        {renderNumberInput(
          'nominalShares',
          t('createShareProduct.settings.nominalShares')
        )}
        {renderNumberInput(
          'maximumShares',
          t('createShareProduct.settings.maximumShares')
        )}
      </div>

      <h3 className="font-semibold border-t pt-4">
        {t('createShareProduct.settings.minimumActivePeriod')}
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        {renderNumberInput(
          'minimumActivePeriodForDividends',
          t('createShareProduct.settings.frequency')
        )}
        <AppSelect
          selectLabel={t('createShareProduct.settings.type')}
          selectPlaceholder={t('createShareProduct.select')}
          selectValue={form.minimumactiveperiodFrequencyType?.toString() ?? ''}
          selectOnChange={val =>
            update({ minimumactiveperiodFrequencyType: Number(val) })
          }
          selectOptions={toSelectOptions(
            template?.minimumActivePeriodFrequencyTypeOptions
          )}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <h3 className="font-semibold border-t pt-4">
        {t('createShareProduct.settings.lockinPeriod')}
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        {renderNumberInput(
          'lockinPeriodFrequency',
          t('createShareProduct.settings.frequency')
        )}
        <AppSelect
          selectLabel={t('createShareProduct.settings.type')}
          selectPlaceholder={t('createShareProduct.select')}
          selectValue={form.lockinPeriodFrequencyType?.toString() ?? ''}
          selectOnChange={val =>
            // the lock-in period is optional, so "none" clears both values
            update(
              val === NO_LOCKIN
                ? {
                    lockinPeriodFrequency: undefined,
                    lockinPeriodFrequencyType: undefined,
                  }
                : { lockinPeriodFrequencyType: Number(val) }
            )
          }
          selectOptions={[
            {
              id: NO_LOCKIN,
              name: t('createShareProduct.settings.noLockinPeriod'),
            },
            ...toSelectOptions(template?.lockinPeriodFrequencyTypeOptions),
          ]}
          selectClassname="flex-1 space-y-2"
        />
      </div>

      <div className="flex items-center gap-3 border-t pt-4">
        <Checkbox
          id="sp-allow-dividends-inactive"
          checked={form.allowDividendCalculationForInactiveClients}
          onCheckedChange={checked =>
            update({
              allowDividendCalculationForInactiveClients: checked === true,
            })
          }
        />
        <Label
          htmlFor="sp-allow-dividends-inactive"
          className="cursor-pointer font-normal"
        >
          {t('createShareProduct.settings.allowDividendsForInactiveClients')}
        </Label>
      </div>
    </div>
  )
}

export default ShareProductSettingsStep
