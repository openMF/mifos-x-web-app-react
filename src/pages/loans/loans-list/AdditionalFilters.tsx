/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ColumnDef, LoanDatatable } from './columns'
import type { ActiveFilter } from './filters'

interface AdditionalFiltersProps {
  filters: ActiveFilter[]
  resolve: (id: string) => ColumnDef | undefined
  loanFields: ColumnDef[]
  datatables: LoanDatatable[] | null
  datatablesFailed: boolean
  loadingTables: string[]
  onRetry: () => void
  /** Called when the picker opens, so the datatable list can be loaded */
  onPickerOpen: () => void
  onAdd: (column: ColumnDef) => void
  onChange: (filter: ActiveFilter) => void
  onRemove: (uid: number) => void
}

/** Select value standing for "either", since Radix rejects an empty one */
const ANY = 'any'

const AdditionalFilters = ({
  filters,
  resolve,
  loanFields,
  datatables,
  datatablesFailed,
  loadingTables,
  onRetry,
  onPickerOpen,
  onAdd,
  onChange,
  onRemove,
}: AdditionalFiltersProps) => {
  const { t } = useTranslation('loans')
  const { t: tc } = useTranslation('common')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = new Set(filters.map(filter => filter.columnId))
  const needle = search.trim().toLowerCase()
  const available = (columns: ColumnDef[], groupLabel = '') =>
    columns.filter(
      column =>
        column.filterable &&
        !filtered.has(column.id) &&
        (!needle ||
          column.label.toLowerCase().includes(needle) ||
          groupLabel.toLowerCase().includes(needle))
    )

  const pickerFields = available(loanFields)
  const pickerTables = (datatables ?? [])
    .map(table => ({
      ...table,
      columns: available(table.columns, table.label),
    }))
    .filter(table => table.columns.length > 0)

  const add = (column: ColumnDef) => {
    onAdd(column)
    setPickerOpen(false)
    setSearch('')
  }

  const pickerItem = (column: ColumnDef) => (
    <li key={column.id}>
      <button
        type="button"
        onClick={() => add(column)}
        className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
      >
        {column.label}
      </button>
    </li>
  )

  const control = (filter: ActiveFilter, column: ColumnDef) => {
    const id = `loans-filter-${filter.uid}`
    const set = (patch: Partial<ActiveFilter>) =>
      onChange({ ...filter, ...patch })

    switch (filter.type) {
      case 'text':
        return (
          <Input
            id={id}
            value={filter.text}
            onChange={e => set({ text: e.target.value })}
            placeholder={t('list.contains')}
            aria-label={`${column.label}: ${t('list.contains')}`}
          />
        )

      case 'number':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={filter.min}
              onChange={e => set({ min: e.target.value })}
              placeholder={t('list.min')}
              aria-label={`${column.label}: ${t('list.min')}`}
            />
            <Input
              type="number"
              value={filter.max}
              onChange={e => set({ max: e.target.value })}
              placeholder={t('list.max')}
              aria-label={`${column.label}: ${t('list.max')}`}
            />
          </div>
        )

      case 'date':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${id}-from`} className="text-xs">
                {t('list.from')}
              </Label>
              <Input
                id={`${id}-from`}
                type="date"
                value={filter.from}
                max={filter.to || undefined}
                onChange={e => set({ from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${id}-to`} className="text-xs">
                {t('list.to')}
              </Label>
              <Input
                id={`${id}-to`}
                type="date"
                value={filter.to}
                min={filter.from || undefined}
                onChange={e => set({ to: e.target.value })}
              />
            </div>
          </div>
        )

      case 'boolean':
        return (
          <Select
            value={filter.bool || ANY}
            onValueChange={v =>
              set({ bool: v === ANY ? '' : (v as 'yes' | 'no') })
            }
          >
            <SelectTrigger id={id} className="w-full" aria-label={column.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t('list.any')}</SelectItem>
              <SelectItem value="yes">{tc('actions.yes')}</SelectItem>
              <SelectItem value="no">{tc('actions.no')}</SelectItem>
            </SelectContent>
          </Select>
        )

      case 'select':
        return (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {(column.options ?? []).map((option, index) => {
              const optionId = `${id}-${index}`
              return (
                <li key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={optionId}
                    checked={filter.values.includes(option)}
                    onCheckedChange={checked =>
                      set({
                        values: checked
                          ? [...filter.values, option]
                          : filter.values.filter(value => value !== option),
                      })
                    }
                  />
                  <Label htmlFor={optionId} className="font-normal">
                    {option}
                  </Label>
                </li>
              )
            })}
          </ul>
        )
    }
  }

  const tableLabel = (column: ColumnDef) =>
    datatables?.find(table => table.name === column.table)?.label

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {t('list.additionalFilters')}
      </h3>

      {filters.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('list.noAdditionalFilters')}
        </p>
      )}

      {filters.map(filter => {
        const column = resolve(filter.columnId)
        if (!column) return null
        const group = tableLabel(column)
        return (
          <div
            key={filter.uid}
            className="space-y-2 rounded-md border border-zinc-200 dark:border-zinc-700 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-sm">
                <span className="block font-medium">{column.label}</span>
                {group && (
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {group}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(filter.uid)}
                aria-label={t('list.removeFilter', { field: column.label })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {control(filter, column)}
            {column.table && loadingTables.includes(column.table) && (
              <p className="text-xs text-zinc-500">{t('list.loadingValues')}</p>
            )}
          </div>
        )
      })}

      <Popover
        open={pickerOpen}
        onOpenChange={open => {
          setPickerOpen(open)
          if (open) onPickerOpen()
          else setSearch('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-dashed text-[#1074b9] dark:text-sky-400"
          >
            <Plus className="h-4 w-4" />
            {t('list.addFilter')}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('list.searchFields')}
              aria-label={t('list.searchFields')}
              className="pl-9"
            />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {pickerFields.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t('list.loanFields')}
                </p>
                <ul>{pickerFields.map(pickerItem)}</ul>
              </div>
            )}
            {pickerTables.map(table => (
              <div key={table.name}>
                <p className="px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {table.label}
                </p>
                <ul>{table.columns.map(pickerItem)}</ul>
              </div>
            ))}
            {datatables === null && !datatablesFailed && (
              <p className="px-2 py-1 text-sm text-zinc-500">
                {t('list.datatablesLoading')}
              </p>
            )}
            {datatablesFailed && (
              <p className="px-2 py-1 text-sm text-amber-600 dark:text-amber-400">
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
            {pickerFields.length === 0 && pickerTables.length === 0 && (
              <p className="px-2 py-1 text-sm text-zinc-500">
                {t('list.noMatchingFields')}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default AdditionalFilters
