/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import { TellerCashManagementApi, type TellerData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

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

const tellersApi = new TellerCashManagementApi(getConfiguration())

const ViewTellers = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [teller, setTeller] = useState<TellerData>()

  // fetch teller details
  useEffect(() => {
    const fetchTeller = async () => {
      try {
        const res = await tellersApi.findTeller(Number(id))
        setTeller(res.data)
      } catch (err) {
        console.error('Failed to fetch teller', err)
      }
    }
    fetchTeller()
  }, [id])

  // delete teller and redirect
  const handleDelete = async () => {
    try {
      await tellersApi.deleteTeller(Number(id))
      navigate('/organization/tellers')
    } catch (err) {
      console.error('Failed to delete Teller', err)
    }
  }

  if (!teller) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Tellers', href: '/organization/tellers' },
          { label: `${teller.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* edit + delete actions */}
        <div className="flex max-w-2xl mx-auto mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            onClick={() => navigate(`/organization/tellers/${teller.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>
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
                  Are you sure you want to delete teller {teller.name}?
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
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Teller
        </h2>

        {/* teller details */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Teller Name</div>
          <div>{teller.name || '—'}</div>

          <div className="font-medium">Office</div>
          <div>{teller.officeName || '—'}</div>

          <div className="font-medium">Description</div>
          <div>{teller.description || '—'}</div>

          <div className="font-medium">Start Date</div>
          <div>{teller.startDate}</div>

          <div className="font-medium">End Date</div>
          <div>{teller.endDate}</div>

          <div className="font-medium">Status</div>
          <div>{teller.status || '—'}</div>
        </div>

        {/* back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/organization/tellers')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewTellers
