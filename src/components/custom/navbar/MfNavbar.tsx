/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { SidebarTrigger } from '@/components/ui/sidebar'

import DropDown from '@/components/custom/navbar/Dropdown'
import {
  findActivePath,
  isPathActive,
  navActiveClassName,
} from '@/components/custom/navbar/nav-active'

import {
  Landmark,
  Banknote,
  ChartBar,
  Shield,
  Search,
  Bell,
  Moon,
  User,
  Sun,
  Menu,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/use-logout'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/custom/language-switcher/LanguageSwitcher'

const MfNavbar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const handleLogout = useLogout()
  const { t } = useTranslation([
    'common',
    'accounting',
    'clients',
    'organization',
    'products',
    'loans',
  ])

  const handleNavigate = (path?: string) => {
    if (!path || path.trim() === '') return
    else if (path === 'signout') {
      void handleLogout()
    } else if (path.startsWith('http')) {
      window.open(path, '_blank')
    } else {
      navigate(`/${path.trim()}`)
    }
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const institutionOptions = [
    { label: t('clients:title'), path: 'clients' },
    { label: t('clients:groups'), path: 'groups' },
    { label: t('clients:centers'), path: 'centers' },
    { label: t('accounting:title'), path: 'accounting' },
  ]
  const reportOptions = [
    { label: t('common:actions.all'), path: 'reports' },
    { label: t('clients:title'), path: 'reports/client' },
    { label: t('loans:title'), path: 'reports/loan' },
    { label: t('loans:savings'), path: 'reports/savings' },
    { label: t('organization:nav.funds'), path: 'reports/fund' },
    { label: t('accounting:title'), path: 'reports/accounting' },
  ]
  const adminOptions = [
    { label: t('common:nav.users'), path: 'appusers' },
    { label: t('organization:title'), path: 'organization' },
    { label: t('common:nav.system'), path: 'system' },
    { label: t('products:title'), path: 'products' },
    { label: t('common:nav.templates'), path: 'templates' },
  ]

  const activePath = findActivePath(
    pathname,
    [...institutionOptions, ...reportOptions, ...adminOptions].map(
      option => option.path
    )
  )
  const belongsTo = (options: { path: string }[]) =>
    options.some(option => option.path === activePath)
  // Accounting is also listed under Institution, but the top-level Accounting
  // button owns /accounting so that only one section is highlighted at a time
  const isAccountingActive = isPathActive(pathname, 'accounting')
  const isInstitutionActive =
    !isAccountingActive && belongsTo(institutionOptions)
  const isReportsActive = belongsTo(reportOptions)
  const isAdminActive = belongsTo(adminOptions)

  return (
    <div className="flex justify-between items-center h-auto bg-[#1074b9] px-4 py-2 shadow-3xl text-base text-white">
      {/* Left Menu & Sections */}
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        <SidebarTrigger />

        {/* Compact Menu for small screens */}
        <div className="lg:hidden">
          <DropDown
            name={
              <span className="flex items-center gap-2">
                <Menu className="w-5 h-5" aria-hidden="true" />
                <span className="sr-only">
                  {t('common:accessibility.openNavigationMenu')}
                </span>
              </span>
            }
            options={[
              {
                label: t('common:nav.institution'),
                children: institutionOptions,
              },
              { label: t('accounting:title'), path: 'accounting' },
              { label: t('common:nav.reports'), children: reportOptions },
              { label: t('common:nav.admin'), children: adminOptions },
            ]}
            onSelect={handleNavigate}
            activePath={activePath}
          />
        </div>

        {/* Full Menu for larger screens */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <DropDown
            name={
              <span className="flex items-center gap-2">
                <Landmark /> {t('common:nav.institution')}
              </span>
            }
            options={institutionOptions}
            onSelect={handleNavigate}
            active={isInstitutionActive}
            activePath={activePath}
          />
          <Button
            className={cn(
              'flex items-center gap-2 shadow-none bg-transparent hover:bg-[#0e6aa5] hover:text-white dark:text-white',
              isAccountingActive && navActiveClassName
            )}
            onClick={() => navigate('/accounting')}
            aria-current={isAccountingActive ? 'page' : undefined}
          >
            <Banknote /> {t('accounting:title')}
          </Button>
          <DropDown
            name={
              <span className="flex items-center gap-2">
                <ChartBar /> {t('common:nav.reports')}
              </span>
            }
            options={reportOptions}
            onSelect={handleNavigate}
            active={isReportsActive}
            activePath={activePath}
          />
          <DropDown
            name={
              <span className="flex items-center gap-2">
                <Shield /> {t('common:nav.admin')}
              </span>
            }
            options={adminOptions}
            onSelect={handleNavigate}
            active={isAdminActive}
            activePath={activePath}
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
        <span className="hover:text-gray-200 transition-colors hidden md:block">
          <Search className="w-5 h-5" aria-hidden="true" />
        </span>
        <LanguageSwitcher className="w-[130px] bg-[#1074b9] border-white text-white hover:bg-[#0e6aa5]" />
        <Button
          variant="ghost"
          className="hover:text-gray-200 transition-colors hover:bg-transparent dark:hover:bg-transparent cursor-pointer p-2"
          aria-label={t('common:accessibility.notifications')}
        >
          <Bell className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          className="hover:text-gray-200 transition-colors hover:bg-transparent dark:hover:bg-transparent cursor-pointer p-2"
          onClick={toggleTheme}
          aria-label={
            theme === 'light'
              ? t('common:accessibility.switchToDarkTheme')
              : t('common:accessibility.switchToLightTheme')
          }
          aria-pressed={theme !== 'light'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
        <DropDown
          name={
            <span className="flex items-center gap-2">
              <User aria-hidden="true" />
              <span className="sr-only">
                {t('common:accessibility.userMenu')}
              </span>
            </span>
          }
          options={[
            {
              label: t('common:nav.help'),
              path: 'https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manualsers',
            },
            { label: t('common:nav.profile'), path: 'profile' },
            { label: t('common:nav.settings'), path: 'settings' },
            { label: t('common:actions.signOut'), path: 'signout' },
          ]}
          onSelect={handleNavigate}
        />
      </div>
    </div>
  )
}

export default MfNavbar
