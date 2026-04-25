/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  ClientApi,
  OfficesApi,
  StaffApi,
  type GetOfficesResponse,
  type StaffData,
} from '@/fineract-api'
import { inputToFineractDate } from '@/lib/date-utils'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'

const clientApi = new ClientApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())

const LEGAL_FORM_PERSON = 1
const LEGAL_FORM_ENTITY = 2

const CreateClient = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [staff, setStaff] = useState<StaffData[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    legalFormId: String(LEGAL_FORM_PERSON),
    officeId: '',
    staffId: '',
    firstname: '',
    middlename: '',
    lastname: '',
    fullname: '',
    mobileNo: '',
    emailAddress: '',
    dateOfBirth: '',
    externalId: '',
    active: false,
    activationDate: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await officesApi.retrieveOffices()
        setOffices(res.data ?? [])
      } catch (e) {
        console.error('Failed to load offices', e)
      }
    })()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStaff([])
      if (!formData.officeId) return
      try {
        const res = await staffApi.retrieveAll16(Number(formData.officeId))
        if (!cancelled) setStaff(Array.from(res.data ?? []))
      } catch (e) {
        console.error('Failed to load staff', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formData.officeId])

  const isPerson = formData.legalFormId === String(LEGAL_FORM_PERSON)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.officeId) {
      alert(t('create.errorOfficeRequired'))
      return
    }
    setSubmitting(true)
    try {
      await clientApi.create6({
        legalFormId: Number(formData.legalFormId),
        officeId: Number(formData.officeId),
        staffId: formData.staffId ? Number(formData.staffId) : undefined,
        ...(isPerson
          ? {
              firstname: formData.firstname,
              middlename: formData.middlename || undefined,
              lastname: formData.lastname,
            }
          : { fullname: formData.fullname }),
        mobileNo: formData.mobileNo || undefined,
        emailAddress: formData.emailAddress || undefined,
        dateOfBirth: formData.dateOfBirth
          ? inputToFineractDate(formData.dateOfBirth)
          : undefined,
        externalId: formData.externalId || undefined,
        active: formData.active,
        activationDate:
          formData.active && formData.activationDate
            ? inputToFineractDate(formData.activationDate)
            : undefined,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
      navigate('/clients')
    } catch (e) {
      console.error('Failed to create client', e)
      alert(t('create.errorCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/clients' },
          { label: t('create.heading'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('create.heading')}</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <AppSelect
            selectLabel={t('create.labelLegalForm')}
            selectValue={formData.legalFormId}
            selectPlaceholder={t('create.selectLegalForm')}
            selectClassname="w-full space-y-2"
            selectOnChange={value =>
              setFormData(p => ({
                ...p,
                legalFormId: value,
                firstname: '',
                middlename: '',
                lastname: '',
                fullname: '',
              }))
            }
            selectOptions={[
              { id: LEGAL_FORM_PERSON, name: t('create.legalFormPerson') },
              { id: LEGAL_FORM_ENTITY, name: t('create.legalFormEntity') },
            ]}
          />

          <AppSelect
            selectLabel={t('create.labelOffice')}
            selectValue={formData.officeId}
            selectPlaceholder={t('create.selectOffice')}
            selectClassname="w-full space-y-2"
            selectOnChange={value =>
              setFormData(p => ({ ...p, officeId: value, staffId: '' }))
            }
            selectOptions={offices.map(o => ({
              id: o.id?.toString() ?? '',
              name: o.name ?? '',
            }))}
          />

          <AppSelect
            selectLabel={t('create.labelStaff')}
            selectValue={formData.staffId}
            selectPlaceholder={t('create.selectStaff')}
            selectClassname="w-full space-y-2"
            selectOnChange={value =>
              setFormData(p => ({ ...p, staffId: value }))
            }
            selectOptions={staff.map(s => ({
              id: s.id?.toString() ?? '',
              name: s.displayName ?? '',
            }))}
          />

          {isPerson ? (
            <>
              <div className="space-y-2">
                <Label>{t('create.labelFirstName')}</Label>
                <Input
                  value={formData.firstname}
                  onChange={e =>
                    setFormData(p => ({ ...p, firstname: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('create.labelMiddleName')}</Label>
                <Input
                  value={formData.middlename}
                  onChange={e =>
                    setFormData(p => ({ ...p, middlename: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('create.labelLastName')}</Label>
                <Input
                  value={formData.lastname}
                  onChange={e =>
                    setFormData(p => ({ ...p, lastname: e.target.value }))
                  }
                  required
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>{t('create.labelFullName')}</Label>
              <Input
                value={formData.fullname}
                onChange={e =>
                  setFormData(p => ({ ...p, fullname: e.target.value }))
                }
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('create.labelMobileNo')}</Label>
            <Input
              value={formData.mobileNo}
              onChange={e =>
                setFormData(p => ({ ...p, mobileNo: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('create.labelEmail')}</Label>
            <Input
              type="email"
              value={formData.emailAddress}
              onChange={e =>
                setFormData(p => ({ ...p, emailAddress: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('create.labelDateOfBirth')}</Label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={e =>
                setFormData(p => ({ ...p, dateOfBirth: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('create.labelExternalId')}</Label>
            <Input
              value={formData.externalId}
              onChange={e =>
                setFormData(p => ({ ...p, externalId: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.active}
              onCheckedChange={v =>
                setFormData(p => ({ ...p, active: Boolean(v) }))
              }
            />
            <Label className="text-md">{t('create.labelActive')}</Label>
          </div>

          {formData.active && (
            <div className="space-y-2">
              <Label>{t('create.labelActivationDate')}</Label>
              <Input
                type="date"
                value={formData.activationDate}
                onChange={e =>
                  setFormData(p => ({ ...p, activationDate: e.target.value }))
                }
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clients')}
            >
              {tc('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {submitting ? tc('actions.saving') : tc('actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClient
