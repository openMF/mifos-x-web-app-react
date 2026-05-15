/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  type GetUsersTemplateResponse,
  type StaffData,
  type PostUsersRequest,
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
    'Failed to create user'
  )
}

const CreateUsers = () => {
  const [users, setUsers] = useState<GetUsersTemplateResponse>()
  const [staff, setStaff] = useState<StaffData[] | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    passwordNeverExpiers: false,
    sendPasswordToEmail: false,
    office: '',
    staff: '',
    roles: '',
    password: '',
    repeatPassword: '',
  })

  const showPassword = !formData.sendPasswordToEmail
  const passwordShort =
    showPassword &&
    formData.password.length > 0 &&
    formData.password.length < 12

  const passwordsDontMatch =
    showPassword &&
    formData.repeatPassword.length > 0 &&
    formData.password !== formData.repeatPassword

  // fetch template for offices, roles, etc.
  useEffect(() => {
    const fetchUserTemplate = async () => {
      try {
        const res = await userApi.template22()
        setUsers(res.data)
      } catch (err) {
        console.error('Failed to fetch user template', err)
      }
    }
    fetchUserTemplate()
  }, [])

  // fetch staff when office changes
  useEffect(() => {
    const fetchStaff = async () => {
      if (!formData.office) return
      try {
        const response = await staffApi.retrieveAll16()
        setStaff(response.data || [])
      } catch (err) {
        console.error('Failed to fetch staff', err)
      }
    }
    fetchStaff()
  }, [formData.office])

  const staffOptions = (staff || []).filter(
    option => option.officeId?.toString() === formData.office
  )

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const requiresStaff = staffOptions.length > 0

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

    if (showPassword) {
      if (!formData.password || !formData.repeatPassword) {
        alert('Please enter and confirm the password.')
        return
      }
      if (passwordShort || passwordsDontMatch) {
        alert('Please fix the password errors.')
        return
      }
    }

    const officeId = parseId(formData.office)
    const roleId = parseId(formData.roles)
    const staffId = formData.staff ? parseId(formData.staff) : undefined

    if (!officeId || !roleId || (formData.staff && !staffId)) {
      alert('Please select valid office, role, and staff values.')
      return
    }

    const payload: PostUsersRequest = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      firstname: formData.firstName.trim(),
      lastname: formData.lastName.trim(),
      officeId,
      roles: [roleId],
      staffId,
      passwordNeverExpires: formData.passwordNeverExpiers,
      sendPasswordToEmail: formData.sendPasswordToEmail,
      password: showPassword ? formData.password : undefined,
      repeatPassword: showPassword ? formData.repeatPassword : undefined,
    }

    try {
      await userApi.create15(payload)
      alert('User created successfully!')
      navigate('/appusers')
    } catch (err) {
      console.error('Failed to create user', err)
      alert(getUserErrorMessage(err))
    }
  }
  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Users', href: '/appusers' },
          { label: 'Create Users', current: true },
        ]}
      />

      <div className="p-8 bg-white dark:bg-zinc-900 rounded-md shadow border max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create User</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-6">
            <div className="w-full md:w-[48%] space-y-2">
              <Label>Username *</Label>
              <Input
                placeholder="Enter username"
                className="w-full"
                value={formData.username}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
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
                onCheckedChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    passwordNeverExpiers: value === true,
                  }))
                }
              />
              <Label htmlFor="manual-entries-1">Password never expires</Label>
            </div>
            <div className="w-full md:w-[48%] flex items-center gap-2">
              <Checkbox
                id="manual-entries-2"
                checked={formData.sendPasswordToEmail}
                onCheckedChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    sendPasswordToEmail: value === true,
                    password: value === true ? '' : prev.password,
                    repeatPassword: value === true ? '' : prev.repeatPassword,
                  }))
                }
              />
              <Label htmlFor="manual-entries-2">
                Send password to email address
              </Label>
            </div>
          </div>

          {showPassword && (
            <div className="flex flex-wrap gap-6">
              <div className="w-full md:w-[48%] space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  className={`w-full ${passwordShort ? 'border-red-500' : ''}`}
                  value={formData.password}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, password: e.target.value }))
                  }
                />
                {passwordShort && (
                  <p className="text-sm text-red-500">
                    Password must be at least 12 characters.
                  </p>
                )}
              </div>

              <div className="w-full md:w-[48%] space-y-2">
                <Label>Repeat Password *</Label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  className={`w-full ${passwordsDontMatch ? 'border-red-500' : ''}`}
                  value={formData.repeatPassword}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      repeatPassword: e.target.value,
                    }))
                  }
                />
                {passwordsDontMatch && (
                  <p className="text-sm text-red-500">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>
          )}

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
              className="cursor-pointer"
              onClick={() => navigate('/appusers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUsers
