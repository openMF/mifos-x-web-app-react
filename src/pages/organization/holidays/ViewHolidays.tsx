/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  faLockOpen,
  faPenToSquare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { HolidaysApi, type GetHolidaysResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'

const holidayApi = new HolidaysApi(getConfiguration())

const ViewHolidays = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [holiday, setHoliday] = useState<GetHolidaysResponse>()

  // fetch holiday details
  useEffect(() => {
    const fetchHoliday = async () => {
      try {
        const res = await holidayApi.retrieveOne7(Number(id))
        setHoliday(res.data)
      } catch (err) {
        console.error('Failed to fetch holiday', err)
      }
    }
    if (id) fetchHoliday()
  }, [id])

  // delete holiday
  const handleDelete = async () => {
    try {
      await holidayApi.delete6(Number(id))
      navigate('/organization/holidays')
    } catch (err) {
      console.error('Failed to delete Holiday', err)
    }
  }

  // enable holiday
  const handleEnable = async () => {
    try {
      await holidayApi.handleCommands1(Number(id), {}, 'activate')
      navigate('/organization/holidays')
    } catch (err) {
      console.error('Failed to enable Holiday', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Holidays', href: '/organization/holidays' },
          { label: holiday?.name || 'Holiday', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Action buttons */}
        <div className="flex max-w-2xl mx-auto mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/organization/holidays/${id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>

          {/* Delete dialog */}
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
                  Are you sure you want to delete holiday {holiday?.name}?
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

          {/* Enable dialog */}
          {holiday?.status?.value === 'Pending for activation' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                  <FontAwesomeIcon icon={faLockOpen} />
                  Enable
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Enable</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to enable holiday {holiday?.name}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    onClick={handleEnable}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Details section */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Holidays
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Name</div>
          <div>{holiday?.name || '—'}</div>

          <div className="font-medium">From Date</div>
          <div>
            {Array.isArray(holiday?.fromDate)
              ? format(
                  new Date(
                    holiday.fromDate[0],
                    holiday.fromDate[1] - 1,
                    holiday.fromDate[2]
                  ),
                  'dd MMMM yyyy'
                )
              : '—'}
          </div>

          <div className="font-medium">To Date</div>
          <div>
            {Array.isArray(holiday?.toDate)
              ? format(
                  new Date(
                    holiday.toDate[0],
                    holiday.toDate[1] - 1,
                    holiday.toDate[2]
                  ),
                  'dd MMMM yyyy'
                )
              : '—'}
          </div>

          <div className="font-medium">Repayments Scheduled To</div>
          <div>
            {Array.isArray(holiday?.repaymentsRescheduledTo)
              ? format(
                  new Date(
                    holiday.repaymentsRescheduledTo[0],
                    holiday.repaymentsRescheduledTo[1] - 1,
                    holiday.repaymentsRescheduledTo[2]
                  ),
                  'dd MMMM yyyy'
                )
              : '—'}
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/organization/holidays')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewHolidays
