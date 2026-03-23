/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  CollectionSheetApi,
  OfficesApi,
  StaffApi,
  type GetOfficesResponse,
  type StaffData,
  type PostCollectionSheetResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { SearchIcon } from 'lucide-react'

// Create API instances
const officeApi = new OfficesApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())
const collectionSheetApi = new CollectionSheetApi(getConfiguration())

const IndividualCollectionSheet = () => {
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[] | null>(null)
  const [staff, setStaff] = useState<StaffData[] | null>(null)
  const [_collectionSheet, setCollectionSheet] =
    useState<PostCollectionSheetResponse | null>(null) // Reserved for future use

  const [formData, setFormData] = useState({
    office: '',
    date: '',
    staff: '',
    client: '',
  })

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const officesRes = await officeApi.retrieveOffices()
        setOffices(officesRes.data)
      } catch (err) {
        console.error('Failed to fetch offices', err)
      }
    }
    fetchDropdowns()
  }, [])

  const fetchStaff = async (officeId: string) => {
    try {
      const res = await staffApi.retrieveAll16(Number(officeId))
      setStaff(res.data)
    } catch (err) {
      console.error('Failed to fetch staff', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.office) {
      alert('Please fill all required fields.')
      return
    }

    const payload = {
      officeId: Number(formData.office),
      transactionDate: formData.date,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
      staffId: formData.staff ? Number(formData.staff) : undefined,
    }

    try {
      const response = await collectionSheetApi.generateCollectionSheet(
        payload,
        'generateCollectionSheet'
      )

      setCollectionSheet(response.data)
    } catch (err) {
      console.error('Failed to generate collection sheet', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Individual Collection Sheet', current: true },
        ]}
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-10 py-4">
          <div className="bg-white p-8 w-[36rem] dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col gap-6">
            <h2 className="text-2xl font-semibold mb-4">
              Individual Collection Sheet
            </h2>

            {/* Branch Office */}
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel="Branch Office *"
                selectValue={formData.office}
                selectOnChange={value => {
                  setFormData(prev => ({ ...prev, office: value }))
                  fetchStaff(value)
                }}
                selectPlaceholder="Select Office"
                selectOptions={(offices || [])
                  .filter(option => option.id !== undefined)
                  .map(option => ({
                    id: option.id!,
                    name: option.name!,
                  }))}
                selectClassname="w-full space-y-2"
              />
            </div>

            {/* Repayment Date */}
            <div className="w-full space-y-2">
              <Label className="ml-1 text-sm">Repayment Date *</Label>
              <Input
                type="date"
                className="w-full pl-3"
                onChange={e =>
                  setFormData(prev => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            {/* Staff */}
            <div className="w-full space-y-2">
              <AppSelect
                selectLabel="Staff"
                selectValue={formData.staff}
                selectOnChange={value =>
                  setFormData(prev => ({ ...prev, staff: value }))
                }
                selectPlaceholder="Select Staff"
                selectOptions={(staff || [])
                  .filter(option => option.id !== undefined)
                  .map(option => ({
                    id: option.id!,
                    name: option.displayName!,
                  }))}
                selectClassname="w-full space-y-2"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => navigate('/accounting')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white flex items-center gap-2 cursor-pointer"
              >
                <SearchIcon className="h-4 w-4" />
                Collection Sheet
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default IndividualCollectionSheet
