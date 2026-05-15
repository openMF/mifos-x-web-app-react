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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  UsersApi,
  type GetUsersResponse as _GetUsersResponse, // Reserved for future use
  type GetUsersUserIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGear,
  faPenToSquare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

const usersApi = new UsersApi(getConfiguration()) // API

type UserApiErrorResponse = {
  defaultUserMessage?: string
  developerMessage?: string
  errors?: Array<{
    defaultUserMessage?: string
    developerMessage?: string
  }>
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
    'Failed to delete user'
  )
}

const ViewUsers = () => {
  const navigate = useNavigate()
  const { id } = useParams() // route param
  const [users, setUsers] = useState<GetUsersUserIdResponse | null>(null)

  // fetch user by id
  useEffect(() => {
    const fetchViewUsers = async () => {
      try {
        const response = await usersApi.retrieveOne31(Number(id))
        setUsers(response.data)
      } catch (err) {
        console.error('Failed to fetch User details', err)
      }
    }
    fetchViewUsers()
  }, [id])

  const handleDelete = async () => {
    if (!users?.id) return
    try {
      await usersApi.delete23(Number(users.id))
      alert('User deleted successfully!')
      navigate('/appusers')
    } catch (err) {
      console.error('Failed to delete user', err)
      alert(getUserErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting' },
          { label: 'Users', href: '/appusers' },
          { label: `${users?.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex justify-between">
          <div className="flex gap-4 mb-6">
            {/* edit */}
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              onClick={() => navigate(`/appusers/${users?.id}/edit`)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Edit
            </Button>

            {/* delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                  <FontAwesomeIcon icon={faTrash} />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete gl account
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    onClick={handleDelete}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* change password */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer">
                  <FontAwesomeIcon icon={faGear} />
                  Change Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete gl account
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          User Details
        </h2>

        {/* details grid */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Login Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {users?.username}
          </div>

          <div className="font-medium">First Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {users?.firstname}
          </div>

          <div className="font-medium">Last Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {users?.lastname}
          </div>

          <div className="font-medium">Email</div>
          <div className="text-zinc-600 dark:text-zinc-400">{users?.email}</div>

          <div className="font-medium">Roles</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {users?.selectedRoles?.length
              ? users.selectedRoles.map(role => role.name).join(', ')
              : '—'}
          </div>

          <div className="font-medium">Is Self Service</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {'Missing in OpenApi'}
          </div>
        </div>

        {/* back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/appusers')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewUsers
