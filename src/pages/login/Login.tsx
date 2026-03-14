/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '@/pages/login/loginSlice'
import { type RootState, type AppDispatch } from '@/app/store'

import mainImg from '@/assets/images/cover_image_resized.webp'
import mifosLogoLight from '@/assets/images/mifos_lg-logo.png'
import mifosLogoDark from '@/assets/images/image-removebg-preview-transparent.png'

import { Sun, Moon, Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { LanguageSwitcher } from '@/components/custom/language-switcher/LanguageSwitcher'
import { envConfig } from '@/lib/env-config'

const Login = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['auth', 'common'])
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)

  const [form, setForm] = useState({ username: '', password: '' })
  const isDockerProxy = !envConfig.apiUrl
  const [server, setServer] = useState(() => {
    if (isDockerProxy) return ''
    return localStorage.getItem('mifosServer') || 'https://localhost:8443'
  })
  const [tenant, setTenant] = useState(() => {
    return localStorage.getItem('mifosTenant') || 'default'
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDockerProxy) {
      localStorage.setItem('mifosServer', server)
    }
    localStorage.setItem('mifosTenant', tenant)
    dispatch(loginUser(form))
  }

  const handleServerChange = (value: string) => {
    setServer(value)
  }

  const handleTenantChange = (value: string) => {
    setTenant(value)
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      <div className="relative hidden lg:flex lg:w-[70%] h-[400px] lg:h-auto">
        <img
          src={mainImg}
          alt="mainImg"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="absolute inset-0 flex flex-col justify-center text-white z-10 px-8 lg:px-16">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Mifos X</h1>
          <p className="text-lg lg:text-2xl max-w-[100%]">
            <Trans
              i18nKey="hero.description"
              ns="auth"
              components={{
                mifosLink: (
                  <a href="https://mifos.org/" className="underline" />
                ),
                communityLink: (
                  <a
                    href="https://mifos.org/resources/community/"
                    className="underline"
                  />
                ),
              }}
            />{' '}
            <a
              href="https://mifos.org/take-action/volunteer/"
              className="underline"
            >
              {t('auth:hero.getInvolved')}
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full min-h-screen lg:w-[30%] bg-white dark:bg-zinc-900 px-4 py-6 sm:px-10 justify-between">
        <div className="lg:h-[10%] flex flex-wrap gap-2 text-center justify-center">
          {!isDockerProxy && (
            <Select value={server} onValueChange={handleServerChange}>
              <SelectTrigger className="w-[160px]">
                <Label className=" text-zinc-900 dark:text-white">
                  {t('auth:login.server')}
                </Label>
                <SelectValue placeholder="https://localhost:8443" />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-800 dark:text-white">
                <SelectGroup>
                  <SelectItem value="https://sandbox.mifos.community">
                    https://sandbox.mifos.community
                  </SelectItem>
                  <SelectItem value="https://demo.mifos.community">
                    https://demo.mifos.community
                  </SelectItem>
                  <SelectItem value="https://localhost:8443">
                    https://localhost:8443
                  </SelectItem>
                  <SelectItem value="http://localhost:4200">
                    http://localhost:4200
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          <LanguageSwitcher className="w-[140px] dark:bg-zinc-800 dark:text-white" />

          <Button onClick={toggleTheme} variant="outline">
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </div>

        <div className="lg:h-[90%] flex flex-col items-center w-full max-w-md mx-auto">
          <img
            src={theme === 'dark' ? mifosLogoDark : mifosLogoLight}
            alt="mifosLogo"
            className="h-[130px] m-6"
          />

          <Select value={tenant} onValueChange={handleTenantChange}>
            <SelectTrigger className="w-full max-w-xs">
              <Label className="text-zinc-900 dark:text-white">
                {t('auth:login.tenant')}
              </Label>
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-800 dark:text-white">
              <SelectGroup>
                <SelectItem value="default">Default</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xs flex flex-col items-center mt-6"
          >
            <Input
              name="username"
              value={form.username}
              onChange={handleChange}
              type="text"
              placeholder={t('auth:login.username')}
              className="dark:bg-zinc-800 dark:text-white mb-4"
            />

            <div className="relative w-full mb-4">
              <Input
                name="password"
                value={form.password}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth:login.password')}
                className="dark:bg-zinc-800 dark:text-white pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                onMouseDown={e => e.preventDefault()}
                aria-label={
                  showPassword
                    ? t('auth:login.hidePassword')
                    : t('auth:login.showPassword')
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Eye className="h-4 w-4 text-zinc-500" />
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-base dark:text-white">
                {t('auth:login.rememberMe')}
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{t('auth:login.error')}</p>
            )}

            <Button
              type="submit"
              className="w-full text-base bg-sky-600 hover:bg-sky-700 cursor-pointer"
              disabled={loading}
            >
              {loading ? t('auth:login.submitting') : t('auth:login.submit')}
            </Button>
          </form>

          <Button variant="ghost" className="m-6 text-base cursor-pointer">
            {t('auth:login.forgotPassword')}
          </Button>

          <div className="flex flex-wrap justify-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  {t('common:nav.resources')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white ">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer">
                    {' '}
                    <a href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual">
                      {t('common:nav.userManual')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://cwiki.apache.org/confluence/display/FINERACT/Apache+Fineract+1.0+Functional+Specifications">
                      {t('common:nav.functionalSpecifications')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://cwiki.apache.org/confluence/display/FINERACT/Contributor%27s+Zone">
                      {t('common:nav.developerZone')}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  {t('common:nav.community')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://groups.google.com/g/mifosusers">
                      {t('common:nav.userGroup')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://groups.google.com/g/mifosdeveloper">
                      {t('common:nav.developerGroup')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://mifos.org/resources/community/communications/#mifos-irc">
                      {t('common:nav.irc')}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  {t('common:nav.contribute')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://mifosforge.jira.com/wiki/spaces/MDZ/pages/92012624/Key+Design+Principles">
                      {t('common:nav.keyDesignPrinciples')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://sourceforge.net/projects/mifos/">
                      {t('common:nav.workingWithCode')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <a href="https://mifos.org/take-action/donate-now/">
                      {t('common:nav.donate')}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="lg:h-[10%] flex flex-col justify-center items-center mt-10 text-zinc-700 dark:text-zinc-300 text-sm">
          <p>
            <span className="font-semibold">{t('common:info.mifos')}</span>{' '}
            250518 - cf693b0f
          </p>
          <p>
            <span className="font-semibold">{t('common:info.fineract')}</span>{' '}
            https://localhost:8443
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
