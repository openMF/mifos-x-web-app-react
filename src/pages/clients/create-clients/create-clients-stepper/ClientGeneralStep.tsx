/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'
import { todayInputValue } from '@/lib/date-utils'
import type {
  ExtendedClientTemplate,
  ExtendedPostClientsRequest,
} from '@/pages/clients/types'

/** Fineract legal form ids, from the clientLegalFormOptions template */
const LEGAL_FORM_PERSON = 1
const LEGAL_FORM_ENTITY = 2

/** Clears an optional select; Radix Select cannot select an empty value */
const NONE_OPTION_ID = 'none'

interface ClientGeneralStepProps {
  formData: ExtendedPostClientsRequest
  onChange: (data: ExtendedPostClientsRequest) => void
  template: ExtendedClientTemplate
}

const ClientGeneralStep = ({
  formData,
  onChange,
  template,
}: ClientGeneralStepProps) => {
  const { t } = useTranslation('clients')

  const handleChange = (
    field: keyof ExtendedPostClientsRequest,
    value: string | number | boolean | undefined
  ) => {
    onChange({ ...formData, [field]: value })
  }

  /**
   * Code values and staff come from the template (staff is generated as a
   * Set). These fields are optional, so a None entry lets the user clear an
   * accidental pick; a Radix select has no empty value of its own.
   */
  const toOptions = (
    options: Iterable<{ id?: number; name?: string; displayName?: string }> = []
  ) => [
    { id: NONE_OPTION_ID, name: t('form.none') },
    ...Array.from(options).map(o => ({
      id: o.id ?? 0,
      name: o.name ?? o.displayName ?? '',
    })),
  ]

  /** None (or no pick) sends nothing for the field */
  const handleIdChange =
    (field: keyof ExtendedPostClientsRequest) => (value: string) =>
      handleChange(
        field,
        value && value !== NONE_OPTION_ID ? Number(value) : undefined
      )

  const handleActiveChange = (active: boolean) => {
    onChange({
      ...formData,
      active,
      activationDate: active ? formData.activationDate : undefined,
    })
  }

  const isEntity = formData.legalFormId === LEGAL_FORM_ENTITY
  const today = todayInputValue()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-6">
        {/* select office */}
        <AppSelect
          selectLabel={`${t('form.labelOffice')}*`}
          selectValue={formData.officeId?.toString() ?? ''}
          selectOnChange={v =>
            // staff belongs to an office, so a new office clears the pick
            onChange({ ...formData, officeId: Number(v), staffId: undefined })
          }
          selectPlaceholder={t('form.selectOffice')}
          selectOptions={Array.from(template.officeOptions ?? []).map(o => ({
            id: o.id ?? 0,
            name: o.name ?? '',
          }))}
        />

        {/* select legal form */}
        <AppSelect
          selectLabel={`${t('form.labelLegalForm')}*`}
          selectValue={formData.legalFormId?.toString() ?? ''}
          selectOnChange={v => handleChange('legalFormId', Number(v))}
          selectPlaceholder={t('form.selectLegalForm')}
          selectOptions={[
            { id: LEGAL_FORM_PERSON, name: t('form.legalFormPerson') },
            { id: LEGAL_FORM_ENTITY, name: t('form.legalFormEntity') },
          ]}
        />

        {/* input external id */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="externalId">{t('form.labelExternalId')}</Label>
          <Input
            id="externalId"
            value={formData.externalId ?? ''}
            onChange={e =>
              handleChange('externalId', e.target.value || undefined)
            }
          />
        </div>
      </div>

      {/* name fields; an entity has no middle name, its name is one fullname */}
      <div className="flex flex-wrap gap-6">
        {/* input first name */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="firstname">
            {t('form.labelFirstName')}
            {!isEntity && '*'}
          </Label>
          <Input
            id="firstname"
            value={formData.firstname ?? ''}
            onChange={e =>
              handleChange('firstname', e.target.value || undefined)
            }
          />
        </div>

        {/* input middle name */}
        {!isEntity && (
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="middlename">{t('form.labelMiddleName')}</Label>
            <Input
              id="middlename"
              value={formData.middlename ?? ''}
              onChange={e =>
                handleChange('middlename', e.target.value || undefined)
              }
            />
          </div>
        )}

        {/* input last name */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="lastname">
            {t('form.labelLastName')}
            {!isEntity && '*'}
          </Label>
          <Input
            id="lastname"
            value={formData.lastname ?? ''}
            onChange={e =>
              handleChange('lastname', e.target.value || undefined)
            }
          />
        </div>
      </div>

      {/* input date of birth */}
      <div className="flex flex-wrap gap-6">
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="dateOfBirth">{t('form.labelDateOfBirth')}</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth ?? ''}
            onChange={e =>
              handleChange('dateOfBirth', e.target.value || undefined)
            }
          />
        </div>

        {/* select gender (code values from Admin > System > Manage Codes) */}
        <AppSelect
          selectLabel={t('form.labelGender')}
          selectValue={formData.genderId?.toString() ?? ''}
          selectOnChange={handleIdChange('genderId')}
          selectPlaceholder={t('form.selectGender')}
          selectOptions={toOptions(template.genderOptions)}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-end">
        {/* select staff (the office's staff, from the template) */}
        <AppSelect
          selectLabel={t('form.labelStaff')}
          selectValue={formData.staffId?.toString() ?? ''}
          selectOnChange={handleIdChange('staffId')}
          selectPlaceholder={t('form.selectStaff')}
          selectOptions={toOptions(template.staffOptions)}
        />

        {/* is staff checkbox */}
        <div className="w-full md:w-[48%] flex items-center gap-2">
          <Checkbox
            id="isStaff"
            checked={!!formData.isStaff}
            onCheckedChange={checked =>
              handleChange('isStaff', checked === true)
            }
          />
          <Label htmlFor="isStaff" className="cursor-pointer font-normal">
            {t('form.labelIsStaff')}
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {/* input mobile number */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="mobileNo">{t('form.labelMobileNo')}</Label>
          <Input
            id="mobileNo"
            value={formData.mobileNo ?? ''}
            onChange={e =>
              handleChange('mobileNo', e.target.value || undefined)
            }
          />
        </div>

        <div className="w-full md:w-[48%] space-y-2">
          {/* input email address */}
          <Label htmlFor="emailAddress">{t('form.labelEmailAddress')}</Label>
          <Input
            id="emailAddress"
            value={formData.emailAddress ?? ''}
            onChange={e =>
              handleChange('emailAddress', e.target.value || undefined)
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {/* select client type (code values) */}
        <AppSelect
          selectLabel={t('form.labelClientType')}
          selectValue={formData.clientTypeId?.toString() ?? ''}
          selectOnChange={handleIdChange('clientTypeId')}
          selectPlaceholder={t('form.selectClientType')}
          selectOptions={toOptions(template.clientTypeOptions)}
        />

        {/* select client classification (code values) */}
        <AppSelect
          selectLabel={t('form.labelClientClassification')}
          selectValue={formData.clientClassificationId?.toString() ?? ''}
          selectOnChange={handleIdChange('clientClassificationId')}
          selectPlaceholder={t('form.selectClientClassification')}
          selectOptions={toOptions(template.clientClassificationOptions)}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-end">
        {/* input submitted on date; required, and not in the future */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="submittedOnDate">{t('form.labelSubmittedOn')}*</Label>
          <Input
            id="submittedOnDate"
            type="date"
            required
            max={today}
            value={formData.submittedOnDate ?? ''}
            onChange={e =>
              handleChange('submittedOnDate', e.target.value || undefined)
            }
          />
        </div>

        {/* active checkbox */}
        <div className="w-full md:w-[48%] flex items-center gap-2">
          <Checkbox
            id="active"
            checked={!!formData.active}
            onCheckedChange={checked => handleActiveChange(checked === true)}
          />
          <Label htmlFor="active" className="cursor-pointer font-normal">
            {t('form.labelActive')}
          </Label>
        </div>
      </div>

      {/* Fineract requires an activation date for a client created as active */}
      {formData.active && (
        <div className="flex flex-wrap gap-6">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="activationDate">
              {t('form.labelActivationDate')}*
            </Label>
            <Input
              id="activationDate"
              type="date"
              min={formData.submittedOnDate}
              max={today}
              value={formData.activationDate ?? ''}
              onChange={e =>
                handleChange('activationDate', e.target.value || undefined)
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientGeneralStep
