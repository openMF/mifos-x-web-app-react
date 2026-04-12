/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useNavigate } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTable,
  faList,
  faKey,
  faProjectDiagram,
  faAnchor,
  faRoad,
  faFileAlt,
  faCreditCard,
  faFileWord,
  faClock,
  faCogs,
  faTools,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons'

// List of system options with labels, icons, and paths
const systemItems = [
  { icon: faTable, name: 'Manage Data tables', path: '/system/data-tables' },
  { icon: faCreditCard, name: 'Audit Trails', path: '/system/audit-trails' },
  { icon: faList, name: 'Manage Codes', path: '/system/codes' },
  { icon: faFileWord, name: 'Manage Reports', path: '/system/reports' },
  {
    icon: faKey,
    name: 'Manage Roles and Permissions',
    path: '/system/roles-and-permissions',
  },
  { icon: faClock, name: 'Manage Jobs', path: '/system/jobs' },
  {
    icon: faProjectDiagram,
    name: 'Configure Maker Checker Tasks',
    path: '/system/maker-checker',
  },
  { icon: faCogs, name: 'Configurations', path: '/system/configurations' },
  { icon: faAnchor, name: 'Manage Hooks', path: '/system/hooks' },
  {
    icon: faKey,
    name: 'Account Number Preferences',
    path: '/system/account-number-preferences',
  },
  {
    icon: faRoad,
    name: 'Entity to Entity Mapping',
    path: '/system/entity-mapping',
  },
  {
    icon: faTools,
    name: 'External Services',
    path: '/system/external-services',
  },
  {
    icon: faFileAlt,
    name: 'Manage Surveys',
    path: '/system/surveys',
    disabled: true,
  },
  {
    icon: faKey,
    name: 'Two-Factor Authentication',
    path: '/system/two-factor-auth',
    disabled: true,
  },
  {
    icon: faAnchor,
    name: 'Manage External Events',
    path: '/system/external-events',
  },
]

const System = () => {
  const navigate = useNavigate()

  // Navigate to selected system page
  const handleClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      {/* Breadcrumb navigation */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', current: true },
        ]}
      />

      {/* System options grid */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {systemItems.map(option => (
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

export default System
