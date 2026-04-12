/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Pencil } from 'lucide-react'

import { getConfiguration } from '@/lib/fineract-openapi'
import {
  GlobalConfigurationApi,
  type GlobalConfigurationPropertyData,
} from '@/fineract-api'

const api = new GlobalConfigurationApi(getConfiguration())

const Configurations = () => {
  const [configs, setConfigs] = useState<GlobalConfigurationPropertyData[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.retrieveConfiguration()
        setConfigs(res.data.globalConfiguration ?? [])
      } catch (e) {
        console.error('Failed to fetch configurations', e)
      }
    })()
  }, [])

  const handleToggle = async (name?: string) => {
    if (!name) return
    setConfigs(prev =>
      prev.map(c => (c.name === name ? { ...c, enabled: !c.enabled } : c))
    )
  }

  const handleEdit = async (row: GlobalConfigurationPropertyData) => {
    if (!row.name) return

    const hasString = row.stringValue !== undefined && row.stringValue !== null
    const current = hasString ? (row.stringValue ?? '') : String(row.value ?? 0)
    const next = window.prompt(
      `Set ${row.name} ${hasString ? 'string' : 'numeric'} value:`,
      current
    )
    if (next == null) return

    setConfigs(prev =>
      prev.map(c =>
        c.name === row.name
          ? hasString
            ? { ...c, stringValue: next }
            : { ...c, value: Number(next) }
          : c
      )
    )
  }

  const rows = configs.filter(c =>
    (c.name ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Configurations', current: true },
        ]}
      />

      {/* Filter */}
      <div className="mb-4">
        <Input
          placeholder="Filter by name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="max-w-md h-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">Name</TableHead>
              <TableHead className="px-6 py-3">Status</TableHead>
              <TableHead className="px-6 py-3">Value</TableHead>
              <TableHead className="px-6 py-3">String Value</TableHead>
              <TableHead className="px-6 py-3">Date Value</TableHead>
              <TableHead className="px-6 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.name}>
                <TableCell className="px-6 py-3 font-medium">
                  {row.name}
                </TableCell>

                <TableCell className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!row.enabled}
                      onCheckedChange={() => handleToggle(row.name)}
                    />
                    <span
                      className={
                        row.enabled ? 'text-green-600' : 'text-rose-500'
                      }
                    >
                      {row.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-3">{row.value ?? 0}</TableCell>
                <TableCell className="px-6 py-3">
                  {row.stringValue ?? ''}
                </TableCell>
                <TableCell className="px-6 py-3">
                  {row.dateValue ?? ''}
                </TableCell>

                <TableCell className="px-6 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(row)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-zinc-500"
                >
                  No configurations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Configurations
