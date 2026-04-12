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

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { ChargesApi, type GetChargesResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'

// API instance
const chargesApi = new ChargesApi(getConfiguration())

const ViewCharges = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  // Holds current charge details
  const [charge, setCharge] = useState<GetChargesResponse>()

  // Fetch charge details when component loads
  useEffect(() => {
    const fetchCharge = async () => {
      try {
        const res = await chargesApi.retrieveCharge(Number(id))
        setCharge(res.data)
      } catch (err) {
        console.error('Failed to fetch charge', err)
      }
    }
    fetchCharge()
  }, [id])

  if (!charge) return <div className="p-10 text-center">Loading...</div>

  // Handle delete charge
  const handleDelete = async () => {
    try {
      await chargesApi.deleteCharge(Number(id))
      navigate('/products/charges')
    } catch (err) {
      console.error('Failed to delete charge', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          { label: 'Charges', href: '/products/charges' },
          { label: `${charge.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* Action buttons */}
        <div className="flex mb-6 gap-4">
          {/* Edit button */}
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            onClick={() => navigate(`/products/charges/${charge.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit
          </Button>

          {/* Delete button with confirmation dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                <FontAwesomeIcon icon={faTrash} /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete charge {charge.name}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Page Heading */}
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Charge Details
        </h2>

        {/* Charge details grid */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Charge Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">{charge.name}</div>

          <div className="font-medium">Charge Applies To</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.chargeAppliesTo?.code
              ?.split('.')
              .pop()
              ?.replace(/^\w/, c => c.toUpperCase())}
          </div>

          <div className="font-medium">Penalty</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.penalty ? 'Yes' : 'No'}
          </div>

          <div className="font-medium">Currency</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.currency?.name}
          </div>

          <div className="font-medium">Amount</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.amount}
          </div>

          <div className="font-medium">Charge Time Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.chargeTimeType?.code
              ?.split('.')
              .pop()
              ?.replace(/^\w/, c => c.toUpperCase())}
          </div>

          <div className="font-medium">Charge Calculation Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.chargeCalculationType?.code
              ?.split('.')
              .pop()
              ?.replace(/^\w/, c => c.toUpperCase())}
          </div>

          <div className="font-medium">Charge Payment Mode</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.chargePaymentMode?.code
              ?.split('.')
              .pop()
              ?.replace(/^\w/, c => c.toUpperCase())}
          </div>

          <div className="font-medium">Active</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {charge.active ? 'Yes' : 'No'}
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/products/charges')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewCharges
