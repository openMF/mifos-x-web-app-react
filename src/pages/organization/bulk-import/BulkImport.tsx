/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { BULK_IMPORTS } from './bulk-imports-data'
import { FileSpreadsheet, ChevronDown, ArrowRight } from 'lucide-react'

export const BulkImport = () => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }))
  }

  // Split options into two equal columns matching Angular layout
  const mid = Math.ceil(BULK_IMPORTS.length / 2)
  const leftColumn = BULK_IMPORTS.slice(0, mid)
  const rightColumn = BULK_IMPORTS.slice(mid)

  const renderImportItem = (item: (typeof BULK_IMPORTS)[0]) => {
    const isExpanded = !!expanded[item.name]

    return (
      <div
        key={item.name}
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/organization/bulk-import/${item.name}`)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            navigate(`/organization/bulk-import/${item.name}`)
          }
        }}
        className="flex items-start justify-between p-3.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-700/30 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#1074b9]"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-md bg-[#1074b9]/10 text-[#1074b9] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1074b9] group-hover:text-white transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 dark:text-zinc-100 group-hover:text-[#1074b9] transition-colors">
                {item.name}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {isExpanded && (
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={e => toggleExpand(item.name, e)}
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          title="Toggle description"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumb Navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Bulk Import', current: true },
        ]}
      />

      {/* Main Card with 2-Column Responsive List */}
      <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {/* Left Column */}
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-zinc-700/50">
              {leftColumn.map(renderImportItem)}
            </div>

            {/* Right Column */}
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-zinc-700/50">
              {rightColumn.map(renderImportItem)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BulkImport
