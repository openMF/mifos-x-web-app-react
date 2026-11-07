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
  OfficesApi,
  type GetOfficesResponse,
  type PutOfficesOfficeIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { dateArrayToInputValue, inputToFineractDate } from '@/lib/date-utils'

const officesApi = new OfficesApi(getConfiguration())

const EditOffices = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [formData, setFormData] = useState({
    officeName: '',
    parentOffice: '',
    openedOn: '',
    externalId: '',
  })
  // The head office has no parent and Fineract rejects giving it one, so the
  // Parent Office field is only shown for an office that has a parent
  const [hasParent, setHasParent] = useState(false)

  // fetch office list + details of office being edited
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allOfficesRes = await officesApi.retrieveOffices()
        setOffices(allOfficesRes.data || [])

        if (id) {
          const officeRes = await officesApi.retrieveOffice(Number(id))
          // The generated type lacks parentId; the API returns it (ISSUES.md)
          const parentId = (officeRes.data as { parentId?: number | null })
            .parentId
          setHasParent(Boolean(parentId))
          setFormData({
            officeName: officeRes.data.name ?? '',
            parentOffice: parentId ? String(parentId) : '',
            // openingDate arrives as [year, month, day]; the date input needs yyyy-MM-dd
            openedOn: dateArrayToInputValue(
              officeRes.data.openingDate as unknown as number[] | undefined
            ),
            externalId: officeRes.data.externalId ?? '',
          })
        }
      } catch (err) {
        console.error('Failed to fetch office data', err)
      }
    }
    fetchData()
  }, [id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // update office
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formattedDate = inputToFineractDate(formData.openedOn)

    try {
      // PUT /offices/{id} accepts parentId; the generated type leaves it out
      const request: PutOfficesOfficeIdRequest & { parentId?: number } = {
        name: formData.officeName,
        parentId:
          hasParent && formData.parentOffice
            ? Number(formData.parentOffice)
            : undefined,
        openingDate: formattedDate,
        externalId: formData.externalId,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      }
      await officesApi.updateOffice(Number(id), request)

      alert('Office updated successfully!')
      navigate('/organization/offices')
    } catch (err) {
      console.error('Failed to update office', err)
      alert('Failed to update office')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Offices', href: '/organization/offices' },
          { label: `${id}`, href: `/organization/offices/${id}` },
          { label: 'Edit Office', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Office</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office Name */}
          <div className="w-full space-y-2">
            <Label>Office Name*</Label>
            <Input
              value={formData.officeName}
              onChange={e => handleChange('officeName', e.target.value)}
              required
            />
          </div>

          {/* Parent Office (not for the head office) */}
          {hasParent && (
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel="Parent Office*"
                selectPlaceholder="Select Parent Office"
                selectValue={formData.parentOffice}
                selectOnChange={val => handleChange('parentOffice', val)}
                selectClassname="w-full space-y-2"
                selectOptions={offices
                  // an office cannot be its own parent
                  .filter(o => o.id !== Number(id))
                  .map(o => ({
                    id: o.id?.toString() || '',
                    name: o.name || '',
                  }))}
              />
            </div>
          )}

          {/* Opened On */}
          <div className="w-full space-y-2">
            <Label>Opened On*</Label>
            <Input
              type="date"
              value={formData.openedOn}
              onChange={e => handleChange('openedOn', e.target.value)}
              required
            />
          </div>

          {/* External ID */}
          <div className="w-full space-y-2">
            <Label>External ID*</Label>
            <Input
              value={formData.externalId}
              onChange={e => handleChange('externalId', e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/offices')}
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

export default EditOffices
