/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CodesApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const codesApi = new CodesApi(getConfiguration())

/** Codes (GET /codes) a Dropdown column can use, and a load error if any */
export const useCodeOptions = () => {
  const { t } = useTranslation('datatables')
  const [codes, setCodes] = useState<{ id: string; name: string }[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ignore = false
    const fetchCodes = async () => {
      try {
        const res = await codesApi.retrieveCodes()
        if (ignore) return
        setCodes(
          (res.data ?? [])
            .filter(code => code.name)
            .map(code => ({ id: code.name!, name: code.name! }))
        )
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch codes', err)
        setFailed(true)
      }
    }
    fetchCodes()
    return () => {
      ignore = true
    }
  }, [])

  return {
    codes,
    error: failed ? t('manage.errors.codesLoadFailed') : null,
  }
}
