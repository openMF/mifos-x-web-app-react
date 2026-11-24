/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AppSelect from '@/components/custom/select/AppSelect'
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
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MakerCheckerOr4EyeFunctionalityApi,
  type AuditSearchData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatAuditDateTime } from '@/pages/system/audit-trails/format'
import type {
  AuditAppUser,
  AuditEntry,
} from '@/pages/system/audit-trails/types'

import {
  ANY,
  actionLabels,
  apiErrorMessage,
  checkerInboxQuery,
  emptyFilters,
  filtersError,
  runBulkAction,
  type BulkActionResult,
  type CheckerAction,
  type CheckerInboxFilters,
} from './checker-inbox'

const makerCheckerApi = new MakerCheckerOr4EyeFunctionalityApi(
  getConfiguration()
)

const withAny = (options: { id: string; name: string }[]) => [
  { id: ANY, name: 'Any' },
  ...options,
]

const confirmText: Record<CheckerAction, string> = {
  approve: 'Fineract will run the selected actions.',
  reject:
    'The selected actions will not be run. They stay in the audit trail as rejected.',
  delete:
    'The selected actions will be removed. Unlike approving or rejecting, deleting does not keep them in the audit trail.',
}

/**
 * Theme button styles, from the primary action to the irreversible one:
 * Reject keeps a record of the action, Delete removes it.
 */
const actionVariant: Record<
  CheckerAction,
  'default' | 'outline' | 'destructive'
> = {
  approve: 'default',
  reject: 'outline',
  delete: 'destructive',
}

/**
 * Checker Inbox & Tasks > Checker Inbox: the actions maker-checker holds for
 * approval (GET /makercheckers, GET /makercheckers/searchtemplate). The
 * checker approves, rejects or deletes the selected ones, as in the Angular
 * web app.
 */
