/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { FundsApi, type FundData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const fundsApi = new FundsApi(getConfiguration())

const ViewFunds = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [fund, setFund] = useState<FundData>()

  // fetch fund details
  useEffect(() => {
    const fetchFund = async () => {
      try {
        const res = await fundsApi.retrieveFund(Number(id))
        setFund(res.data)
      } catch (err) {
        console.error('Failed to fetch fund', err)
      }
    }
    if (id) fetchFund()
  }, [id])

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Funds', href: '/organization/manage-funds' },
          { label: fund?.name || 'Fund', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* edit button */}
        <div className="flex max-w-2xl mx-auto mb-6 gap-4">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/organization/manage-funds/${id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Funds
        </h2>

        {/* fund details */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Name</div>
          <div>{fund?.name || '—'}</div>

          <div className="font-medium">External Id</div>
          <div>{fund?.externalId || '—'}</div>
        </div>

        {/* back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/organization/manage-funds')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewFunds
