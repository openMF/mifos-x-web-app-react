/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Search, Info } from 'lucide-react'

type InvestorRow = Record<string, unknown>

const Investors = () => {
  const [filters, setFilters] = useState({
    q: '',
    effectiveFrom: '',
    effectiveTo: '',
    settlementFrom: '',
    settlementTo: '',
  })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<InvestorRow[]>([])

  const handleChange = (field: keyof typeof filters, value: string) =>
    setFilters(p => ({ ...p, [field]: value }))

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      setRows([]) // placeholder to show "No data found"
    } catch (err) {
      console.error('Search failed', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Investors', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border shadow p-5">
        <form onSubmit={onSearch} className="p-6">
          {/* Filters grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {/* Search by Text */}
            <div className="space-y-2">
              <Label>Search by Text</Label>
              <Input
                value={filters.q}
                onChange={e => handleChange('q', e.target.value)}
                placeholder="e.g. investor name, ID"
              />
            </div>

            {/* Effective Date From */}
            <div className="space-y-2">
              <Label>Effective Date From</Label>
              <Input
                type="date"
                value={filters.effectiveFrom}
                onChange={e => handleChange('effectiveFrom', e.target.value)}
              />
            </div>

            {/* Effective Date To */}
            <div className="space-y-2">
              <Label>Effective Date To</Label>
              <Input
                type="date"
                value={filters.effectiveTo}
                onChange={e => handleChange('effectiveTo', e.target.value)}
              />
            </div>

            {/* Settlement Date From */}
            <div className="space-y-2">
              <Label>Settlement Date From</Label>
              <Input
                type="date"
                value={filters.settlementFrom}
                onChange={e => handleChange('settlementFrom', e.target.value)}
              />
            </div>

            {/* Settlement Date To */}
            <div className="space-y-2 md:col-span-2 lg:col-span-4">
              <Label>Settlement Date To</Label>
              <Input
                type="date"
                className="md:max-w-sm"
                value={filters.settlementTo}
                onChange={e => handleChange('settlementTo', e.target.value)}
              />
            </div>
          </div>

          {/* Search button */}
          <div className="flex justify-center mt-8">
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white px-6"
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Results / Empty state */}
          <div className="mt-6">
            {rows.length === 0 ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-4 text-blue-800 flex items-center gap-3">
                <Info className="h-5 w-5" />
                <span>No data found</span>
              </div>
            ) : (
              <div>Results here…</div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Investors
