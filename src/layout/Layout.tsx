/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MfNavbar from '@/components/custom/navbar/MfNavbar'
import { AppSidebar } from '@/components/custom/sidebar/AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <MfNavbar />
          <main className="flex-1 p-6 bg-gray-50 dark:bg-zinc-900">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Layout
