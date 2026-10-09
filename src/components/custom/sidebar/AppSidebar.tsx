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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLogout } from '@/hooks/use-logout'
import { useFrequentlyAccessed } from '@/hooks/use-frequently-accessed'
import type { ParseKeys } from 'i18next'
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
  type LucideIcon,
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
import {
  GLOBAL_SHORTCUTS,
  type GlobalShortcut,
} from '@/hooks/use-global-shortcuts'
import { useState } from 'react'

type SidebarItem = {
  icon: LucideIcon
  labelKey: ParseKeys<'common'>
  route: string
}

const MAIN_ITEMS: SidebarItem[] = [
  { icon: Gauge, labelKey: 'nav.dashboard', route: 'dashboard' },
  { icon: Send, labelKey: 'nav.navigation', route: 'navigation' },
  {
    icon: Check,
    labelKey: 'nav.checkerInboxAndTasks',
    route: 'checker-inbox-and-tasks/checker-inbox',
  },
  {
    icon: Layers2,
    labelKey: 'nav.individualCollectionSheet',
    route: 'individual-collection-sheet',
  },
  { icon: Bell, labelKey: 'nav.notifications', route: 'notifications' },
  {
    icon: RefreshCcw,
    labelKey: 'nav.frequentPostings',
    route: 'accounting/journal-entries/frequent-postings',
  },
  {
    icon: Plus,
    labelKey: 'nav.createJournalEntry',
    route: 'accounting/journal-entries/create',
  },
  {
    icon: Network,
    labelKey: 'nav.chartOfAccounts',
    route: 'accounting/chart-of-accounts',
  },
]

const MAIN_ROUTES = MAIN_ITEMS.map(item => item.route)

export const AppSidebar = () => {
  const navigate = useNavigate()
  const handleLogout = useLogout()
  const { t } = useTranslation('common')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const handleHome = () => {
    navigate('/home')
  }

  const handleClick = (page: string) => {
    navigate(`/${page}`)
  }

  const frequentRoutes = useFrequentlyAccessed(MAIN_ROUTES)
  const frequentItems = frequentRoutes
    .map(route => MAIN_ITEMS.find(item => item.route === route))
    .filter((item): item is SidebarItem => item !== undefined)

  const renderItem = ({ icon: Icon, labelKey, route }: SidebarItem) => (
    <SidebarMenuItem
      key={route}
      className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <SidebarMenuButton asChild>
        <Button
          variant="ghost"
          className="w-full h-auto! justify-start gap-3 py-2 text-base font-medium text-black dark:text-white hover:text-primary cursor-pointer"
          onClick={() => handleClick(route)}
        >
          <Icon />
          <span className="min-w-0 whitespace-normal! text-left">
            {t(labelKey)}
          </span>
        </Button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar className="h-screen flex flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800">
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
              onClick={() => void handleLogout()}
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
          <SidebarMenu>
            {frequentItems.length > 0 ? (
              frequentItems.map(renderItem)
            ) : (
              <SidebarMenuItem className="px-6 pb-2 text-sm text-gray-500 dark:text-gray-400">
                {t('nav.noFrequentlyAccessed')}
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pt-4 pb-4 text-base font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t('nav.mainItems')}
          </SidebarGroupLabel>
          <SidebarMenu>
            {MAIN_ITEMS.map(renderItem)}

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full h-auto! justify-start gap-3 py-2 text-base font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                  onClick={() => setShortcutsOpen(true)}
                >
                  <Keyboard />
                  <span className="min-w-0 whitespace-normal! text-left">
                    {t('nav.keyboardShortcuts')}
                  </span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full h-auto! justify-start gap-3 py-2 text-base font-medium text-black dark:text-white hover:text-primary cursor-pointer"
                >
                  <CircleHelp />
                  <span className="min-w-0 whitespace-normal! text-left">
                    <a
                      href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('nav.help')}
                    </a>
                  </span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent
          className="max-w-3xl"
          closeButtonClassName="flex size-8 items-center justify-center [&_svg]:size-5"
        >
          <DialogHeader>
            <DialogTitle>{t('nav.keyboardShortcuts')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-[minmax(145px,0.7fr)_1fr] border-b px-3 py-2 text-sm font-semibold text-muted-foreground">
              <span>Shortcuts</span>
              <span>Page or action</span>
            </div>
            {GLOBAL_SHORTCUTS.map((shortcut: GlobalShortcut) => (
              <div
                key={shortcut.id}
                className="grid grid-cols-[minmax(145px,0.7fr)_1fr] items-center gap-4 border-b px-3 py-3 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, index) => (
                    <span key={`${shortcut.id}-${key}`}>
                      {index > 0 && <span className="mr-1">+</span>}
                      <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">
                        {index === 0 ? key : key.toLowerCase()}
                      </kbd>
                    </span>
                  ))}
                </div>
                <span>{shortcut.description}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
