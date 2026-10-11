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
import type {
  ExtendedClientTemplate,
  ExtendedPostClientsRequest,
} from '@/pages/clients/types'

/** Fineract legal form ids, from the clientLegalFormOptions template */
const LEGAL_FORM_PERSON = 1
const LEGAL_FORM_ENTITY = 2

/** Clears an optional select; Radix Select cannot select an empty value */
const NONE_OPTION = { id: 'none', name: 'None' }

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
    NONE_OPTION,
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
        value && value !== NONE_OPTION.id ? Number(value) : undefined
      )

  const handleActiveChange = (active: boolean) => {
    onChange({
      ...formData,
      active,
      activationDate: active ? formData.activationDate : undefined,
    })
  }

  const isEntity = formData.legalFormId === LEGAL_FORM_ENTITY

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-6">
        {/* select office */}
        <AppSelect
          selectLabel="Office*"
          selectValue={formData.officeId?.toString() ?? ''}
          selectOnChange={v =>
            // staff belongs to an office, so a new office clears the pick
            onChange({ ...formData, officeId: Number(v), staffId: undefined })
          }
          selectPlaceholder="Select Office"
          selectOptions={Array.from(template.officeOptions ?? []).map(o => ({
            id: o.id ?? 0,
            name: o.name ?? '',
          }))}
        />

        {/* select legal form */}
        <AppSelect
          selectLabel="Legal Form*"
          selectValue={formData.legalFormId?.toString() ?? ''}
          selectOnChange={v => handleChange('legalFormId', Number(v))}
          selectPlaceholder="Select Legal Form"
          selectOptions={[
            { id: LEGAL_FORM_PERSON, name: 'Person' },
            { id: LEGAL_FORM_ENTITY, name: 'Entity' },
          ]}
        />

        {/* input external id */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="externalId">External Id</Label>
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
            First Name
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
            <Label htmlFor="middlename">Middle Name</Label>
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
            Last Name
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
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
          selectLabel="Gender"
          selectValue={formData.genderId?.toString() ?? ''}
          selectOnChange={handleIdChange('genderId')}
          selectPlaceholder="Select Gender"
          selectOptions={toOptions(template.genderOptions)}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-end">
        {/* select staff (the office's staff, from the template) */}
        <AppSelect
          selectLabel="Staff"
          selectValue={formData.staffId?.toString() ?? ''}
          selectOnChange={handleIdChange('staffId')}
          selectPlaceholder="Select Staff"
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
            Is staff?
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {/* input mobile number */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label htmlFor="mobileNo">Mobile No</Label>
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
          <Label htmlFor="emailAddress">Email Address</Label>
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
          selectLabel="Client Type"
          selectValue={formData.clientTypeId?.toString() ?? ''}
          selectOnChange={handleIdChange('clientTypeId')}
          selectPlaceholder="Select Client Type"
          selectOptions={toOptions(template.clientTypeOptions)}
        />

        {/* select client classification (code values) */}
        <AppSelect
          selectLabel="Client Classification"
          selectValue={formData.clientClassificationId?.toString() ?? ''}
          selectOnChange={handleIdChange('clientClassificationId')}
          selectPlaceholder="Select Client Classification"
          selectOptions={toOptions(template.clientClassificationOptions)}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-end">
        {/* Missing in OpenAPI */}
        <div className="w-full md:w-[48%] space-y-2">
          <Label>Submitted On*</Label>
          <div className="w-full rounded-md border border-input px-3 py-2 text-sm text-muted-foreground bg-muted/40">
            Missing in OpenAPI
          </div>
        </div>

        {/* active checkbox */}
        <div className="w-full md:w-[48%] flex items-center gap-2">
          <Checkbox
            id="active"
            checked={!!formData.active}
            onCheckedChange={checked => handleActiveChange(checked === true)}
          />
          <Label htmlFor="active" className="cursor-pointer font-normal">
            Active?
          </Label>
        </div>
      </div>

      {/* Fineract requires an activation date for a client created as active */}
      {formData.active && (
        <div className="flex flex-wrap gap-6">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="activationDate">Activation Date*</Label>
            <Input
              id="activationDate"
              type="date"
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
