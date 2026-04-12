/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import mifosLogo from '@/assets/images/image-removebg-preview-transparent.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-900 px-4 flex flex-col items-center justify-start pt-24">
      <h1 className="absolute top-6 left-6 text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
        {t('nav.welcomeHome')}
      </h1>

      <img
        src={mifosLogo}
        alt={t('ui.mifosLogo')}
        className="h-28 sm:h-36 md:h-40 mt-10 mb-6 drop-shadow-lg"
      />

      <div className="w-full max-w-xl px-2">
        <Input
          type="text"
          placeholder={t('ui.searchActivityPlaceholder')}
          className="w-full px-4 sm:px-6 py-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
      </div>

      <Button
        className="flex items-center gap-2 mt-6 px-4 sm:px-6 py-2 bg-[#76C47A] hover:bg-[#22B24C] text-white rounded-lg shadow transition cursor-pointer text-sm sm:text-base"
        onClick={() => navigate('/dashboard')}
      >
        <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
        {t('nav.dashboard')}
      </Button>
    </div>
  )
}

export default Home
