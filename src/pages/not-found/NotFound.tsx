/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const NotFound = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const handleClick = () => {
    navigate(-1)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3498db] text-white">
      <h1 className="font-bold text-[10rem] leading-none">404</h1>
      <p className="text-xl mt-4">{t('status.pageNotExist')}</p>
      <Button
        onClick={handleClick}
        className="mt-6 bg-white text-black font-semibold hover:bg-gray-100 cursor-pointer"
      >
        <ArrowLeft className="mr-1" />
        {t('actions.back')}
      </Button>
    </div>
  )
}

export default NotFound
