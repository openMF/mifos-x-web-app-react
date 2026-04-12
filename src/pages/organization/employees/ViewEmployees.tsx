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
import { StaffApi, type StaffData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

const staffApi = new StaffApi(getConfiguration())

const ViewEmployees = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [emp, setEmp] = useState<StaffData>()

  // fetch employee details
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await staffApi.retrieveOne8(Number(id))
        setEmp(res.data)
      } catch (err) {
        console.error('Failed to fetch employee', err)
      }
    }
    fetchEmployee()
  }, [id])

  // show loader until employee data is fetched
  if (!emp) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* breadcrumbs navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Manage Employees', href: '/organization/employees' },
          { label: `${emp.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {/* edit button */}
        <div className="flex max-w-2xl mx-auto mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            onClick={() => navigate(`/organization/employees/${emp.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Manage Employees
        </h2>

        {/* employee details */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">First Name</div>
          <div>{emp.firstname || '—'}</div>

          <div className="font-medium">Last Name</div>
          <div>{emp.lastname || '—'}</div>

          <div className="font-medium">Office</div>
          <div>{emp.officeName || '—'}</div>

          <div className="font-medium">Is Loan Officer</div>
          <div>{emp.isLoanOfficer ? 'Yes' : 'No'}</div>

          <div className="font-medium">Status</div>
          <div>{emp.isActive ? 'Active' : 'Inactive'}</div>

          <div className="font-medium">Joining Date</div>
          <div>{emp.joiningDate}</div>
        </div>

        {/* back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/organization/employees')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewEmployees
