/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useTranslation } from 'react-i18next'

/**
 * Marks what the assistant wrote as AI-generated, next to its name, so it is
 * never mistaken for a record from the core banking system.
 */
export function AiBadge() {
  const { t } = useTranslation('copilot')
  return (
    <span
      title={t('aiBadge.title')}
      className="inline-flex h-4 shrink-0 items-center rounded-sm border border-[#1074b9]/30 bg-[#1074b9]/5 px-1 text-[10px] leading-none font-semibold tracking-wide text-[#1074b9] uppercase dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300"
    >
      {t('aiBadge.label')}
    </span>
  )
}
