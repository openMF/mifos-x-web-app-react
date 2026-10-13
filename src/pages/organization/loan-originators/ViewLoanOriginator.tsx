/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
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
import fineract from '@/lib/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

import { apiErrorMessage, codeLabel, type LoanOriginator } from './types'

/** View Loan Originator, with Edit and Delete, as in the Angular web app */
const ViewLoanOriginator = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [originator, setOriginator] = useState<LoanOriginator | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fineract.get<LoanOriginator>(
          `v1/loan-originators/${id}`
        )
        setOriginator(res.data ?? {})
      } catch (err) {
        setError(apiErrorMessage(err, 'Failed to load the loan originator.'))
      }
    })()
  }, [id])

  const handleDelete = async () => {
    if (!id || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await fineract.delete(`v1/loan-originators/${id}`)
      navigate('/organization/loan-originators')
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete the loan originator.'))
      setDeleting(false)
    }
  }

  const rows: [string, string | undefined][] = [
    ['Name', originator?.name],
    ['External ID', originator?.externalId],
    ['Status', codeLabel(originator?.status)],
    ['Originator Type', codeLabel(originator?.originatorType?.name)],
    ['Channel Type', codeLabel(originator?.channelType?.name)],
  ]

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          {
            label: 'Manage Loan Originators',
            href: '/organization/loan-originators',
          },
          { label: originator?.name ?? id ?? '', current: true },
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
          onClick={() => navigate(`/organization/loan-originators/${id}/edit`)}
        >
          <FontAwesomeIcon icon={faPen} className="mr-2" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={deleting}
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the loan originator "
                {originator?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
                onClick={handleDelete}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {originator && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <span className="font-medium">{label}</span>
                <span>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewLoanOriginator
