/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { TaxGroupApi, type GetTaxesGroupResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

const taxGroupApi = new TaxGroupApi(getConfiguration())

const formatDateArray = (date: unknown) => {
  if (!date) return '—'
  if (Array.isArray(date)) {
    return new Date(date[0], date[1] - 1, date[2]).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
  return String(date)
}

const ViewTaxGroups = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [taxGroup, setTaxGroup] = useState<GetTaxesGroupResponse | null>(null)

  useEffect(() => {
    const fetchTaxGroup = async () => {
      try {
        const res = await taxGroupApi.retrieveTaxGroup(Number(id))
        setTaxGroup(res.data)
      } catch (err) {
        console.error('Failed to fetch tax group', err)
      }
    }
    fetchTaxGroup()
  }, [id])

  if (!taxGroup) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Tax Configurations',
            href: '/products/tax-configurations',
          },
          {
            label: 'Tax Groups',
            href: '/products/tax-configurations/tax-groups',
          },
          { label: `${taxGroup.name}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            onClick={() =>
              navigate(`/products/tax-configurations/tax-groups/${id}/edit`)
            }
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Tax Group Details
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200 mb-6">
          <div className="font-medium">Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {taxGroup.name}
          </div>
        </div>

        {/* Tax Associations Table */}
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 border-b pb-2 mb-2">
            <div>Tax Component</div>
            <div>Start Date</div>
            <div>End Date</div>
          </div>
          {Array.from(taxGroup.taxAssociations ?? []).map((assoc, index) => {
            const a = assoc
            return (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 text-sm text-zinc-600 dark:text-zinc-400 py-2 border-b"
              >
                <div>{a.taxComponent?.name}</div>
                <div>{formatDateArray(a.startDate)}</div>
                <div>{'Missing from OpenAPI'}</div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/products/tax-configurations/tax-groups')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewTaxGroups
