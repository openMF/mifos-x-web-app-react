/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Lock, Plus, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type { ColumnDef, LoanDatatable } from './columns'

interface ColumnsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ids of the shown columns after the borrower, in order */
  visibleIds: string[]
  onChange: (ids: string[]) => void
  onReset: () => void
  resolve: (id: string) => ColumnDef | undefined
  loanFields: ColumnDef[]
  datatables: LoanDatatable[] | null
  datatablesFailed: boolean
  onRetry: () => void
  borrowerLabel: string
}

const ColumnsSheet = ({
  open,
  onOpenChange,
  visibleIds,
  onChange,
  onReset,
  resolve,
  loanFields,
  datatables,
  datatablesFailed,
  onRetry,
  borrowerLabel,
}: ColumnsSheetProps) => {
  const { t } = useTranslation('loans')
  const [search, setSearch] = useState('')

  const needle = search.trim().toLowerCase()
  const matches = (column: ColumnDef, groupLabel = '') =>
    !needle ||
    column.label.toLowerCase().includes(needle) ||
    groupLabel.toLowerCase().includes(needle)

  const tableLabel = (column: ColumnDef) =>
    datatables?.find(table => table.name === column.table)?.label

  // Columns whose datatable has not loaded yet stay in the saved order, but
  // only the ones that can be shown are listed.
  const shown = visibleIds.filter(id => resolve(id))

  const move = (id: string, step: -1 | 1) => {
    const target = shown[shown.indexOf(id) + step]
    if (!target) return
    const ids = [...visibleIds]
    const from = ids.indexOf(id)
    const to = ids.indexOf(target)
    ids[from] = target
    ids[to] = id
    onChange(ids)
  }

  const hide = (id: string) => onChange(visibleIds.filter(v => v !== id))
  const show = (id: string) => onChange([...visibleIds, id])

  const hiddenLoanFields = loanFields.filter(
    column => !visibleIds.includes(column.id) && matches(column)
  )
  const hiddenDatatables = (datatables ?? [])
    .map(table => ({
      ...table,
      columns: table.columns.filter(
        column =>
          !visibleIds.includes(column.id) && matches(column, table.label)
      ),
    }))
    .filter(table => table.columns.length > 0)

  const addButton = (column: ColumnDef) => (
    <li key={column.id}>
      <button
        type="button"
        onClick={() => show(column.id)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <Plus className="h-4 w-4 shrink-0 text-zinc-400" />
        {column.label}
      </button>
    </li>
  )

  const sectionTitle =
    'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md gap-0">
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-700">
          <SheetTitle>{t('list.columns')}</SheetTitle>
          <SheetDescription>{t('list.columnsHint')}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* shown columns, in order */}
          <section className="space-y-2">
            <h3 className={sectionTitle}>{t('list.visibleColumns')}</h3>
            <ol className="space-y-1">
              <li className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1.5 text-sm">
                <span className="font-medium">{borrowerLabel}</span>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Lock className="h-3 w-3" />
                  {t('list.alwaysShown')}
                </span>
              </li>
              {shown.map((id, index) => {
                const column = resolve(id) as ColumnDef
                const group = tableLabel(column)
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{column.label}</span>
                      {group && (
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {group}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => move(id, -1)}
                        aria-label={t('list.moveUp', { column: column.label })}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === shown.length - 1}
                        onClick={() => move(id, 1)}
                        aria-label={t('list.moveDown', {
                          column: column.label,
                        })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => hide(id)}
                        aria-label={t('list.hideColumn', {
                          column: column.label,
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* columns that can be added */}
          <section className="space-y-3">
            <h3 className={sectionTitle}>{t('list.addColumns')}</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('list.searchFields')}
                aria-label={t('list.searchFields')}
                className="pl-9"
              />
            </div>

            {hiddenLoanFields.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('list.loanFields')}</p>
                <ul>{hiddenLoanFields.map(addButton)}</ul>
              </div>
            )}

            {hiddenDatatables.map(table => (
              <div key={table.name} className="space-y-1">
                <p className="text-sm font-medium">{table.label}</p>
                <ul>{table.columns.map(addButton)}</ul>
              </div>
            ))}

            {datatables === null && !datatablesFailed && (
              <p className="text-sm text-zinc-500">
                {t('list.datatablesLoading')}
              </p>
            )}
            {datatablesFailed && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('list.datatablesFailed')}{' '}
                <button
                  type="button"
                  onClick={onRetry}
                  className="underline cursor-pointer"
                >
                  {t('list.retry')}
                </button>
              </p>
            )}
            {needle &&
              hiddenLoanFields.length === 0 &&
              hiddenDatatables.length === 0 && (
                <p className="text-sm text-zinc-500">
                  {t('list.noMatchingFields')}
                </p>
              )}
          </section>
        </div>

        <SheetFooter className="border-t border-zinc-200 dark:border-zinc-700">
          <Button variant="outline" onClick={onReset}>
            {t('list.resetColumns')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ColumnsSheet
