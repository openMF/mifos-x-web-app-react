/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRepeat,
  faPlus,
  faSearch,
  faLink,
  faMoneyBill,
  faProjectDiagram,
  faChartBar,
  faCog,
  faList,
  faCalendar,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons'

import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line react-refresh/only-export-components
export const accountingItems = [
  {
    icon: faRepeat,
    name: 'Frequent Postings',
    path: '/accounting/journal-entries/frequent-postings',
  },
  {
    icon: faProjectDiagram,
    name: 'Chart of Accounts',
    path: '/accounting/chart-of-accounts',
  },
  {
    icon: faPlus,
    name: 'Create Journal Entries',
    path: '/accounting/journal-entries/create',
  },
  { icon: faCog, name: 'Closing Entries', path: '/accounting/closing-entries' },
  {
    icon: faSearch,
    name: 'Search Journal Entries',
    path: '/accounting/journal-entries',
  },
  {
    icon: faList,
    name: 'Accounting Rules',
    path: '/accounting/accounting-rules',
  },
  {
    icon: faLink,
    name: 'Accounts Linked to Financial Activities',
    path: '/accounting/financial-activity-mappings',
  },
  { icon: faCalendar, name: 'Accruals', path: '/accounting/accruals' },
  {
    icon: faMoneyBill,
    name: 'Migrate Opening Balances (Office-wise)',
    path: '/accounting/opening-balances',
  },
  {
    icon: faChartBar,
    name: 'Provisioning Entries',
    path: '/accounting/provisioning-entries',
  },
]

const Accounting = () => {
  const navigate = useNavigate()

  const handleClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {accountingItems.map(option => (
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

export default Accounting
