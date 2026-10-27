/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import MifosLogo from '@/assets/images/MifosX_logo.png'
import UserPlaceholder from '@/assets/images/user_placeholder.png'
import { useLogout } from '@/hooks/use-logout'
import { useAppSelector } from '@/app/hook'
import { getTenantId } from '@/lib/http-client'
import { getOidcUserManager } from '@/lib/oidc-config'
import { LogoutConfirmDialog } from '@/components/custom/logout/LogoutConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GLOBAL_SHORTCUTS,
  type GlobalShortcut,
} from '@/hooks/use-global-shortcuts'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTachometerAlt,
  faLocationArrow,
  faCheck,
  faServer,
  faBell,
  faSync,
  faPlus,
  faSitemap,
  faKeyboard,
  faQuestionCircle,
  faUsers,
  faUser,
  faBuilding,
  faCog,
  faSignOutAlt,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

type SidebarItem = {
  icon: IconDefinition
  labelKey: ParseKeys<'common'>
  route: string
}

const MAIN_ITEMS: SidebarItem[] = [
  { icon: faTachometerAlt, labelKey: 'nav.dashboard', route: 'dashboard' },
  { icon: faLocationArrow, labelKey: 'nav.navigation', route: 'navigation' },
  {
    icon: faCheck,
    labelKey: 'nav.checkerInboxAndTasks',
    route: 'checker-inbox-and-tasks/checker-inbox',
  },
  {
    icon: faServer,
    labelKey: 'nav.collectionSheet',
    route: 'collection-sheet',
  },
  {
    icon: faServer,
    labelKey: 'nav.individualCollectionSheet',
    route: 'individual-collection-sheet',
  },
  { icon: faBell, labelKey: 'nav.notifications', route: 'notifications' },
  {
    icon: faSync,
    labelKey: 'nav.frequentPostings',
    route: 'accounting/journal-entries/frequent-postings',
  },
  {
    icon: faPlus,
    labelKey: 'nav.createJournalEntry',
    route: 'accounting/journal-entries/create',
  },
  {
    icon: faSitemap,
    labelKey: 'nav.chartOfAccounts',
    route: 'accounting/chart-of-accounts',
  },
]

export const AppSidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const handleLogout = useLogout()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { t } = useTranslation('common')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const authUser = useAppSelector(state => state.auth.user) as {
    username?: string
    userName?: string
  } | null
  const [oidcUsername, setOidcUsername] = useState<string | null>(null)

  useEffect(() => {
    const manager = getOidcUserManager()
    manager
      ?.getUser()
      .then(user => {
        const name = (user?.profile?.preferred_username ||
          user?.profile?.name ||
          user?.profile?.sub) as string | undefined
        if (name) setOidcUsername(name)
      })
      .catch(() => null)
  }, [])

  const tenant = getTenantId()
  const username =
    authUser?.username || authUser?.userName || oidcUsername || 'mifos'

  useEffect(() => {
    setShortcutsOpen(false)
  }, [pathname])

  const handleHome = () => {
    navigate('/home')
  }

  const handleClick = (page: string) => {
    navigate(`/${page}`)
  }

  return (
    <Sidebar
      className="h-screen flex flex-col border-r border-gray-200 w-[255px] bg-white dark:bg-gray-900 dark:border-gray-800"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {/* Navigation Panel Header */}
        <div className="flex flex-col items-center pt-5 pb-1">
          {/* app-brand */}
          <button
            type="button"
            className="flex flex-col items-center cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={handleHome}
          >
            <img
              src={MifosLogo}
              alt="app logo"
              className="h-12 w-12 object-contain transition-transform duration-200 hover:scale-105"
            />
            <span className="text-[28px] font-bold text-center text-[#212529] dark:text-gray-100 mt-2.5 leading-tight tracking-tight">
              Mifos&reg; X
            </span>
          </button>

          {/* app-user */}
          <div className="mt-5 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src={UserPlaceholder}
                alt="app-user-photo"
                className="w-14 h-14 object-contain"
              />
            </div>
            <p className="mt-3 text-[13.5px] text-[#616161] dark:text-gray-400 font-normal">
              {tenant} / {username}
            </p>

            {/* Profile Action Icons */}
            <div className="flex items-center justify-center space-x-7 mt-3.5">
              <button
                type="button"
                className="text-[#212529] dark:text-gray-300 hover:text-primary transition-colors cursor-pointer p-0.5"
                onClick={() => handleClick('settings')}
                aria-label={t('tooltips.settings', 'Settings')}
                title={t('tooltips.settings', 'Settings')}
              >
                <FontAwesomeIcon icon={faCog} className="text-[19px]" />
              </button>
              <button
                type="button"
                className="text-[#212529] dark:text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                onClick={() => setLogoutOpen(true)}
                aria-label={t('tooltips.signOut', 'Sign Out')}
                title={t('tooltips.signOut', 'Sign Out')}
                data-testid="sidebar-logout"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="text-[19px]" />
              </button>
            </div>
          </div>
        </div>

        {/* nav-item-sep */}
        <hr className="border-t border-gray-200 dark:border-gray-800 w-full my-5" />

        {/* Frequently Accessed (icon-menu) */}
        <div className="px-4">
          <div className="text-[13px] font-medium text-[#616161] dark:text-gray-400 mb-3">
            {t('nav.frequentlyAccessed', 'Frequently Accessed')}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleClick('clients')}
              title={t('nav.clients', 'Clients')}
              aria-label={t('nav.clients', 'Clients')}
              className="flex items-center justify-center h-12 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.14)] hover:shadow-[0_5px_8px_-1px_rgba(0,0,0,0.25)] hover:border-gray-300 transition-all cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faUser}
                className="text-[#212529] dark:text-gray-200 text-[18px]"
              />
            </button>
            <button
              type="button"
              onClick={() => handleClick('groups')}
              title={t('nav.groups', 'Groups')}
              aria-label={t('nav.groups', 'Groups')}
              className="flex items-center justify-center h-12 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.14)] hover:shadow-[0_5px_8px_-1px_rgba(0,0,0,0.25)] hover:border-gray-300 transition-all cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faUsers}
                className="text-[#212529] dark:text-gray-200 text-[18px]"
              />
            </button>
            <button
              type="button"
              onClick={() => handleClick('centers')}
              title={t('nav.centers', 'Centers')}
              aria-label={t('nav.centers', 'Centers')}
              className="flex items-center justify-center h-12 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.14)] hover:shadow-[0_5px_8px_-1px_rgba(0,0,0,0.25)] hover:border-gray-300 transition-all cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-[#212529] dark:text-gray-200 text-[18px]"
              />
            </button>
          </div>
        </div>

        {/* nav-item-sep */}
        <hr className="border-t border-gray-200 dark:border-gray-800 w-full my-5" />

        {/* Main Items Section */}
        <div className="pb-8">
          <div className="text-[13px] font-medium text-[#616161] dark:text-gray-400 mb-1.5 px-4">
            {t('nav.mainItems', 'Main Items')}
          </div>
          <div className="flex flex-col">
            {MAIN_ITEMS.map(({ icon, labelKey, route }) => {
              const isActive =
                pathname === `/${route}` || pathname.startsWith(`/${route}/`)
              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => handleClick(route)}
                  className={`w-full h-[48px] px-4 flex items-center text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                    isActive ? 'bg-[#0000000a] dark:bg-white/10' : ''
                  }`}
                >
                  <span className="w-full h-[24px] flex items-center gap-4">
                    <span className="w-6 h-6 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon
                        icon={icon}
                        className="text-[19px] text-[#212529] dark:text-gray-200"
                      />
                    </span>
                    <span
                      className={`text-[14.5px] leading-[24px] whitespace-nowrap ${
                        isActive
                          ? 'font-semibold text-black dark:text-white'
                          : 'font-medium text-[#212529] dark:text-gray-100'
                      }`}
                    >
                      {t(labelKey)}
                    </span>
                  </span>
                </button>
              )
            })}

            {/* Keyboard Shortcuts */}
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              className="w-full h-[48px] px-4 flex items-center text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="w-full h-[24px] flex items-center gap-4">
                <span className="w-6 h-6 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faKeyboard}
                    className="text-[19px] text-[#212529] dark:text-gray-200"
                  />
                </span>
                <span className="text-[14.5px] font-medium leading-[24px] text-[#212529] dark:text-gray-100 whitespace-nowrap">
                  {t('nav.keyboardShortcuts', 'Keyboard Shortcuts')}
                </span>
              </span>
            </button>

            {/* Help */}
            <a
              href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-[48px] px-4 flex items-center text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="w-full h-[24px] flex items-center gap-4">
                <span className="w-6 h-6 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    className="text-[19px] text-[#212529] dark:text-gray-200"
                  />
                </span>
                <span className="text-[14.5px] font-medium leading-[24px] text-[#212529] dark:text-gray-100 whitespace-nowrap">
                  {t('nav.help', 'Help')}
                </span>
              </span>
            </a>
          </div>
        </div>
      </SidebarContent>

      {/* Keyboard Shortcuts Dialog */}
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
                        {index === shortcut.keys.length - 1
                          ? key.toLowerCase()
                          : key}
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

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => void handleLogout()}
      />
    </Sidebar>
  )
}
