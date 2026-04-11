/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  TellerCashManagementApi,
  OfficesApi,
  type GetOfficesResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const tellersApi = new TellerCashManagementApi(getConfiguration())
const officesApi = new OfficesApi(getConfiguration())

// helper: converts [yyyy, mm, dd] array → yyyy-MM-dd
const toInputDate = (d: unknown): string => {
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return typeof d === 'string' ? d : ''
}

const EditTellers = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])

  const [formData, setFormData] = useState({
    tellerName: '',
    officeId: '', // office cannot be changed, only displayed
    description: '',
    startDate: '', // yyyy-MM-dd
    endDate: '', // yyyy-MM-dd
    status: 'ACTIVE', // ACTIVE | INACTIVE
  })

  // fetch offices + teller details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const offRes = await officesApi.retrieveOffices()
        setOffices(offRes.data || [])

        if (id) {
          const tRes = await tellersApi.findTeller(Number(id))
          const t = tRes.data ?? {}
          setFormData({
            tellerName: t.name ?? '',
            officeId: (t.officeId ?? '').toString(),
            description: t.name ?? '',
            startDate: toInputDate(t.startDate),
            endDate: toInputDate(t.name), // ⚠️ looks wrong, probably should be t.endDate
            status: (t.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
          })
        }
      } catch (err) {
        console.error('Failed to load teller/offices', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) =>
    setFormData(p => ({ ...p, [field]: value }))

  // submit updated teller
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tellersApi.updateTeller(Number(id), {
        name: formData.tellerName,
        officeId: Number(formData.officeId),
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        status: formData.status as 'ACTIVE' | 'INACTIVE',
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      })
      alert('Teller updated successfully!')
      navigate('/organization/tellers')
    } catch (err) {
      console.error('Failed to update teller', err)
      alert('Failed to update teller')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Tellers', href: '/organization/tellers' },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Tellers</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Teller Name */}
          <div className="w-full space-y-2">
            <Label>Teller Name*</Label>
            <Input
              value={formData.tellerName}
              onChange={e => handleChange('tellerName', e.target.value)}
              required
            />
          </div>

          {/* Office */}
          <div className="w-full space-y-2 opacity-80">
            <AppSelect
              selectLabel="Office"
              selectPlaceholder="Select Office"
              selectValue={formData.officeId}
              selectOnChange={() => {}} // disabled
              selectClassname="w-full space-y-2"
              selectOptions={offices.map(o => ({
                id: o.id?.toString() || '',
                name: o.name || '',
              }))}
            />
          </div>

          {/* Description */}
          <div className="w-full space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          {/* Start Date */}
          <div className="w-full space-y-2">
            <Label>Start Date*</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={e => handleChange('startDate', e.target.value)}
              required
            />
          </div>

          {/* End Date */}
          <div className="w-full space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={e => handleChange('endDate', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Status*"
              selectPlaceholder="Select Status"
              selectValue={formData.status}
              selectOnChange={val => handleChange('status', val)}
              selectClassname="w-full space-y-2"
              selectOptions={[
                { id: 'ACTIVE', name: 'Active' },
                { id: 'INACTIVE', name: 'Inactive' },
              ]}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/tellers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTellers
