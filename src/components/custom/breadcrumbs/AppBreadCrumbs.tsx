/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { SlashIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Crumb {
  label: string
  href?: string
  current?: boolean
}

interface AppBreadCrumbsProps {
  items: Crumb[]
}

export const AppBreadCrumbs = ({ items }: AppBreadCrumbsProps) => {
  const navigate = useNavigate()

  return (
    <Breadcrumb className="mb-8">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrent = item.current ?? isLast

          return [
            <BreadcrumbItem key={`item-${item.label}`}>
              {item.href && !isCurrent ? (
                <BreadcrumbLink
                  onClick={() => navigate(item.href!)}
                  className="cursor-pointer text-blue-600 hover:text-blue-600"
                >
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="font-semibold text-gray-700 dark:text-gray-300">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>,

            !isLast && (
              <BreadcrumbSeparator key={`sep-${item.label}`}>
                <SlashIcon className="h-4 w-4" />
              </BreadcrumbSeparator>
            ),
          ]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