const CheckerInboxContent = () => {
  const [template, setTemplate] = useState<AuditSearchData>({})
  const [filters, setFilters] = useState<CheckerInboxFilters>(emptyFilters)
  const [applied, setApplied] = useState<CheckerInboxFilters>(emptyFilters)
  const [reloadKey, setReloadKey] = useState(0)
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [pendingAction, setPendingAction] = useState<CheckerAction | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<BulkActionResult | null>(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await makerCheckerApi.retrieveAuditSearchTemplate1()
        setTemplate(res.data ?? {})
      } catch (err) {
        console.error('Failed to fetch the checker inbox search template', err)
      }
    }
    fetchTemplate()
  }, [])

  useEffect(() => {
    // Ignore a response that arrives after the filters changed
    let ignore = false
    const fetchEntries = async () => {
      // The selection belongs to the previous results, so drop it before
      // the new ones arrive
      setSelected([])
      setLoading(true)
      setError(null)
      try {
        const query = checkerInboxQuery(applied)
        const res = await makerCheckerApi.retrieveCommands(
          query.actionName,
          query.entityName,
          query.resourceId,
          query.makerId,
          query.makerDateTimeFrom,
          query.makerDateTimeTo
        )
        if (ignore) return
        // The generated client types the entries as AuditData, which has
        // none of the fields Fineract sends (see ISSUES.md)
        setEntries((res.data ?? []) as unknown as AuditEntry[])
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch the checker inbox', err)
        setEntries([])
        setError(apiErrorMessage(err, 'Failed to load the checker inbox.'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchEntries()
    return () => {
      ignore = true
    }
  }, [applied, reloadKey])

  const setFilter = (key: keyof CheckerInboxFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const message = filtersError(filters)
    if (message) {
      setError(message)
      return
    }
    setResult(null)
    setApplied({ ...filters })
  }

  const handleReset = () => {
    setResult(null)
    setFilters(emptyFilters)
    setApplied({ ...emptyFilters })
  }

  const ids = entries
    .map(entry => entry.id)
    .filter((id): id is number => id !== undefined)
  const allSelected = ids.length > 0 && selected.length === ids.length
  const filtered = Object.values(checkerInboxQuery(applied)).some(
    value => value !== undefined
  )

  const toggle = (id: number) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )

  const handleConfirm = async () => {
    if (!pendingAction || processing || loading || selected.length === 0) return
    setProcessing(true)
    setResult(null)
    try {
      const outcome = await runBulkAction(pendingAction, selected, id =>
        pendingAction === 'delete'
          ? makerCheckerApi.deleteMakerCheckerEntry(id)
          : makerCheckerApi.approveMakerCheckerEntry(id, pendingAction)
      )
      setResult(outcome)
    } finally {
      setPendingAction(null)
      setProcessing(false)
      setReloadKey(key => key + 1)
    }
  }

  const userOptions = withAny(
    ((template.appUsers ?? []) as AuditAppUser[]).map(user => ({
      id: user.id?.toString() ?? '',
      name: user.username ?? '',
    }))
  )

  const actionButton = (action: CheckerAction) => (
    <Button
      type="button"
      variant={actionVariant[action]}
      disabled={selected.length === 0 || processing || loading}
      onClick={() => setPendingAction(action)}
    >
      {actionLabels[action].verb}
    </Button>
  )

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSearch}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppSelect
            selectLabel="Maker"
            selectPlaceholder="Any"
            selectValue={filters.makerId}
            selectOnChange={value => setFilter('makerId', value)}
            selectClassname="w-full space-y-2"
            selectOptions={userOptions}
          />
          <AppSelect
            selectLabel="Action"
            selectPlaceholder="Any"
            selectValue={filters.actionName}
            selectOnChange={value => setFilter('actionName', value)}
            selectClassname="w-full space-y-2"
            selectOptions={withAny(
              (template.actionNames ?? []).map(name => ({ id: name, name }))
            )}
          />
          <AppSelect
            selectLabel="Entity"
            selectPlaceholder="Any"
            selectValue={filters.entityName}
            selectOnChange={value => setFilter('entityName', value)}
            selectClassname="w-full space-y-2"
            selectOptions={withAny(
              (template.entityNames ?? []).map(name => ({ id: name, name }))
            )}
          />
          <div className="w-full space-y-2">
            <Label htmlFor="checkerInboxResourceId">Resource ID</Label>
            <Input
              id="checkerInboxResourceId"
              type="number"
              min={1}
              value={filters.resourceId}
              onChange={e => setFilter('resourceId', e.target.value)}
            />
          </div>
          <div className="w-full space-y-2">
            <Label htmlFor="checkerInboxFromDate">From Date</Label>
            <Input
              id="checkerInboxFromDate"
              type="date"
              value={filters.fromDate}
              onChange={e => setFilter('fromDate', e.target.value)}
            />
          </div>
          <div className="w-full space-y-2">
            <Label htmlFor="checkerInboxToDate">To Date</Label>
            <Input
              id="checkerInboxToDate"
              type="date"
              value={filters.toDate}
              onChange={e => setFilter('toDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          >
            Search
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div
          role="status"
          className={
            result.failed.length
              ? 'rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200'
              : 'rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200'
          }
        >
          <p>
            {actionLabels[result.action].past} {result.succeeded} of{' '}
            {result.succeeded + result.failed.length}{' '}
            {result.succeeded + result.failed.length === 1
              ? 'entry'
              : 'entries'}
            .
          </p>
          {result.failed.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {result.failed.map(failure => (
                <li key={failure.id}>
                  Entry {failure.id}: {failure.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {selected.length === 0
            ? 'Select entries to approve, reject or delete them.'
            : `${selected.length} of ${ids.length} ${
                ids.length === 1 ? 'entry' : 'entries'
              } selected`}
        </p>
        <div className="flex flex-wrap gap-2">
          {actionButton('approve')}
          {actionButton('reject')}
          {actionButton('delete')}
        </div>
      </div>

      <div className="rounded-md border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all entries"
                  checked={allSelected}
                  disabled={ids.length === 0 || processing || loading}
                  onCheckedChange={() => setSelected(allSelected ? [] : ids)}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Made On</TableHead>
              <TableHead>Maker</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-6 text-muted-foreground"
                >
                  {error
                    ? ''
                    : filtered
                      ? 'No actions waiting for approval match these filters.'
                      : 'No actions are waiting for approval.'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id} className="hover:bg-muted">
                  <TableCell>
                    {entry.id !== undefined && (
                      <Checkbox
                        aria-label={`Select entry ${entry.id}`}
                        checked={selected.includes(entry.id)}
                        disabled={processing}
                        onCheckedChange={() => toggle(entry.id as number)}
                      />
                    )}
                  </TableCell>
                  <TableCell>{entry.id}</TableCell>
                  <TableCell>{formatAuditDateTime(entry.madeOnDate)}</TableCell>
                  <TableCell>{entry.maker}</TableCell>
                  <TableCell>{entry.actionName}</TableCell>
                  <TableCell>{entry.entityName}</TableCell>
                  <TableCell>{entry.resourceId}</TableCell>
                  <TableCell>
                    <Link
                      to={`/system/audit-trails/${entry.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={open => {
          if (!open && !processing) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction && actionLabels[pendingAction].verb}{' '}
              {selected.length} {selected.length === 1 ? 'entry' : 'entries'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction && confirmText[pendingAction]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({
                variant: pendingAction === 'delete' ? 'destructive' : 'default',
              })}
              disabled={processing}
              onClick={e => {
                // Keep the dialog open until every request finishes
                e.preventDefault()
                handleConfirm()
              }}
            >
              {pendingAction &&
                (processing
                  ? actionLabels[pendingAction].progress
                  : actionLabels[pendingAction].verb)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CheckerInboxContent
