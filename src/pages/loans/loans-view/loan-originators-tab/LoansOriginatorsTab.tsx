/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
} from '@/components/ui/alert-dialog'
import fineract from '@/lib/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

import {
  apiErrorMessage,
  codeLabel,
  type LoanOriginator,
} from '@/pages/organization/loan-originators/types'
import {
  canChangeOriginators,
  type LoanOriginatorsResponse,
  type LoansViewOutletContext,
} from './originators'

/** Loan account > Originators tab, as in the Angular web app */
const LoansOriginatorsTab = () => {
  const { loanId } = useParams()
  const context = useOutletContext<LoansViewOutletContext | undefined>()
  const canDetach =
    Boolean(context?.canDetachOriginator) && canChangeOriginators(context?.loan)

  const [originators, setOriginators] = useState<LoanOriginator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDetach, setPendingDetach] = useState<LoanOriginator | null>(
    null
  )
  const [detaching, setDetaching] = useState(false)

  const load = useCallback(async () => {
    if (!loanId) return
    setError(null)
    try {
      const res = await fineract.get<LoanOriginatorsResponse>(
        `v1/loans/${loanId}/originators`
      )
      setOriginators(res.data?.originators ?? [])
    } catch (err) {
      setOriginators([])
      setError(apiErrorMessage(err, 'Failed to load the loan originators.'))
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    load()
  }, [load])

  const handleDetach = async () => {
    if (!pendingDetach?.id || detaching) return
    setDetaching(true)
    setError(null)
    try {
      await fineract.delete(
        `v1/loans/${loanId}/originators/${pendingDetach.id}`
      )
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to detach the loan originator.'))
    } finally {
      setPendingDetach(null)
      setDetaching(false)
    }
  }

  return (
    <div className="bg-transparent">
      <h3 className="text-lg font-semibold text-black dark:text-white p-4">
        Loan Originators
      </h3>

      {error && (
        <div className="mx-4 mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">ID</TableHead>
            <TableHead className="px-4 py-2">External ID</TableHead>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Status</TableHead>
            <TableHead className="px-4 py-2">Originator Type</TableHead>
            <TableHead className="px-4 py-2">Channel Type</TableHead>
            {canDetach && <TableHead className="px-4 py-2">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell
                colSpan={canDetach ? 7 : 6}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && !error && originators.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canDetach ? 7 : 6}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No loan originators attached
              </TableCell>
            </TableRow>
          )}
          {originators.map(o => (
            <TableRow key={o.id}>
              <TableCell className="px-4 py-2">{o.id}</TableCell>
              <TableCell className="px-4 py-2">{o.externalId}</TableCell>
              <TableCell className="px-4 py-2">{o.name}</TableCell>
              <TableCell className="px-4 py-2">{codeLabel(o.status)}</TableCell>
              <TableCell className="px-4 py-2">
                {codeLabel(o.originatorType?.name) || '—'}
              </TableCell>
              <TableCell className="px-4 py-2">
                {codeLabel(o.channelType?.name) || '—'}
              </TableCell>
              {canDetach && (
                <TableCell className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Detach ${o.name}`}
                    disabled={detaching}
                    onClick={() => setPendingDetach(o)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDetach !== null}
        onOpenChange={open => {
          if (!open && !detaching) setPendingDetach(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detach Loan Originator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to detach "{pendingDetach?.name}" from this
              loan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={detaching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={detaching}
              onClick={e => {
                // Keep the dialog open until the request finishes
                e.preventDefault()
                handleDetach()
              }}
            >
              {detaching ? 'Detaching...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LoansOriginatorsTab
