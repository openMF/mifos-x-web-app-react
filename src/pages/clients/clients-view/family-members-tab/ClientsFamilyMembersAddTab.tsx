/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

const ClientsFamilyMembersAddTab = ({
  clientId,
  onCancel,
  onSubmitted,
}: {
  clientId?: string
  onCancel?: () => void
  onSubmitted?: () => void
}) => {
  // form state
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    qualification: '',
    age: '',
    isDependent: false,
    relationship: '',
    gender: '',
    profession: '',
    maritalStatus: '',
    dob: '',
  })
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  // update helper
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  // required validation
  const isValid =
    form.firstName &&
    form.lastName &&
    form.age &&
    form.relationship &&
    form.gender &&
    form.dob

  // handle submit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmitted?.()
  }

  return (
    <form onSubmit={submit} className="p-0">
      {/* grid layout with two columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* First / Middle / Last Name */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelFirstName')}<span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>{t('familyMembers.labelMiddleName')}</Label>
          <Input
            value={form.middleName}
            onChange={e => set('middleName', e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelLastName')}<span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label>{t('familyMembers.labelQualification')}</Label>
          <Input
            value={form.qualification}
            onChange={e => set('qualification', e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>

        {/* Age + Dependent flag */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelAge')}<span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            min={0}
            value={form.age}
            onChange={e => set('age', e.target.value)}
            className="rounded-none border-0 border-b border-zinc-300 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Label className="m-0">{t('familyMembers.labelIsDependent')}</Label>
          <Checkbox
            checked={form.isDependent}
            onCheckedChange={v => set('isDependent', !!v)}
          />
        </div>

        {/* Relationship + Gender */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelRelationship')}<span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.relationship}
            onValueChange={v => set('relationship', v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPOUSE">{t('familyMembers.relationshipSpouse')}</SelectItem>
              <SelectItem value="CHILD">{t('familyMembers.relationshipChild')}</SelectItem>
              <SelectItem value="PARENT">{t('familyMembers.relationshipParent')}</SelectItem>
              <SelectItem value="SIBLING">{t('familyMembers.relationshipSibling')}</SelectItem>
              <SelectItem value="OTHER">{t('familyMembers.relationshipOther')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelGender')}<span className="text-red-500">*</span>
          </Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">{t('familyMembers.genderMale')}</SelectItem>
              <SelectItem value="FEMALE">{t('familyMembers.genderFemale')}</SelectItem>
              <SelectItem value="OTHER">{t('familyMembers.genderOther')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profession + Marital status */}
        <div className="space-y-1">
          <Label>{t('familyMembers.labelProfession')}</Label>
          <Select
            value={form.profession}
            onValueChange={v => set('profession', v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYED">{t('familyMembers.professionEmployed')}</SelectItem>
              <SelectItem value="SELF_EMPLOYED">{t('familyMembers.professionSelfEmployed')}</SelectItem>
              <SelectItem value="STUDENT">{t('familyMembers.professionStudent')}</SelectItem>
              <SelectItem value="UNEMPLOYED">{t('familyMembers.professionUnemployed')}</SelectItem>
              <SelectItem value="OTHER">{t('familyMembers.professionOther')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t('familyMembers.labelMaritalStatus')}</Label>
          <Select
            value={form.maritalStatus}
            onValueChange={v => set('maritalStatus', v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">{t('familyMembers.maritalSingle')}</SelectItem>
              <SelectItem value="MARRIED">{t('familyMembers.maritalMarried')}</SelectItem>
              <SelectItem value="DIVORCED">{t('familyMembers.maritalDivorced')}</SelectItem>
              <SelectItem value="WIDOWED">{t('familyMembers.maritalWidowed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DOB with icon */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelDateOfBirth')}<span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type="date"
              value={form.dob}
              onChange={e => set('dob', e.target.value)}
              className="w-full rounded-none border-0 border-b border-zinc-300 pr-10 focus-visible:ring-0"
            />
            <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* footer buttons */}
      <div className="flex items-center gap-4 justify-center mt-8">
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          {tc('actions.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
        >
          {tc('actions.submit')}
        </Button>
      </div>
    </form>
  )
}

export default ClientsFamilyMembersAddTab
