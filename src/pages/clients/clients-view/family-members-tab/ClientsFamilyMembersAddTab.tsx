/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
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

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import {
  ClientFamilyMemberApi,
  type ClientFamilyMembersData,
} from '@/fineract-api'
import { todayInputValue } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'

// Built per call so it picks up the current credentials; see EntityDocumentsTab.
const familyMemberApi = () => new ClientFamilyMemberApi(getConfiguration())

type ClientApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

/** A select's value is a string; Fineract expects the code value id as a number. */
const toId = (value: string) => (value ? Number(value) : undefined)

const ClientsFamilyMembersAddTab = () => {
  const { id } = useParams()
  const navigate = useNavigate()

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
  // The relationship, gender, profession and marital status options are code
  // values configured in Fineract, so they come from the template.
  const [template, setTemplate] = useState<ClientFamilyMembersData>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  useEffect(() => {
    if (!id) return
    let active = true
    familyMemberApi()
      .getTemplate2(Number(id))
      .then(res => {
        if (active) setTemplate(res.data ?? {})
      })
      .catch(e => {
        console.error('Failed to load the family member template', e)
        if (active) setError(t('familyMembers.templateFailed'))
      })
    return () => {
      active = false
    }
  }, [id, t])

  // update helper
  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  // required validation
  const isValid =
    form.firstName &&
    form.lastName &&
    form.age &&
    form.relationship &&
    form.gender &&
    form.dob

  const backToList = (state?: RouteSuccessState) =>
    navigate(`/clients/${id}/family-members`, { state })

  // handle submit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !isValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await familyMemberApi().addClientFamilyMembers(Number(id), {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        qualification: form.qualification.trim(),
        age: Number(form.age),
        isDependent: form.isDependent,
        relationshipId: toId(form.relationship),
        genderId: toId(form.gender),
        professionId: toId(form.profession),
        maritalStatusId: toId(form.maritalStatus),
        dateOfBirth: form.dob,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      })
      backToList({ successMessage: t('success.familyMemberAdded') })
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('familyMembers.addFailed')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="p-0">
      {/* grid layout with two columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* First / Middle / Last Name */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelFirstName')}
            <span className="text-red-500">*</span>
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
            {t('familyMembers.labelLastName')}
            <span className="text-red-500">*</span>
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
            {t('familyMembers.labelAge')}
            <span className="text-red-500">*</span>
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
            {t('familyMembers.labelRelationship')}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.relationship}
            onValueChange={v => set('relationship', v)}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {template.relationshipIdOptions?.map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelGender')}
            <span className="text-red-500">*</span>
          </Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger className="rounded-none border-0 border-b border-zinc-300">
              <SelectValue placeholder={t('familyMembers.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {template.genderIdOptions?.map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
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
              {template.professionIdOptions?.map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
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
              {template.maritalStatusIdOptions?.map(option => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* DOB with icon */}
        <div className="space-y-1">
          <Label>
            {t('familyMembers.labelDateOfBirth')}
            <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type="date"
              max={todayInputValue()}
              value={form.dob}
              onChange={e => set('dob', e.target.value)}
              className="w-full rounded-none border-0 border-b border-zinc-300 pr-10 focus-visible:ring-0"
            />
            <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          </div>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {/* footer buttons */}
      <div className="flex items-center gap-4 justify-center mt-8">
        <Button type="button" variant="outline" onClick={() => backToList()}>
          {tc('actions.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!isValid || submitting}
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
        >
          {tc('actions.submit')}
        </Button>
      </div>
    </form>
  )
}

export default ClientsFamilyMembersAddTab
