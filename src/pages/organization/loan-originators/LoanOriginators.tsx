/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import fineract from '@/lib/axios'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

import { apiErrorMessage, codeLabel, type LoanOriginator } from './types'

const PAGE_SIZE = 10

/** Organization > Manage Loan Originators, as in the Angular web app */
const LoanOriginators = () => {
  const navigate = useNavigate()

  const [originators, setOriginators] = useState<LoanOriginator[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<LoanOriginator | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fineract.get<LoanOriginator[]>('v1/loan-originators')
      setOriginators(res.data ?? [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load loan originators.'))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!pendingDelete?.id || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await fineract.delete(`v1/loan-originators/${pendingDelete.id}`)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete the loan originator.'))
    } finally {
      setPendingDelete(null)
      setDeleting(false)
    }
  }

  // Filter + pagination
  const term = searchTerm.toLowerCase()
  const filtered = originators.filter(o =>
    [
      o.name,
      o.externalId,
      codeLabel(o.status),
      codeLabel(o.originatorType?.name),
      codeLabel(o.channelType?.name),
    ].some(v =>
      String(v ?? '')
        .toLowerCase()
        .includes(term)
    )
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // A delete can empty the last page, so never show a page past the end
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Loan Originators', current: true },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/loan-originators/create')}
        >
          <Plus className="mr-2" /> Create Loan Originator
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
        <Input
          placeholder="Filter"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="max-w-sm h-11 text-base"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Table>
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
            Showing {paginated.length} of {filtered.length} items • Page{' '}
            {currentPage} of {totalPages}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">ID</TableHead>
              <TableHead className="px-6 py-4">Name</TableHead>
              <TableHead className="px-6 py-4">External ID</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
              <TableHead className="px-6 py-4">Originator Type</TableHead>
              <TableHead className="px-6 py-4">Channel Type</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(o => (
              <TableRow
                key={o.id}
                className="text-base hover:bg-muted cursor-pointer"
                onClick={() =>
                  navigate(`/organization/loan-originators/${o.id}`)
                }
              >
                <TableCell className="px-6 py-4">{o.id}</TableCell>
                <TableCell className="px-6 py-4">{o.name}</TableCell>
                <TableCell className="px-6 py-4">{o.externalId}</TableCell>
                <TableCell className="px-6 py-4">
                  {codeLabel(o.status)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {codeLabel(o.originatorType?.name) || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {codeLabel(o.channelType?.name) || '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${o.name}`}
                    disabled={deleting}
                    onClick={e => {
                      // Do not open the originator as well
                      e.stopPropagation()
                      setPendingDelete(o)
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => {
          if (!open && !deleting) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the loan originator "
              {pendingDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={e => {
                // Keep the dialog open until the request finishes
                e.preventDefault()
                handleDelete()
              }}
            >
              {deleting ? 'Deleting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LoanOriginators
