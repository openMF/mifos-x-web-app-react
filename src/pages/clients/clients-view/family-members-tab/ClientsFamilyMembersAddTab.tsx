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

/** The select value for a code value id, or empty when none is set. */
const toOption = (value?: number) => (value ? String(value) : '')

/**
 * Fineract sends the date of birth either as "yyyy-MM-dd" or as [y, m, d];
 * the date input needs "yyyy-MM-dd".
 */
const toInputDate = (value?: string | number[]) =>
  Array.isArray(value)
    ? value.map((part, i) => String(part).padStart(i ? 2 : 4, '0')).join('-')
    : (value ?? '')

/**
 * Adds a family member, or edits one when the route has a familyMemberId.
 */
const ClientsFamilyMembersAddTab = () => {
  const { id, familyMemberId } = useParams()
  const navigate = useNavigate()
  const isEdit = familyMemberId !== undefined

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
  // In edit mode the form stays disabled until the member has been loaded.
  const [memberLoaded, setMemberLoaded] = useState(!isEdit)
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  useEffect(() => {
    if (!id) return
    let active = true
    // Keeps a previously loaded member from being submitted under a new id.
    setMemberLoaded(!isEdit)
    const api = familyMemberApi()
    // When editing, the form is filled only once the options are known.
    Promise.all([
      api.getTemplate2(Number(id)),
      isEdit
        ? api.getFamilyMember(Number(familyMemberId), Number(id))
        : undefined,
    ])
      .then(([templateRes, memberRes]) => {
        if (!active) return
        setTemplate(templateRes.data ?? {})
        if (!memberRes) return
        const member = memberRes.data ?? {}
        setForm({
          firstName: member.firstName ?? '',
          middleName: member.middleName ?? '',
          lastName: member.lastName ?? '',
          qualification: member.qualification ?? '',
          age: member.age === undefined ? '' : String(member.age),
          isDependent: !!member.isDependent,
          relationship: toOption(member.relationshipId),
          gender: toOption(member.genderId),
          profession: toOption(member.professionId),
          maritalStatus: toOption(member.maritalStatusId),
          dob: toInputDate(member.dateOfBirth),
        })
        setMemberLoaded(true)
      })
      .catch(e => {
        console.error('Failed to load the family member form', e)
        if (active)
          setError(
            t(
              isEdit
                ? 'familyMembers.memberFailed'
                : 'familyMembers.templateFailed'
            )
          )
      })
    return () => {
      active = false
    }
  }, [id, familyMemberId, isEdit, t])

  // update helper
  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  // A select reports an empty value when its value is set in the same render
  // its options first appear, as when an edited member loads; no option has
  // an empty value, so that report is ignored.
  const setSelect = (k: keyof typeof form) => (v: string) => {
    if (v) set(k, v)
  }

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
    if (!id || !isValid || !memberLoaded || submitting) return
    setSubmitting(true)
    setError('')
    const request = {
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
    }
    try {
      if (isEdit) {
        // Fineract's update fails when professionId or maritalStatusId is
        // missing, and reads 0 as "leave unchanged".
        await familyMemberApi().updateClientFamilyMembers(
          Number(familyMemberId),
          Number(id),
          {
            ...request,
            professionId: request.professionId ?? 0,
            maritalStatusId: request.maritalStatusId ?? 0,
          }
        )
        backToList({ successMessage: t('success.familyMemberUpdated') })
      } else {
        await familyMemberApi().addClientFamilyMembers(Number(id), request)
        backToList({ successMessage: t('success.familyMemberAdded') })
      }
    } catch (err) {
      const data = (err as AxiosError<ClientApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t(isEdit ? 'familyMembers.updateFailed' : 'familyMembers.addFailed')
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
            onValueChange={setSelect('relationship')}
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
          <Select value={form.gender} onValueChange={setSelect('gender')}>
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
            onValueChange={setSelect('profession')}
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
            onValueChange={setSelect('maritalStatus')}
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
          disabled={!isValid || !memberLoaded || submitting}
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
        >
          {tc('actions.submit')}
        </Button>
      </div>
    </form>
  )
}

export default ClientsFamilyMembersAddTab
