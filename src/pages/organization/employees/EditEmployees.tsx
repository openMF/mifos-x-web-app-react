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
  StaffApi,
  type GetOfficesResponse,
  type PutStaffRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { apiErrorMessage } from '@/pages/organization/loan-originators/types'

const officesApi = new OfficesApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())

const EditEmployees = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [offices, setOffices] = useState<GetOfficesResponse[]>([])
  const [formData, setFormData] = useState({
    officeId: '',
    firstName: '',
    lastName: '',
    isLoanOfficer: false,
    mobileNo: '',
    isActive: true,
    joiningDate: '', // yyyy-MM-dd
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Submitting before the employee is loaded would overwrite it with the empty defaults
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // offices for dropdown
        const allOfficesRes = await officesApi.retrieveOffices()
        setOffices(allOfficesRes.data || [])

        // prefill employee
        if (id) {
          // NOTE: if your generated client names differ, swap retrieveOne16 -> your getter
          const empRes = await staffApi.retrieveOne8(Number(id))
          const emp = empRes.data ?? {}

          // Fineract often sends dates as [yyyy, mm, dd]
          const toInputDate = (d: unknown) => {
            if (Array.isArray(d) && d.length >= 3) {
              const [y, m, day] = d
              return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            }
            return typeof d === 'string' ? d : ''
          }

          setFormData({
            officeId: (emp.officeId ?? '').toString(),
            firstName: emp.firstname ?? '',
            lastName: emp.lastname ?? '',
            isLoanOfficer: Boolean(emp.isLoanOfficer),
            mobileNo: emp.mobileNo ?? '',
            isActive: emp.isActive !== false,
            joiningDate: toInputDate(emp.joiningDate),
          })
          setLoaded(true)
        }
      } catch (err) {
        setLoadError(apiErrorMessage(err, 'Failed to load the employee.'))
      }
    }
    fetchData()
  }, [id, loadAttempt])

  const retryLoad = () => {
    setLoadError(null)
    setLoadAttempt(n => n + 1)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !loaded || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      // The generated PutStaffRequest only has externalId and isLoanOfficer
      const request: PutStaffRequest & Record<string, unknown> = {
        officeId: Number(formData.officeId),
        firstname: formData.firstName,
        lastname: formData.lastName,
        isLoanOfficer: formData.isLoanOfficer,
        mobileNo: formData.mobileNo,
        isActive: formData.isActive,
        joiningDate: formData.joiningDate,
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }
      await staffApi.update7(Number(id), request)
      navigate('/organization/employees')
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update employee.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Employees', href: '/organization/employees' },
          { label: `${id}`, href: `/organization/employees/${id}` },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit Employee</h2>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loadError && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            <span>{loadError}</span>
            <Button type="button" variant="outline" onClick={retryLoad}>
              Retry
            </Button>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Office */}
          <div className="w-full space-y-2">
            <AppSelect
              selectLabel="Office*"
              selectPlaceholder="Select Office"
              selectValue={formData.officeId}
              // Radix Select can report '' for the prefilled office; an
              // employee always has an office, so that is ignored
              selectOnChange={val => {
                if (val) handleChange('officeId', val)
              }}
              selectClassname="w-full space-y-2"
              selectOptions={offices.map(o => ({
                id: o.id?.toString() || '',
                name: o.name || '',
              }))}
            />
          </div>

          {/* First Name */}
          <div className="w-full space-y-2">
            <Label>First Name*</Label>
            <Input
              value={formData.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
              required
            />
          </div>

          {/* Last Name */}
          <div className="w-full space-y-2">
            <Label>Last Name*</Label>
            <Input
              value={formData.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
              required
            />
          </div>

          {/* Is Loan Officer */}
          <div className="flex items-center gap-2">
            <input
              id="isLoanOfficer"
              type="checkbox"
              className="h-4 w-4"
              checked={formData.isLoanOfficer}
              onChange={e => handleChange('isLoanOfficer', e.target.checked)}
            />
            <Label htmlFor="isLoanOfficer">Is Loan Officer</Label>
          </div>

          {/* Mobile for SMS */}
          <div className="w-full space-y-2">
            <Label>Mobile Number for SMS</Label>
            <Input
              value={formData.mobileNo}
              onChange={e => handleChange('mobileNo', e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4"
              checked={formData.isActive}
              onChange={e => handleChange('isActive', e.target.checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Joining Date */}
          <div className="w-full space-y-2">
            <Label>Joining Date*</Label>
            <Input
              type="date"
              value={formData.joiningDate}
              onChange={e => handleChange('joiningDate', e.target.value)}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/employees')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !loaded}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditEmployees
