/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MifosLogo from '@/assets/images/MifosX_logo.png'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hook'
import { logout } from '@/pages/login/loginSlice'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Network,
  LogOut,
  Cog,
  User,
  HandCoins,
  Wallet,
  BarChart3,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export const AppSidebar = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation('common')

  const { user } = useAppSelector((state) => state.auth)
  const permissions = user?.permissions || []
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }
  
  const menuItems = [
    { icon: <Home size={24}  />, label: 'Home', route: 'dashboard', requiredPermission: null}, //This will be always visible
    { icon: <User size={24} />, label: 'Clients', route: 'clients', requiredPermission: 'READ_CLIENT'},
    { icon: <HandCoins size={24} />, label: 'Loans', route: 'navigation', requiredPermission: 'READ_LOAN'},
    { icon: <Wallet size={24} />, label: 'Savings', route: 'individual-collection-sheet', requiredPermission: 'READ_SAVINGSACCOUNT'},
    { icon: <BarChart3 size={24} />, label: 'Reports', route: 'reports', requiredPermission: 'READ_REPORT'},
    { icon: <Network size={24} />, label: 'Accounting', route: 'accounting', requiredPermission: 'READ_ACCOUNT'}
  ]

  return (
    <Sidebar className="w-20 bg-white border-r flex flex-col items-center py-6 shadow-md">
          <div className="mb-10 px-4">
             <img
                src={MifosLogo}
                alt="Mifos X"
                className="h-10 cursor-pointer transition-all duration-200 hover:scale-105"
                onClick={() => navigate('/dashboard')}
              />
          </div>
          <TooltipProvider>
        <SidebarContent className="w-full flex flex-col items-center gap-6">
          <SidebarMenu className="flex flex-col items-center gap-4 w-full">
            {/*Dynamic Rendering with .filter() and .map()*/}
            {menuItems
              .filter(item => 
                // The filter function that decides who sees what.
                // An item is kept if it requires no permission OR the user's permissions list and that includes the required one.
                !item.requiredPermission || permissions.includes(item.requiredPermission) || permissions.includes('ALL_FUNCTIONS')
              )
              .map((item) => (
                // The map function takes the filtered data and transforms it into the UI components.
                <SidebarMenuItem key={item.route} className="flex justify-center w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all"
                        onClick={() => navigate(`/${item.route}`)}
                        aria-label={item.label}
                      >
                        {item.icon}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            <div className="mt-auto pt-10 flex flex-col items-center gap-4 w-full">
              {permissions.includes('ALL_FUNCTIONS') && ( // Conditional rendering with '&&'
                <SidebarMenuItem className="flex justify-center w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton className="w-12 h-12 flex items-center justify-center rounded-xl" onClick={() => navigate('/settings')}>
                        <Cog size={24} />
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Settings</p></TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem className="flex justify-center w-full">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={24} />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right"><p>Logout</p></TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarContent>
      </TooltipProvider>
    </Sidebar>
  )
}