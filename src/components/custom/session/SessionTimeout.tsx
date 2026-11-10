/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useIdleTimeout } from '@/hooks/use-idle-timeout'
import { useLogout } from '@/hooks/use-logout'
import { envConfig } from '@/lib/env-config'

/**
 * Signs the user out after the configured idle time
 * (MIFOS_SESSION_IDLE_TIMEOUT), and warns first so they can stay signed in.
 */
const SessionTimeout = () => {
  const { t } = useTranslation('common')
  const logout = useLogout()
  const { secondsLeft, staySignedIn } = useIdleTimeout(
    envConfig.sessionIdleTimeout,
    logout
  )

  return (
    <AlertDialog
      open={secondsLeft !== null}
      onOpenChange={open => {
        // Escape or a click outside counts as staying
        if (!open) staySignedIn()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('session.timeoutTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              t={t}
              i18nKey="session.timeoutMessage"
              values={{ seconds: secondsLeft }}
              components={{
                1: <span className="font-semibold tabular-nums" />,
              }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* A plain button, so closing the dialog does not count as staying */}
          <Button variant="outline" onClick={() => logout()}>
            {t('session.signOutNow')}
          </Button>
          <AlertDialogAction
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            onClick={staySignedIn}
          >
            {t('session.staySignedIn')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SessionTimeout
