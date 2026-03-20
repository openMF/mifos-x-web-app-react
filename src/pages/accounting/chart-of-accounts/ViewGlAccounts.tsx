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

import {
  GeneralLedgerAccountApi,
  type GetGLAccountsResponse,
  type PutGLAccountsRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { Plus } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock,
  faLockOpen,
  faPenToSquare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

//gl accounts base api
const glApi = new GeneralLedgerAccountApi(getConfiguration())

const ViewGlAccounts = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  //store the gl account detials
  const [account, setAccount] = useState<GetGLAccountsResponse>()

  //api call for GL account
  useEffect(() => {
    const fetchViewGlAccounts = async () => {
      try {
        const response = await glApi.retreiveAccount(Number(id))
        setAccount(response.data)
      } catch (err) {
        console.error('Failed to get Gl Account Details', err)
      }
    }
    fetchViewGlAccounts()
  }, [id])

  if (!account) return <div className="p-10 text-center">Loading...</div>

  //Function to delete the gl account
  const handleDelete = async () => {
    try {
      await glApi.deleteGLAccount1(Number(id))
      navigate('/accounting/chart-of-accounts')
    } catch (err) {
      console.error('Failed to delete Gl account', err)
    }
  }

  //Funtion the disable/enable the gl account
  const handleDisable = async () => {
    try {
      const updated: PutGLAccountsRequest = {
        disabled: !account.disabled,
      }
      await glApi.updateGLAccount1(Number(id), updated)
      setAccount(prev => ({ ...prev!, disabled: !prev?.disabled }))
    } catch (err) {
      console.error('Failed to update disable state', err)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}

      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
          { label: `${account.name}`, current: true },
        ]}
      />

      {/* Account Info Card */}
      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex justify-between">
          <div className="flex gap-4 mb-6">
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
              onClick={() =>
                navigate(
                  `/accounting/chart-of-accounts/gl-accounts/view/${account.id}/edit`
                )
              }
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Edit
            </Button>
            <Button
              onClick={handleDisable}
              className={`text-white cursor-pointer ${account.disabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {account.disabled ? (
                <>
                  <FontAwesomeIcon icon={faLockOpen} className="mr-2" />
                  Enable
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLock} className="mr-2" />
                  Disable
                </>
              )}
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
                    Are you sure you want to delete gl account {account.name} ?
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
          {account.usage?.value === 'HEADER' && (
            <div>
              <Button
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                onClick={() =>
                  navigate(
                    `/accounting/chart-of-accounts/gl-accounts/create?parent=${account.id}&accountType=${account.type?.id}`
                  )
                }
              >
                <Plus />
                Subledger Account
              </Button>
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          GL Account Details
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Account Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {account.type?.value}
          </div>

          <div className="font-medium">GL Code</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {account.glCode}
          </div>

          <div className="font-medium">Account Usage</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {account.usage?.value}
          </div>

          <div className="font-medium">Manual Entries Allowed</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {account.manualEntriesAllowed ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/accounting/chart-of-accounts')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewGlAccounts
