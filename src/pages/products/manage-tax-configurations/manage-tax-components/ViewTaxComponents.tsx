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
import {
  TaxComponentsApi,
  type GetTaxesComponentsResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

const taxComponentsApi = new TaxComponentsApi(getConfiguration())

//helper to format date
const formatDateArray = (startDate: unknown) => {
  if (!startDate) return '—'
  if (Array.isArray(startDate)) {
    return new Date(
      startDate[0],
      startDate[1] - 1,
      startDate[2]
    ).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
  return String(startDate)
}

const ViewTaxComponents = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [taxComponent, setTaxComponent] =
    useState<GetTaxesComponentsResponse | null>(null)

  useEffect(() => {
    const fetchTaxComponent = async () => {
      try {
        const res = await taxComponentsApi.retrieveTaxComponent(Number(id))
        setTaxComponent(res.data)
      } catch (err) {
        console.error('Failed to fetch tax component', err)
      }
    }
    fetchTaxComponent()
  }, [id])

  if (!taxComponent) return <div className="p-10 text-center">Loading...</div>

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
            label: 'Tax Components',
            href: '/products/tax-configurations/tax-components',
          },
          { label: `${taxComponent.name}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            onClick={() =>
              navigate(`/products/tax-configurations/tax-components/${id}/edit`)
            }
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Tax Component Details
        </h2>

        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {taxComponent.name}
          </div>

          <div className="font-medium">Percentage</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {taxComponent.percentage?.toFixed(2)} %
          </div>

          <div className="font-medium">Debit Account Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            Missing in OpenAPI
          </div>

          <div className="font-medium">Debit Account</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            Missing in OpenAPI
          </div>

          {taxComponent.creditAccountType && (
            <>
              <div className="font-medium">Credit Account Type</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {taxComponent.creditAccountType?.code}
              </div>
            </>
          )}

          {taxComponent.creditAccount && (
            <>
              <div className="font-medium">Credit Account</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                ({taxComponent.creditAccount?.glCode}){' '}
                {taxComponent.creditAccount?.name}
              </div>
            </>
          )}

          <div className="font-medium">Start Date</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {formatDateArray(taxComponent.startDate)}
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() =>
              navigate('/products/tax-configurations/tax-components')
            }
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewTaxComponents
