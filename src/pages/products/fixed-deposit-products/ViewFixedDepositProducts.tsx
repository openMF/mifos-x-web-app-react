/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  FixedDepositProductApi,
  type GetFixedDepositProductsProductIdResponse,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Separator } from '@radix-ui/react-separator'

// API instance for FD products
const fdApi = new FixedDepositProductApi(getConfiguration())

const ViewFixedDepositProducts = () => {
  const { id } = useParams() // product ID from route params

  const [fdProducts, setFdProducts] =
    useState<GetFixedDepositProductsProductIdResponse>()

  // Fetch FD product details on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fdApi.retrieveOne20(Number(id)) // API call to get FD product by ID
        setFdProducts(res.data)
      } catch (err) {
        console.error('Failed to fetch FD products', err)
      }
    }
    fetchData()
  }, [id])

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumb Navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: ' Fixed Deposit Products',
            href: '/products/fixed-deposit-products',
          },
          { label: fdProducts?.name ?? 'Loan', current: true },
        ]}
      />

      {/* FD Product Details Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* Section: Details */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Details
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Short Name:
          </div>
          <div>{fdProducts?.shortName ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Description:
          </div>
          <div>{fdProducts?.description ?? '—'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Section: Currency */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Currency
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Currency:
          </div>
          <div>{fdProducts?.currency?.name ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Decimal Places:
          </div>
          <div>{fdProducts?.currency?.decimalPlaces ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Currency in multiples of:
          </div>
          <div> </div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Section: Terms */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Terms
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Deposit Amount:
          </div>
          <div>{fdProducts?.maxDepositTerm}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest Compounding Period:
          </div>
          <div>{fdProducts?.interestCompoundingPeriodType?.code ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest Posting Period:
          </div>
          <div>{fdProducts?.interestPostingPeriodType?.code ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Interest Calculated using:
          </div>
          <div>{fdProducts?.interestCalculationType?.code ?? '—'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Days in Year:
          </div>
          <div>
            {fdProducts?.interestCalculationDaysInYearType?.code ?? '—'}
          </div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Section: Settings */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Settings
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Minimum Deposit Term:
          </div>
          <div>{'Missing in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Apply Penal Interest (less):
          </div>
          <div>{fdProducts?.preClosurePenalInterestOnType?.code}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Withhold Tax is Applicable:
          </div>
          <div>{'Missing in OpenApi'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Section: Interest Rate Chart */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Interest Rate Chart
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Name:
          </div>
          <div>{'Missing in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Description:
          </div>
          <div>{'Missing in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            From Date:
          </div>
          <div>{fdProducts?.activeChart?.fromDate}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            End Date:
          </div>
          <div>{'Missing in OpenApi'}</div>

          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Primary Grouping by Amount:
          </div>
          <div>{'Missing in OpenApi'}</div>
        </div>
        <Separator className="my-6 h-[1px] w-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Section: Accounting */}
        <h2 className="text-md font-semibold text-blue-600 mt-5 mb-2 ml-4">
          Accounting
        </h2>
        <div className="p-6 grid grid-cols-2 gap-y-4 text-sm">
          <div className="font-medium text-zinc-500 dark:text-zinc-400">
            Type:
          </div>
          <div>{'Missing in OpenApi'}</div>
        </div>
      </div>
    </div>
  )
}

export default ViewFixedDepositProducts
