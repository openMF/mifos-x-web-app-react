/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import {
  faArrowDown,
  faCalendarAlt,
  faCheck,
  faCog,
  faDollarSign,
  faEnvelope,
  faLock,
  faMoneyBill,
  faPeopleGroup,
  faPen,
  faSitemap,
  faSlidersH,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// list of organization modules with their icons and paths
const organizationItems = [
  { icon: faSitemap, name: 'Manage Offices', path: '/organization/offices' },
  {
    icon: faCog,
    name: 'Currency Configuration',
    path: '/organization/currencies',
  },
  {
    icon: faCalendarAlt,
    name: 'Manage Holidays',
    path: '/organization/holidays',
  },
  {
    icon: faMoneyBill,
    name: 'Manage Funds',
    path: '/organization/manage-funds',
  },
  { icon: faUser, name: 'Manage Employees', path: '/organization/employees' },
  {
    icon: faMoneyBill,
    name: 'Bulk Loan Reassignment',
    path: '/organization/bulkloan',
  },
  {
    icon: faPen,
    name: 'Standing Instructions History',
    path: '/organization/instructions-history',
  },
  {
    icon: faMoneyBill,
    name: 'Teller / Cashier Management',
    path: '/organization/tellers',
  },
  { icon: faPeopleGroup, name: 'Investors', path: '/organization/investors' },
  {
    icon: faCalendarAlt,
    name: 'Working Days',
    path: '/organization/working-days',
  },
  {
    icon: faMoneyBill,
    name: 'Fund Mapping',
    path: '/organization/manage-funds',
  },
  {
    icon: faDollarSign,
    name: 'Payment Type',
    path: '/organization/payment-types',
  },
  {
    icon: faLock,
    name: 'Password Preferences',
    path: '/organization/password-preferences',
  },
  {
    icon: faEnvelope,
    name: 'SMS Campaigns',
    path: '/organization/sms-campaigns',
  },
  {
    icon: faPen,
    name: 'Loan Provisioning Criteria',
    path: '/organization/loan-provisioning',
  },
  { icon: faSlidersH, name: 'AdHocQuery', path: '/organization/adhoc-query' },
  {
    icon: faCheck,
    name: 'Entity Data Table Checks',
    path: '/organization/data-checks',
  },
  { icon: faArrowDown, name: 'Bulk Import', path: '/organization/bulk-import' },
]

const Organization = () => {
  const navigate = useNavigate()

  // navigate to clicked item path
  const handleClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', current: true },
        ]}
      />

      {/* organization options grid */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {organizationItems.map(option => (
            <div
              key={option.name}
              onClick={() => handleClick(option.path)}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <FontAwesomeIcon
                  icon={option.icon}
                  className="text-zinc-700 dark:text-zinc-300 w-4 h-4"
                />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {option.name}
                </span>
              </div>
              <FontAwesomeIcon
                icon={faArrowDown}
                className="text-zinc-500 dark:text-zinc-300 w-3 h-3"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Organization
