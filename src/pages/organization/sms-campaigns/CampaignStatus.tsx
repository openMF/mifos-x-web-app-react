/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

import type { EnumOption } from './types'

const COLORS: Record<string, string> = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  closed: 'bg-red-500',
}

/** A coloured dot plus the status name: pending, active or closed */
export const CampaignStatus = ({ status }: { status?: EnumOption }) => {
  const { t } = useTranslation('organization')
  const key = (status?.value ?? '').toLowerCase()
  const label =
    key === 'active' || key === 'pending' || key === 'closed'
      ? t(`smsCampaign.status.${key}`)
      : (status?.value ?? '—')
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${COLORS[key] ?? 'bg-zinc-400'}`}
      />
      {label}
    </span>
  )
}
