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

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  StaffApi,
  UsersApi,
  type GetUsersResponse,
  type GetUsersTemplateResponse,
  type StaffData,
  type PutUsersUserIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const userApi = new UsersApi(getConfiguration())
const staffApi = new StaffApi(getConfiguration())

type UserApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
}

const parseId = (value: string) => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

const getUserErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<UserApiErrorResponse>
  const responseData = axiosError.response?.data

  return (
    responseData?.errors?.[0]?.defaultUserMessage ||
    responseData?.errors?.[0]?.developerMessage ||
    responseData?.defaultUserMessage ||
    responseData?.developerMessage ||
    axiosError.message ||
    'Failed to update user'
  )
}

const EditUsers = () => {
  const [users, setUsers] = useState<GetUsersTemplateResponse>()
  const [staff, setStaff] = useState<StaffData[] | null>(null)
  const [_user, setUser] = useState<GetUsersResponse | null>(null) // Reserved for future use: _user
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    passwordNeverExpiers: false,
    sendPasswordToEmail: true,
    office: '',
    staff: '',
    roles: '',
  })

  const { id } = useParams()
  const navigate = useNavigate()

  // fetch template
  useEffect(() => {
    userApi
      .template22()
      .then(res => setUsers(res.data))
      .catch(console.error)
  }, [])

  // fetch staff list when office changes
  useEffect(() => {
    if (!formData.office) return
    staffApi
      .retrieveAll16()
      .then(res => setStaff(res.data || []))
      .catch(console.error)
  }, [formData.office])

  const staffOptions = (staff || []).filter(
    option => option.officeId?.toString() === formData.office
  )

  // fetch user details for editing
  useEffect(() => {
    if (!id) return
    userApi
      .retrieveOne31(Number(id))
      .then(res => {
        const data = res.data
        setUser(data)
        setFormData(prev => ({
          ...prev,
          username: data.username || '',
          email: data.email || '',
          firstName: data.firstname || '',
          lastName: data.lastname || '',
          office: data.officeId?.toString() || '',
          staff: data.staff?.toString() || '',
          roles: data.selectedRoles?.[0]?.id?.toString() || '',
          passwordNeverExpiers: data.passwordNeverExpires || false,
        }))
      })
      .catch(console.error)
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) return

    const requiresStaff = staffOptions.length > 0

    // basic validation
    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.office ||
      !formData.roles ||
      (requiresStaff && !formData.staff)
    ) {
      alert('Please fill all required fields.')
      return
    }

    const officeId = parseId(formData.office)
    const roleId = parseId(formData.roles)
    const staffId = formData.staff ? parseId(formData.staff) : undefined

    if (!officeId || !roleId || (formData.staff && !staffId)) {
      alert('Please select valid office, role, and staff values.')
      return
    }

    const payload: PutUsersUserIdRequest = {
      email: formData.email.trim(),
      firstname: formData.firstName.trim(),
      lastname: formData.lastName.trim(),
      officeId,
      roles: [roleId],
      staffId,
    }

    try {
      await userApi.update26(Number(id), payload)
      alert('User updated successfully!')
      navigate('/appusers')
    } catch (err) {
      console.error('Failed to update user', err)
      alert(getUserErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Users', href: '/appusers' },
          { label: 'Edit User', current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit User</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Username *</Label>
              <Input
                placeholder="Enter username"
                className="w-full"
                value={formData.username}
                disabled
              />
            </div>
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Email *</Label>
              <Input
                placeholder="Enter email"
                className="w-full"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>First Name *</Label>
              <Input
                placeholder="Enter First Name"
                className="w-full"
                value={formData.firstName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Last Name *</Label>
              <Input
                placeholder="Enter Last Name"
                className="w-full"
                value={formData.lastName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] flex items-center gap-2">
              <Checkbox
                id="manual-entries-1"
                checked={formData.passwordNeverExpiers}
                disabled
              />
              <Label htmlFor="manual-entries-1">Password never expires</Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Office *"
              selectValue={formData.office}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, office: value, staff: '' }))
              }
              selectPlaceholder="Select office"
              selectOptions={(users?.allowedOffices || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />

            <AppSelect
              selectLabel="Staff *"
              selectValue={formData.staff}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, staff: value }))
              }
              selectPlaceholder="Select staff"
              selectOptions={staffOptions.map(option => ({
                id: option.id!,
                name: option.displayName!,
              }))}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <AppSelect
              selectLabel="Roles *"
              selectValue={formData.roles}
              selectOnChange={value =>
                setFormData(prev => ({ ...prev, roles: value }))
              }
              selectPlaceholder="Select role"
              selectOptions={(users?.availableRoles || [])
                .filter(option => option.id !== undefined)
                .map(option => ({
                  id: option.id!,
                  name: option.name!,
                }))}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/appusers/${id}`)}
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

export default EditUsers
