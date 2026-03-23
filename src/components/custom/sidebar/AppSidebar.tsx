/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MifosLogo from '@/assets/images/MifosX_logo.png'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/app/hook'
import { logout } from '@/pages/login/loginSlice'
import { useTranslation } from 'react-i18next'
import {
  Gauge,
  Send,
  Check,
  Layers2,
  Bell,
  RefreshCcw,
  Plus,
  Network,
  Keyboard,
  CircleHelp,
  LogOut,
  Cog,
  User,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'

export const AppSidebar = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation('common')

  const handleHome = () => {
    navigate('/home')
  }

  const handleClick = (page: string) => {
    navigate(`/${page}`)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <Sidebar className="w-64 h-screen flex flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800">
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center space-y-3 pt-5">
          <img
            src={MifosLogo}
            alt="Mifos X"
            className="h-20 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={handleHome}
          />
          <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-200">
            Mifos X
          </h1>

          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow">
            <User className="w-6 h-6 text-gray-500 dark:text-gray-300" />
          </div>
          <p className="text-base text-gray-500 dark:text-gray-400">
            default / mifos
          </p>

          <div className="flex space-x-4 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="p-0 h-auto w-auto text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-transparent"
              onClick={() => handleClick('settings')}
              aria-label={t('tooltips.settings')}
            >
              <Cog className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-0 h-auto w-auto text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-transparent"
              onClick={handleLogout}
              aria-label={t('tooltips.signOut')}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 text-base font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t('nav.frequentlyAccessed')}
          </SidebarGroupLabel>
          <SidebarMenu></SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 pb-4 text-base font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t('nav.mainItems')}
          </SidebarGroupLabel>
          <SidebarMenu>
            {[
              {
                icon: <Gauge />,
                label: t('nav.dashboard'),
                route: 'dashboard',
              },
              {
                icon: <Send />,
                label: t('nav.navigation'),
                route: 'navigation',
              },
              {
                icon: <Check />,
                label: t('nav.checkerInboxAndTasks'),
                route: 'checker-inbox-and-tasks/checker-inbox',
              },
              {
                icon: <Layers2 />,
                label: t('nav.individualCollectionSheet'),
                route: 'individual-collection-sheet',
              },
              {
                icon: <Bell />,
                label: t('nav.notifications'),
                route: 'notifications',
              },
              {
                icon: <RefreshCcw />,
                label: t('nav.frequentPostings'),
                route: 'accounting/journal-entries/frequent-postings',
              },
              {
                icon: <Plus />,
                label: t('nav.createJournalEntry'),
                route: 'accounting/journal-entries/create',
              },
              {
                icon: <Network />,
                label: t('nav.chartOfAccounts'),
                route: 'accounting/chart-of-accounts',
              },
            ].map(({ icon, label, route }) => (
              <SidebarMenuItem
                key={label}
                className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                    onClick={() => handleClick(route)}
                  >
                    {icon}
                    <p>{label}</p>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                >
                  <Keyboard />
                  <p>{t('nav.keyboardShortcuts')}</p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-lg font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                >
                  <CircleHelp />
                  <p>
                    <a
                      href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('nav.help')}
                    </a>
                  </p>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
