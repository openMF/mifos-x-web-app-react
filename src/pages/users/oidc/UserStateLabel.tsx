/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'

const STATE_KEYS = {
  USER_STATE_ACTIVE: 'oidcUsers.state.active',
  USER_STATE_INACTIVE: 'oidcUsers.state.inactive',
  USER_STATE_INITIAL: 'oidcUsers.state.initial',
  USER_STATE_LOCKED: 'oidcUsers.state.locked',
} as const

/** A Zitadel user state as a readable, translated label. */
export const UserStateLabel = ({ state }: { state?: string }) => {
  const { t } = useTranslation('auth')
  if (!state) return <>—</>

  const key = STATE_KEYS[state as keyof typeof STATE_KEYS]
  return <>{key ? t(key) : state}</>
}
