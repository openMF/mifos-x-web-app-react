/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { getConfiguration } from '@/lib/fineract-openapi'
import { OfficesApi, type GetOfficesResponse } from '@/fineract-api'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChevronDown, ChevronRight, Plus, Upload } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

const officesApi = new OfficesApi(getConfiguration())

/** Fineract sends the parent office; the generated type leaves it out (ISSUES.md) */
type OfficeWithParent = GetOfficesResponse & {
  parentId?: number | null
  parentName?: string | null
}

interface OfficeNode extends OfficeWithParent {
  id: number
  children: OfficeNode[]
}

/**
 * Nests the flat office list by parentId, children sorted by name, as the
 * Angular web app's tree view does. Offices without a parent are roots.
 */
const buildOfficeTree = (offices: OfficeWithParent[]): OfficeNode[] => {
  const nodes = new Map<number, OfficeNode>()
  offices.forEach(office => {
    if (office.id !== undefined)
      nodes.set(office.id, { ...office, id: office.id, children: [] })
  })
  const roots: OfficeNode[] = []
  nodes.forEach(node => {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const byName = (a: OfficeNode, b: OfficeNode) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  nodes.forEach(node => node.children.sort(byName))
  return roots.sort(byName)
}

const Offices = () => {
  const [offices, setOffices] = useState<OfficeWithParent[]>([])
  const [view, setView] = useState<'list' | 'tree'>('list')
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  // fetch all offices
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await officesApi.retrieveOffices()
        setOffices(response.data || [])
      } catch (err) {
        console.error('Failed to fetch offices', err)
      }
    }
    fetchOffices()
  }, [])

  // filter offices by search term
  const filtered = offices.filter(o =>
    o.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // pagination setup
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setPage(1)
  }

  // tree view: every node starts expanded; a node is tracked only when collapsed
  const tree = buildOfficeTree(offices)
  const toggleNode = (id: number) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const collapseAll = () =>
    setCollapsed(
      new Set(
        offices
          .map(office => office.id)
          .filter((id): id is number => id !== undefined)
      )
    )
  const expandAll = () => setCollapsed(new Set())

  const renderNode = (node: OfficeNode, depth: number) => {
    const id = node.id
    const hasChildren = node.children.length > 0
    const isCollapsed = collapsed.has(id)
    return (
      <li key={id}>
        <div
          className="flex items-center gap-1 py-1"
          style={{ paddingLeft: depth * 24 }}
        >
          {hasChildren ? (
            <button
              type="button"
              aria-label={t(
                isCollapsed ? 'offices.expandOffice' : 'offices.collapseOffice',
                { name: node.name }
              )}
              aria-expanded={!isCollapsed}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => toggleNode(id)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : (
            <span className="inline-block w-6" />
          )}
          <button
            type="button"
            className="text-left text-base font-medium text-zinc-800 dark:text-zinc-100 hover:underline"
            onClick={() => navigate(`/organization/offices/${id}`)}
          >
            {node.name}
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <ul>{node.children.map(child => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          { label: t('offices.manage'), current: true },
        ]}
      />

      {/* action buttons */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={value => {
            if (value === 'list' || value === 'tree') setView(value)
          }}
          className="border rounded-md"
          aria-label={t('offices.viewToggle')}
        >
          <ToggleGroupItem value="list" className="px-4">
            {t('offices.listView')}
          </ToggleGroupItem>
          <ToggleGroupItem value="tree" className="px-4">
            {t('offices.treeView')}
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/offices/create')}
        >
          <Plus className="mr-2" /> {t('offices.create')}
        </Button>

        <Button
          className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer px-6 py-3 text-base text-white"
          onClick={() => navigate('/organization/offices/import')}
        >
          <Upload className="mr-2" /> {t('offices.import')}
        </Button>
      </div>

      {view === 'tree' && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6 p-6">
          <div className="flex gap-3 mb-4">
            <Button variant="outline" size="sm" onClick={expandAll}>
              {t('offices.expandAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              {t('offices.collapseAll')}
            </Button>
          </div>
          {tree.length === 0 ? (
            <div className="text-gray-500">
              {t('offices.messages.noOffices')}
            </div>
          ) : (
            <ul>{tree.map(node => renderNode(node, 0))}</ul>
          )}
        </div>
      )}

      {view === 'list' && (
        <>
          {/* search + pagination controls */}
          <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
            <Input
              placeholder={t('offices.searchPlaceholder')}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="max-w-sm h-11 text-base"
            />

            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[140px] h-11 text-base">
                  <SelectValue
                    placeholder={t('common:pagination.itemsPerPage')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('common:actions.prev')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('common:actions.next')}
              </Button>
            </div>
          </div>

          {/* offices table */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
            <Table>
              <TableCaption className="text-sm text-gray-500 dark:text-gray-400 pt-6 pb-2">
                {t('common:pagination.showing', {
                  current: paginated.length,
                  total: filtered.length,
                  page,
                  pages: totalPages,
                })}
              </TableCaption>
              <TableHeader>
                <TableRow className="text-base">
                  <TableHead className="px-6 py-4">
                    {t('offices.fields.name')}
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    {t('offices.fields.externalId')}
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    {t('offices.fields.parent')}
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    {t('offices.fields.openingDate')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(office => (
                  <TableRow
                    key={office.id}
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-base"
                    onClick={() =>
                      navigate(`/organization/offices/${office.id}`)
                    }
                  >
                    <TableCell className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-100">
                      {office.name}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                      {office.externalId || '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                      {office.parentName || '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-zinc-700 dark:text-zinc-200">
                      {formatDate(office.openingDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

export default Offices
